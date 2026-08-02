// Curated set of common "worth keeping" Slack reaction conventions, offered
// as checkboxes on the dashboard rather than a free-text field — Slack's
// reaction_added event always reports the shortcode name (e.g. "brain"),
// never the emoji glyph, so a free-text field inviting people to paste an
// actual emoji character would silently never match.
export const TRIGGER_EMOJI_OPTIONS: Array<{ shortcode: string; emoji: string; label: string }> = [
  { shortcode: "brain", emoji: "🧠", label: "brain (default)" },
  { shortcode: "pushpin", emoji: "📌", label: "pushpin" },
  { shortcode: "white_check_mark", emoji: "✅", label: "check mark" },
  { shortcode: "memo", emoji: "📝", label: "memo" },
  { shortcode: "bookmark", emoji: "🔖", label: "bookmark" },
  { shortcode: "star", emoji: "⭐", label: "star" },
  { shortcode: "bulb", emoji: "💡", label: "bulb" },
  { shortcode: "dart", emoji: "🎯", label: "dart" },
];

export const DEFAULT_TRIGGER_EMOJIS = ["brain"];

/** Keeps only shortcodes we actually offer as options — defends against a tampered form field. */
export function sanitizeTriggerEmojis(values: string[]): string[] {
  const allowed = new Set(TRIGGER_EMOJI_OPTIONS.map((o) => o.shortcode));
  const filtered = values.filter((v) => allowed.has(v));
  return filtered.length > 0 ? filtered : DEFAULT_TRIGGER_EMOJIS;
}
