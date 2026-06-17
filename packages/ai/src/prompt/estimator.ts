const CJK_RE = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g;
const CODE_BLOCK_RE = /```[\s\S]*?```/g;

export function estimateTokens(text: string): number {
  let tokenCount = 0;

  const hasCodeBlocks = CODE_BLOCK_RE.test(text);
  CODE_BLOCK_RE.lastIndex = 0;

  if (hasCodeBlocks) {
    const remaining = text;
    let match;
    while ((match = CODE_BLOCK_RE.exec(remaining)) !== null) {
      const codeContent = match[0];
      tokenCount += Math.ceil(codeContent.length / 3);
    }
    const nonCode = remaining.replace(CODE_BLOCK_RE, "");
    tokenCount += estimatePlainText(nonCode);
  } else {
    tokenCount = estimatePlainText(text);
  }

  return tokenCount;
}

function estimatePlainText(text: string): number {
  const cjkChars = text.match(CJK_RE);
  const cjkCount = cjkChars ? cjkChars.length : 0;
  const asciiCount = text.length - cjkCount;

  const cjkTokens = Math.ceil(cjkCount * 1.5);
  const asciiTokens = Math.ceil(asciiCount / 4);

  return cjkTokens + asciiTokens;
}
