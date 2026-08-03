/**
 * Best-effort secret redaction applied to Slack thread transcripts before
 * they're sent to a third-party AI provider (Gemini/Groq). ThreadExtract's
 * whole purpose is pulling raw, unfiltered Slack conversations out of a
 * workspace — those threads can and do contain credentials, tokens, or
 * card numbers someone pasted while debugging. This is pattern-based, not
 * exhaustive: it catches well-known token shapes and obvious secret
 * material, not every possible sensitive string.
 */

interface RedactionRule {
  label: string;
  pattern: RegExp;
}

const RULES: RedactionRule[] = [
  { label: "PRIVATE-KEY", pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g },
  { label: "AWS-ACCESS-KEY", pattern: /\bAKIA[0-9A-Z]{16}\b/g },
  { label: "SLACK-TOKEN", pattern: /\bxox[baprs]-[0-9A-Za-z-]{10,}\b/g },
  { label: "GITHUB-TOKEN", pattern: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/g },
  { label: "JWT", pattern: /\bey[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g },
  { label: "OPENAI-KEY", pattern: /\bsk-[A-Za-z0-9]{20,}\b/g },
  { label: "BEARER-TOKEN", pattern: /\bBearer\s+[A-Za-z0-9\-._~+/]{15,}=*/g },
  // Card-number-shaped digit runs (13-19 digits, optionally grouped by
  // spaces/dashes) — not Luhn-validated, so this is deliberately permissive
  // rather than trying to be a precise card-number detector.
  { label: "CARD-NUMBER", pattern: /\b\d(?:[ -]?\d){12,18}\b/g },
];

export function redactSecrets(text: string): string {
  return RULES.reduce((acc, rule) => acc.replace(rule.pattern, `[REDACTED-${rule.label}]`), text);
}
