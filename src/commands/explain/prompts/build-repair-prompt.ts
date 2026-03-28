export function buildRepairPrompt(problem: string) {
  return [
    "Re-emit your previous answer as valid JSON only.",
    "Do not include markdown fences, prose, or commentary.",
    `Validation problem: ${problem}`
  ].join("\n");
}
