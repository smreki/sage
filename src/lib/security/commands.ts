const blockedPatterns = [/\brm\s+-rf\b/i, /\bmkfs\b/i, /\bdd\s+if=/i, /\bshutdown\b/i, /\breboot\b/i, /\bsudo\b/i];
const blockedOperators = ["&&", "||", ";", "|", "`", "\n"];

export function assessSuggestedCommand(command: string | undefined) {
  const normalized = command?.trim();

  if (!normalized) {
    return {
      allowed: false,
      reason: "No suggested command was returned."
    };
  }

  if (blockedOperators.some((operator) => normalized.includes(operator))) {
    return {
      allowed: false,
      reason: "Only a single plain command is allowed in v1."
    };
  }

  if (blockedPatterns.some((pattern) => pattern.test(normalized))) {
    return {
      allowed: false,
      reason: "This suggested command is blocked by local safety rules."
    };
  }

  return {
    allowed: true,
    reason: undefined,
    command: normalized
  };
}
