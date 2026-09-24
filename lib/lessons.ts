import type { GuideMode } from "./clock-ring.ts";
import type { LearningLevel } from "./dutch-time.ts";

// Mini-lessons that open the first time a level is chosen. Every line is shown
// and spoken, then the screen's time phrase is spoken. The last screen is a
// "Nu jij!" challenge: drag the long hand from `start` to `target`.

export type LessonScreen = {
  title: string;
  hour: number;
  minute: number;
  lines: string[];
};

export type ClockLesson = {
  id: "over-voor" | "rond-half";
  level: LearningLevel;
  /** Shown above each screen title and on the replay button. */
  name: string;
  /** Forces the clock zones; otherwise they follow the time shown. */
  guideMode?: GuideMode;
  screens: LessonScreen[];
  challenge: {
    title: string;
    start: { hour: number; minute: number };
    target: { hour: number; minute: number };
    lines: string[];
    success: string;
  };
};

export type LessonId = ClockLesson["id"];

const OVER_VOOR: ClockLesson = {
  id: "over-voor",
  level: 4,
  name: "Over en voor",
  screens: [
    {
      title: "Start en finish",
      hour: 8,
      minute: 0,
      lines: [
        "Kijk naar de 12. Daar is de start en de finish.",
        "De lange wijzer loopt steeds een rondje, net als een hardloper.",
      ],
    },
    {
      title: "Net weg van de start",
      hour: 8,
      minute: 5,
      lines: [
        "De lange wijzer is één sprong voorbij de 12.",
        "Eén sprong is vijf minuten. Kijk maar: naast de 1 staat een groene 5.",
        "Net na de start zeg je: over.",
      ],
    },
    {
      title: "Twee sprongen over",
      hour: 8,
      minute: 10,
      lines: [
        "Twee sprongen na de 12. Tel mee: vijf, tien.",
        "Dus is het tien over.",
      ],
    },
    {
      title: "Bijna bij de finish",
      hour: 8,
      minute: 50,
      lines: [
        "Nu is de lange wijzer bijna terug bij de 12.",
        "Nog twee sprongen tot de finish. Dat is tien minuten.",
        "Vlak vóór de finish zeg je: voor.",
      ],
    },
    {
      title: "Nog één sprong",
      hour: 8,
      minute: 55,
      lines: [
        "Nog één sprong tot de finish: vijf voor.",
        "Als je voor zegt, noem je het volgende uur. Dat komt eraan.",
      ],
    },
  ],
  challenge: {
    title: "Nu jij!",
    start: { hour: 8, minute: 0 },
    target: { hour: 8, minute: 50 },
    lines: ["Zet de klok op tien voor negen.", "Sleep de lange blauwe wijzer."],
    success: "Super! Dat is tien voor negen.",
  },
};

const ROND_HALF: ClockLesson = {
  id: "rond-half",
  level: 5,
  name: "Rond half",
  guideMode: "quarters",
  screens: [
    {
      title: "De halte",
      hour: 8,
      minute: 30,
      lines: [
        "Kijk naar de 6. Dat is de halte.",
        "Staat de lange wijzer op de halte? Dan is het half.",
        "De korte wijzer is halverwege naar de 9.",
      ],
    },
    {
      title: "Vóór de halte",
      hour: 8,
      minute: 25,
      lines: [
        "De lange wijzer staat één sprong vóór de halte.",
        "Eén sprong is vijf minuten.",
        "Vóór de halte zeg je: voor half.",
      ],
    },
    {
      title: "Twee sprongen vóór",
      hour: 8,
      minute: 20,
      lines: [
        "Nu zijn het twee sprongen tot de halte.",
        "Twee sprongen is tien minuten.",
      ],
    },
    {
      title: "Voorbij de halte",
      hour: 8,
      minute: 35,
      lines: [
        "De lange wijzer is één sprong voorbij de halte.",
        "Voorbij de halte zeg je: over half.",
      ],
    },
    {
      title: "Twee sprongen voorbij",
      hour: 8,
      minute: 40,
      lines: [
        "Twee sprongen voorbij de halte.",
        "Bij voor half en over half noem je altijd het volgende uur.",
      ],
    },
  ],
  challenge: {
    title: "Nu jij!",
    start: { hour: 8, minute: 0 },
    target: { hour: 8, minute: 25 },
    lines: ["Zet de klok op vijf voor half negen.", "Sleep de lange blauwe wijzer."],
    success: "Super! Dat is vijf voor half negen.",
  },
};

export const LESSONS: ClockLesson[] = [OVER_VOOR, ROND_HALF];

export function lessonForLevel(level: LearningLevel) {
  return LESSONS.find((lesson) => lesson.level === level) ?? null;
}
