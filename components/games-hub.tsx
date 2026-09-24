"use client";

import { ArrowLeft, CalendarDays, Eye, Hand, Target } from "lucide-react";
import { useState, type ComponentType } from "react";
import { CountAroundGame } from "@/components/count-around-game";
import { HourHandGame } from "@/components/hour-hand-game";
import { SetClockExercise } from "@/components/set-clock-exercise";
import { Button } from "@/components/ui/button";
import type { LearningStep } from "@/lib/dutch-time";
import type { AnswerResult, SavedProgress } from "@/lib/progress";

type GameId = "zet-de-klok" | "tel-mee" | "korte-wijzer" | "mijn-dag";

const GAMES: { id: GameId; title: string; text: string; icon: ComponentType<{ "aria-hidden"?: boolean }> }[] = [
  { id: "tel-mee", title: "Tel mee rond de klok", text: "Tik 1 tot 12 en hoor de tijd meelopen.", icon: Hand },
  { id: "korte-wijzer", title: "Korte wijzer eerst", text: "Alleen de korte wijzer: hoe laat is het ongeveer?", icon: Eye },
  { id: "zet-de-klok", title: "Zet de klok", text: "Hoor een tijd en zet de wijzers goed.", icon: Target },
  { id: "mijn-dag", title: "Mijn dag", text: "Opstaan, school, eten, slapen: zet de klok.", icon: CalendarDays },
];

type GamesHubProps = {
  step: LearningStep;
  speak: (texts: string | string[]) => void;
  trickyMinutes: SavedProgress["trickyMinutes"];
  showHelpers: boolean;
  onAnswer: (result: Omit<AnswerResult, "level">) => void;
  onStar: () => void;
};

/** The "Spelen" tab: a choice of games, each played full-width. */
export function GamesHub({ step, speak, trickyMinutes, showHelpers, onAnswer, onStar }: GamesHubProps) {
  const [game, setGame] = useState<GameId | null>(null);

  if (!game) {
    return (
      <section className="games-hub" aria-labelledby="games-title">
        <span className="eyebrow">Spelen</span>
        <h2 id="games-title">Kies een spel</h2>
        <div className="games-grid">
          {GAMES.map(({ id, title, text, icon: Icon }) => (
            <button key={id} type="button" className={`game-card game-card--${id}`} onClick={() => setGame(id)}>
              <span className="game-card-icon"><Icon aria-hidden /></span>
              <strong>{title}</strong>
              <small>{text}</small>
            </button>
          ))}
        </div>
      </section>
    );
  }

  return (
    <div className="game-frame">
      <Button variant="outline" size="sm" className="game-back" onClick={() => setGame(null)}>
        <ArrowLeft aria-hidden="true" /> Alle spelletjes
      </Button>
      {game === "tel-mee" && <CountAroundGame speak={speak} onStar={onStar} />}
      {game === "korte-wijzer" && <HourHandGame speak={speak} onStar={onStar} />}
      {(game === "zet-de-klok" || game === "mijn-dag") && (
        <SetClockExercise
          key={`${game}-${step.id}`}
          variant={game === "mijn-dag" ? "mijn-dag" : "missie"}
          step={step}
          speak={speak}
          trickyMinutes={trickyMinutes}
          showHelpers={showHelpers}
          onAnswer={onAnswer}
          onMissionDone={onStar}
        />
      )}
    </div>
  );
}
