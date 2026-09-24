import { formatDutchTime, hourWord, normalizeHour } from "./dutch-time.ts";

// One explanation per clock time, shared by the Ontdek clock, the Oefen hint,
// the Praat coach and the "Rond half" mini-lesson so they always agree.
//
// Teaching model: the 6 is the "halte" (bus stop). Each number on the clock is
// one five-minute jump. Just before the halte you say "voor half", just after it
// "over half", and around half you always name the NEXT hour.

export type ClockZone = "over" | "voor-half" | "over-half" | "voor";
export type ChunkRole = "count" | "direction" | "half" | "hour" | "uur";

export type PhraseChunk = { text: string; role: ChunkRole };

/** `text` is shown; `say` is the list of pre-generated clips played in order. */
export type ExplanationStep = { text: string; say: string[] };

export type TimeExplanation = {
  phrase: string;
  /** The quarter the long hand is in; null exactly on the 12 or the halte. */
  zone: ClockZone | null;
  /** Minute mark the jumps count from (0 = the 12, 30 = the halte, 60 = the next 12). */
  anchor: 0 | 30 | 60 | null;
  /** Five-minute jumps between the anchor and the long hand (1 or 2), else 0. */
  jumps: number;
  /** The hour said in the phrase: the current hour, or the next one from :20 on. */
  namedHour: number;
  chunks: PhraseChunk[];
  steps: ExplanationStep[];
};

const COUNT_WORDS: Record<number, string> = { 1: "vijf", 2: "tien" };

function zoneFor(minute: number): ClockZone | null {
  if (minute === 0 || minute === 30) return null;
  if (minute <= 15) return "over";
  if (minute < 30) return "voor-half";
  if (minute < 45) return "over-half";
  return "voor";
}

const NEXT_HOUR_AT_HALF = "Bij half noem je het volgende uur:";
const NEXT_HOUR = "Noem het volgende uur:";
const CURRENT_HOUR = "Noem het uur van de korte wijzer:";

function hourStep(lead: string, word: string): ExplanationStep {
  return { text: `${lead} ${word}.`, say: [lead, word] };
}

function fixedStep(text: string): ExplanationStep {
  return { text, say: [text] };
}

export function explainTime(hour: number, minute: number): TimeExplanation {
  const current = normalizeHour(hour);
  const next = normalizeHour(current + 1);
  const currentWord = hourWord(current);
  const nextWord = hourWord(next);
  const phrase = formatDutchTime(current, minute);
  const zone = zoneFor(minute);

  const base = { phrase, zone, anchor: null, jumps: 0 } as const;

  switch (minute) {
    case 0:
      return {
        ...base,
        namedHour: current,
        chunks: [{ text: currentWord, role: "hour" }, { text: "uur", role: "uur" }],
        steps: [
          fixedStep("De lange wijzer staat op de 12."),
          fixedStep("Staat hij precies op de 12? Dan zeg je uur."),
          { text: `De korte wijzer wijst het uur aan: ${phrase}.`, say: ["De korte wijzer wijst het uur aan:", phrase] },
        ],
      };
    case 30:
      return {
        ...base,
        namedHour: next,
        chunks: [{ text: "half", role: "half" }, { text: nextWord, role: "hour" }],
        steps: [
          fixedStep("De lange wijzer staat op de halte bij de 6."),
          fixedStep("Op de halte zeg je half."),
          hourStep(NEXT_HOUR_AT_HALF, nextWord),
        ],
      };
    case 15:
    case 45: {
      const over = minute === 15;
      return {
        ...base,
        namedHour: over ? current : next,
        chunks: [
          { text: "kwart", role: "count" },
          { text: over ? "over" : "voor", role: "direction" },
          { text: over ? currentWord : nextWord, role: "hour" },
        ],
        steps: over
          ? [
              fixedStep("De lange wijzer staat op de 3."),
              fixedStep("Een kwart van de klok na de 12: kwart over."),
              hourStep(CURRENT_HOUR, currentWord),
            ]
          : [
              fixedStep("De lange wijzer staat op de 9."),
              fixedStep("Nog een kwart tot de 12: kwart voor."),
              hourStep(NEXT_HOUR, nextWord),
            ],
      };
    }
    case 5:
    case 10: {
      const jumps = minute / 5;
      return {
        ...base,
        anchor: 0,
        jumps,
        namedHour: current,
        chunks: [
          { text: COUNT_WORDS[jumps], role: "count" },
          { text: "over", role: "direction" },
          { text: currentWord, role: "hour" },
        ],
        steps: [
          fixedStep("De lange wijzer is net voorbij de 12."),
          fixedStep(jumps === 1 ? "Eén sprong na de 12: vijf over." : "Twee sprongen na de 12: tien over."),
          hourStep(CURRENT_HOUR, currentWord),
        ],
      };
    }
    case 20:
    case 25: {
      const jumps = (30 - minute) / 5;
      return {
        ...base,
        anchor: 30,
        jumps,
        namedHour: next,
        chunks: [
          { text: COUNT_WORDS[jumps], role: "count" },
          { text: "voor half", role: "direction" },
          { text: nextWord, role: "hour" },
        ],
        steps: [
          fixedStep("De lange wijzer staat vlak vóór de halte bij de 6."),
          fixedStep(jumps === 1
            ? "Nog één sprong tot de halte: vijf voor half."
            : "Nog twee sprongen tot de halte: tien voor half."),
          hourStep(NEXT_HOUR_AT_HALF, nextWord),
        ],
      };
    }
    case 35:
    case 40: {
      const jumps = (minute - 30) / 5;
      return {
        ...base,
        anchor: 30,
        jumps,
        namedHour: next,
        chunks: [
          { text: COUNT_WORDS[jumps], role: "count" },
          { text: "over half", role: "direction" },
          { text: nextWord, role: "hour" },
        ],
        steps: [
          fixedStep("De lange wijzer is net voorbij de halte bij de 6."),
          fixedStep(jumps === 1
            ? "Eén sprong na de halte: vijf over half."
            : "Twee sprongen na de halte: tien over half."),
          hourStep(NEXT_HOUR_AT_HALF, nextWord),
        ],
      };
    }
    case 50:
    case 55: {
      const jumps = (60 - minute) / 5;
      return {
        ...base,
        anchor: 60,
        jumps,
        namedHour: next,
        chunks: [
          { text: COUNT_WORDS[jumps], role: "count" },
          { text: "voor", role: "direction" },
          { text: nextWord, role: "hour" },
        ],
        steps: [
          fixedStep("De lange wijzer gaat bijna naar de 12."),
          fixedStep(jumps === 1 ? "Nog één sprong tot de 12: vijf voor." : "Nog twee sprongen tot de 12: tien voor."),
          hourStep(NEXT_HOUR, nextWord),
        ],
      };
    }
    default:
      // Mirrors formatDutchTime, which also reads off-step minutes as the whole hour.
      return explainTime(current, 0);
  }
}
