// Content for the "Rond half" mini-lesson. Every line is shown and spoken, then
// the screen's time phrase is spoken. All lines are pre-generated clips.

export type LessonScreen = {
  title: string;
  hour: number;
  minute: number;
  lines: string[];
};

export const RONDHALF_LESSON: LessonScreen[] = [
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
];

/** The final "try it" screen: the child drags the long hand from 8:00 to 8:25. */
export const RONDHALF_CHALLENGE = {
  title: "Nu jij!",
  start: { hour: 8, minute: 0 },
  target: { hour: 8, minute: 25 },
  lines: ["Zet de klok op vijf voor half negen.", "Sleep de lange blauwe wijzer."],
  success: "Super! Dat is vijf voor half negen.",
};
