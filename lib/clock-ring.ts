import type { ClockZone, TimeExplanation } from "./time-explainer.ts";

// The ring around the clock shows what you SAY when the long hand points at a
// number, like Dutch classroom clocks: 5 and 10 counted from the 12 or the
// halte, "kwart", "half" and "uur". Never 20, 25, 45, 50 or 55, which Dutch
// time never says.

export type RingLabel = {
  /** Clock number the label sits next to (1–12). */
  number: number;
  minute: number;
  text: string;
  zone: ClockZone | "half" | "uur";
  /** The words at this spot, e.g. "tien voor half". */
  words: string;
};

export const RING: RingLabel[] = [
  { number: 1, minute: 5, text: "5", zone: "over", words: "vijf over" },
  { number: 2, minute: 10, text: "10", zone: "over", words: "tien over" },
  { number: 3, minute: 15, text: "kwart", zone: "over", words: "kwart over" },
  { number: 4, minute: 20, text: "10", zone: "voor-half", words: "tien voor half" },
  { number: 5, minute: 25, text: "5", zone: "voor-half", words: "vijf voor half" },
  { number: 6, minute: 30, text: "half", zone: "half", words: "half" },
  { number: 7, minute: 35, text: "5", zone: "over-half", words: "vijf over half" },
  { number: 8, minute: 40, text: "10", zone: "over-half", words: "tien over half" },
  { number: 9, minute: 45, text: "kwart", zone: "voor", words: "kwart voor" },
  { number: 10, minute: 50, text: "10", zone: "voor", words: "tien voor" },
  { number: 11, minute: 55, text: "5", zone: "voor", words: "vijf voor" },
  { number: 12, minute: 0, text: "uur", zone: "uur", words: "uur" },
];

export type GuideMode = "halves" | "quarters";

/**
 * Helpers follow the time on the clock, not the level: two halves (over / voor)
 * near the 12, four quarters with the halte when counting from half.
 */
export function guideModeFor(explanation: TimeExplanation): GuideMode {
  return explanation.anchor === 30 ? "quarters" : "halves";
}
