import {
  EvalRunner,
  loadSampleDataset,
  formatEvalReport,
  formatJSON,
  saveResult,
} from "@repo/rag";

const DATA_DIR = "scripts/eval-results";

const CONFIGS = [
  { strategy: "vector" as const, rerank: false, topK: 20, topN: 20 },
  { strategy: "hybrid" as const, rerank: false, topK: 20, topN: 20 },
  { strategy: "hybrid" as const, rerank: true, topK: 20, topN: 20 },
];

async function main() {
  const useJSON = process.argv.includes("--json");
  const save = !process.argv.includes("--no-save");

  console.log("Loading sample dataset...");
  const dataset = loadSampleDataset();
  console.log(`Dataset: ${dataset.name} (${dataset.queries.length} queries)\n`);

  const deps = {
    embedText: async () => {
      throw new Error(
        "embedText not implemented — run `pnpm build` on packages/ai first",
      );
    },
    retrieve: async () => {
      throw new Error(
        "retrieve not implemented — run `pnpm build` on packages/rag first",
      );
    },
    rerank: async () => {
      throw new Error(
        "rerank not implemented — run `pnpm build` on packages/rag first",
      );
    },
  };

  const runner = new EvalRunner(deps);

  for (const config of CONFIGS) {
    const label = `strategy=${config.strategy} rerank=${config.rerank}`;
    console.log("=".repeat(60));
    console.log(`Running eval: ${label}`);
    console.log("=".repeat(60));

    try {
      const result = await runner.run(dataset, config);

      if (useJSON) {
        console.log(formatJSON(result));
      } else {
        console.log(formatEvalReport(result));
      }

      if (save) {
        const slug = `${config.strategy}-${config.rerank ? "rerank" : "no-rerank"}`;
        const filePath = `${DATA_DIR}/${slug}.json`;
        await saveResult(result, filePath);
        console.log(`\nSaved to ${filePath}`);
      }
    } catch (err) {
      console.error(
        `Eval failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    console.log();
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
