import { formatContextSection, formatConversationSection, formatInstructionsSection } from "./formatter";
import { countTokens, truncateToTokenLimit } from "./tokenizer";
import type { BudgetAllocation, BuildContextOptions, ContextResult, ConversationMessage, RetrievalChunk, TruncationDetails } from "./types";
import { createLogger } from "@repo/logger";

const logger = createLogger("rag/context/builder");

const DEFAULT_BUDGET_ALLOCATION: BudgetAllocation = {
  context: 70,
  instructions: 15,
  history: 15,
};

const DEFAULT_MAX_CHUNKS = 10;

function resolveBudget(options: BuildContextOptions): BudgetAllocation {
  return {
    ...DEFAULT_BUDGET_ALLOCATION,
    ...options.budgetAllocation,
  };
}

function sortChunksByScoreAsc(chunks: RetrievalChunk[]): RetrievalChunk[] {
  return [...chunks].sort((a, b) => {
    const scoreA = a.rerankScore ?? a.score;
    const scoreB = b.rerankScore ?? b.score;
    return scoreA - scoreB;
  });
}

function buildContextFromChunks(
  chunks: RetrievalChunk[],
  maxTokens: number,
  maxChunks: number,
  includeCitations: boolean,
  includeScores: boolean,
): { text: string; tokenCount: number; usedChunks: RetrievalChunk[]; removedCount: number } {
  let workingChunks = sortChunksByScoreAsc(chunks).slice(0, maxChunks);
  let removedCount = 0;

  let text = formatContextSection(workingChunks, { includeCitations, includeScores });
  let tokens = countTokens(text);

  while (tokens > maxTokens && workingChunks.length > 1) {
    workingChunks.shift();
    removedCount++;
    text = formatContextSection(workingChunks, { includeCitations, includeScores });
    tokens = countTokens(text);
  }

  if (tokens > maxTokens && workingChunks.length > 0) {
    const perChunkBudget = Math.floor(maxTokens / workingChunks.length);
    workingChunks = workingChunks.map((chunk) => {
      const chunkTokens = countTokens(chunk.text);
      if (chunkTokens > perChunkBudget) {
        return { ...chunk, text: truncateToTokenLimit(chunk.text, perChunkBudget) };
      }
      return chunk;
    });
    text = formatContextSection(workingChunks, { includeCitations, includeScores });
    tokens = countTokens(text);
  }

  return { text, tokenCount: tokens, usedChunks: workingChunks, removedCount };
}

function buildHistoryFromMessages(
  messages: ConversationMessage[],
  maxTokens: number,
): { text: string; tokenCount: number; removedCount: number; slidingWindowApplied: boolean } {
  const working = [...messages];
  let removedCount = 0;
  let slidingWindowApplied = false;

  let text = formatConversationSection(working);
  let tokens = countTokens(text);

  while (tokens > maxTokens && working.length > 1) {
    if (working.length <= 2) break;
    working.shift();
    removedCount++;
    text = formatConversationSection(working);
    tokens = countTokens(text);
  }

  if (tokens > maxTokens && working.length >= 4) {
    const half = Math.floor(working.length / 2);
    const oldestHalf = working.splice(0, half);
    const summary = oldestHalf
      .filter((m) => m.role !== "system")
      .map((m) => `${m.role === "user" ? "User asked" : "Assistant responded"}: ${m.content.slice(0, 100)}`)
      .join("; ");

    working.unshift({
      role: "system",
      content: `Earlier conversation summary: ${summary}`,
    });

    text = formatConversationSection(working);
    tokens = countTokens(text);
    slidingWindowApplied = true;

    while (tokens > maxTokens && working.length > 1) {
      const summaryIdx = working.findIndex(
        (m) => m.role === "system" && m.content.startsWith("Earlier conversation summary"),
      );
      if (summaryIdx >= 0 && working.length > 1) {
        const removeIdx = summaryIdx === 0 ? 1 : 0;
        working.splice(removeIdx, 1);
      } else {
        working.shift();
      }
      removedCount++;
      text = formatConversationSection(working);
      tokens = countTokens(text);
    }
  }

  return { text, tokenCount: tokens, removedCount, slidingWindowApplied };
}

export function buildContext(
  _query: string,
  results: RetrievalChunk[],
  options: BuildContextOptions,
): ContextResult {
  const startTime = Date.now();

  const budget = resolveBudget(options);
  const maxChunks = options.maxChunks ?? DEFAULT_MAX_CHUNKS;
  const includeCitations = options.includeCitations !== false;
  const includeScores = options.includeScores ?? false;

  const totalBudget = budget.context + budget.instructions + budget.history;
  if (totalBudget !== 100) {
    logger.warn({ budget, total: totalBudget }, "Budget allocation does not sum to 100");
  }

  const contextBudget = Math.floor(options.modelMaxTokens * budget.context / 100);
  const instructionsBudget = Math.floor(options.modelMaxTokens * budget.instructions / 100);
  const historyBudget = Math.floor(options.modelMaxTokens * budget.history / 100);

  const instructionsText = options.systemInstructions ?? "";
  const instructionsTokenCount = countTokens(instructionsText);

  let adjustedContextBudget = contextBudget;
  let adjustedHistoryBudget = historyBudget;

  if (instructionsTokenCount > instructionsBudget) {
    const overage = instructionsTokenCount - instructionsBudget;
    adjustedContextBudget = Math.max(0, contextBudget - Math.floor(overage / 2));
    adjustedHistoryBudget = Math.max(0, historyBudget - Math.ceil(overage / 2));
    logger.warn(
      { instructionsTokenCount, instructionsBudget, overage },
      "Instructions exceed budget, adjusting context and history budgets",
    );
  }

  const { text: contextText, usedChunks, removedCount: removedChunks } =
    buildContextFromChunks(results, adjustedContextBudget, maxChunks, includeCitations, includeScores);

  const historyMessages = options.conversationHistory ?? [];
  const {
    text: historyText,
    removedCount: removedHistory,
    slidingWindowApplied,
  } = buildHistoryFromMessages(historyMessages, adjustedHistoryBudget);

  const sections: string[] = [];
  if (contextText) sections.push(contextText);
  if (historyText && historyMessages.length > 0) sections.push(historyText);
  if (instructionsText) sections.push(formatInstructionsSection(instructionsText));

  const finalContext = sections.join("\n\n");
  const totalTokenCount = countTokens(finalContext);

  const truncated = removedChunks > 0 || removedHistory > 0 || slidingWindowApplied;

  const truncationDetails: TruncationDetails | null = truncated
    ? {
        reason: [
          removedChunks > 0 ? `${removedChunks} low-score chunk(s) removed` : "",
          removedHistory > 0 ? `${removedHistory} history message(s) removed` : "",
          slidingWindowApplied ? "sliding window applied" : "",
        ]
          .filter(Boolean)
          .join(", "),
        removedChunks,
        removedHistory,
        slidingWindowApplied,
      }
    : null;

  const elapsed = Date.now() - startTime;
  logger.info(
    { chunksUsed: usedChunks.length, totalTokenCount, truncated, elapsed },
    "Context built",
  );

  return {
    context: finalContext,
    tokenCount: totalTokenCount,
    chunksUsed: usedChunks.length,
    truncated,
    truncationDetails,
  };
}
