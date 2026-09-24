export type LearningLevel = 1 | 2 | 3 | 4 | 5;

export type LearningStep = {
  id: LearningLevel;
  title: string;
  shortTitle: string;
  description: string;
  minutes: number[];
  sample: { hour: number; minute: number };
};

export const LEARNING_STEPS: LearningStep[] = [
  {
    id: 1,
    title: "Hele uren",
    shortTitle: "Hele uren",
    description: "De lange wijzer staat op 12.",
    minutes: [0],
    sample: { hour: 3, minute: 0 },
  },
  {
    id: 2,
    title: "Halve uren",
    shortTitle: "Half",
    description: "Bij half kijk je alvast naar het volgende uur.",
    minutes: [0, 30],
    sample: { hour: 8, minute: 30 },
  },
  {
    id: 3,
    title: "Kwartieren",
    shortTitle: "Kwart",
    description: "Een kwartier is 15 minuten.",
    minutes: [0, 15, 30, 45],
    sample: { hour: 8, minute: 15 },
  },
  {
    id: 4,
    title: "Vijf en tien",
    shortTitle: "5 & 10",
    description: "Tel stapjes van vijf vóór of over het uur.",
    minutes: [0, 5, 10, 15, 30, 45, 50, 55],
    sample: { hour: 9, minute: 50 },
  },
  {
    id: 5,
    title: "Rond half",
    shortTitle: "Rond half",
    description: "Vijf of tien minuten vóór en over half.",
    minutes: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55],
    sample: { hour: 8, minute: 25 },
  },
];

const NUMBER_WORDS: Record<number, string> = {
  1: "één",
  2: "twee",
  3: "drie",
  4: "vier",
  5: "vijf",
  6: "zes",
  7: "zeven",
  8: "acht",
  9: "negen",
  10: "tien",
  11: "elf",
  12: "twaalf",
};

export function normalizeHour(hour: number) {
  const normalized = hour % 12;
  return normalized <= 0 ? normalized + 12 : normalized;
}

export function formatDutchTime(hour: number, minute: number) {
  const current = normalizeHour(hour);
  const next = normalizeHour(current + 1);
  const currentWord = NUMBER_WORDS[current];
  const nextWord = NUMBER_WORDS[next];

  const phrases: Record<number, string> = {
    0: `${currentWord} uur`,
    5: `vijf over ${currentWord}`,
    10: `tien over ${currentWord}`,
    15: `kwart over ${currentWord}`,
    20: `tien voor half ${nextWord}`,
    25: `vijf voor half ${nextWord}`,
    30: `half ${nextWord}`,
    35: `vijf over half ${nextWord}`,
    40: `tien over half ${nextWord}`,
    45: `kwart voor ${nextWord}`,
    50: `tien voor ${nextWord}`,
    55: `vijf voor ${nextWord}`,
  };

  return phrases[minute] ?? `${currentWord} uur`;
}

export function formatDigitalTime(hour: number, minute: number) {
  return `${String(normalizeHour(hour)).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function minuteHint(minute: number) {
  if (minute === 0) return "De lange wijzer staat op 12. Zeg: ‘uur’.";
  if (minute === 15) return "De lange wijzer staat op 3. Dat is kwart over.";
  if (minute === 30) return "De lange wijzer staat op 6. Noem het volgende uur.";
  if (minute === 45) return "De lange wijzer staat op 9. Dat is kwart voor het volgende uur.";
  if (minute < 20) return "De lange wijzer is net voorbij 12: zeg ‘over’.";
  if (minute < 30) return "We gaan richting half: zeg ‘voor half’ en noem het volgende uur.";
  if (minute < 45) return "We zijn voorbij half: zeg ‘over half’ en noem het volgende uur.";
  return "De lange wijzer gaat naar 12: zeg ‘voor’ en noem het volgende uur.";
}

export function normalizeSpokenText(value: string) {
  return value
    .toLocaleLowerCase("nl-NL")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function pronunciationScore(expected: string, spoken: string) {
  const expectedWords = normalizeSpokenText(expected).split(" ").filter(Boolean);
  const spokenWords = normalizeSpokenText(spoken).split(" ").filter(Boolean);
  const matches = expectedWords.filter((word) => spokenWords.includes(word)).length;
  return expectedWords.length ? matches / expectedWords.length : 0;
}
