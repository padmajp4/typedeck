/**
 * Curated preview strings, mixing what different kinds of font-checking
 * actually need: full pangrams for general legibility, alphabet/numeral runs
 * for glyph shapes and figures, and short phrases for judging display weight
 * the way a headline or logotype would be judged.
 */
const PANGRAMS = [
  "The quick brown fox jumps over the lazy dog",
  "Pack my box with five dozen liquor jugs",
  "How vexingly quick daft zebras jump",
  "Sphinx of black quartz, judge my vow",
  "The five boxing wizards jump quickly",
  "Waltz, bad nymph, for quick jigs vex",
  "Jackdaws love my big sphinx of quartz",
  "Quick zephyrs blow, vexing daft Jim",
];

const CHARACTER_SETS = [
  "ABCDEFGHIJKLM abcdefghijklm 0123456789",
  "NOPQRSTUVWXYZ nopqrstuvwxyz !?&@#$%",
  "1234567890 $42.50 (2026) 100%",
];

const DISPLAY_PHRASES = [
  "Design with confidence",
  "Less noise, more signal",
  "Handwritten, not handmade",
  "Built for the modern web",
  "Say more with less",
  "Form follows function",
  "Simple, clear, honest",
];

const SAMPLE_TEXTS = [...PANGRAMS, ...CHARACTER_SETS, ...DISPLAY_PHRASES];

/** Picks a sample different from the one currently shown, where possible. */
export function randomSampleText(current: string) {
  const pool = SAMPLE_TEXTS.filter((text) => text !== current);
  const options = pool.length ? pool : SAMPLE_TEXTS;
  return options[Math.floor(Math.random() * options.length)];
}
