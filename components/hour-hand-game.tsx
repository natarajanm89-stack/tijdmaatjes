"use client";

import { ArrowRight, Eye, Lightbulb, RotateCcw, Sparkles, Star, Volume2 } from "lucide-react";
import { useState } from "react";
import { ClockFace } from "@/components/clock-face";
import { PhraseChips } from "@/components/time-explanation";
import { Button } from "@/components/ui/button";
import { formatDutchTime } from "@/lib/dutch-time";
import { createHourHandRounds, HOUR_HAND_LINES, hourHandChoices, hourHandKind, type HourHandKind } from "@/lib/games";
import { SET_CLOCK_LINES } from "@/lib/set-clock-mission";
import { explainTime } from "@/lib/time-explainer";

const ROUNDS = 5;

type HourHandGameProps = {
  speak: (texts: string | string[]) => void;
  onStar: () => void;
};

type Phase = "intro" | "asking" | "wrong" | "revealed" | "done";

/**
 * Korte wijzer eerst: only the short hand is shown. Is it just past an hour,
 * about half, or almost the next hour? Then the long hand appears.
 */
export function HourHandGame({ speak, onStar }: HourHandGameProps) {
  // Only mounted on the client once the game opens, so random rounds can't cause a hydration mismatch.
  const [rounds, setRounds] = useState(() => createHourHandRounds(ROUNDS));
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("intro");
  const [attempts, setAttempts] = useState(0);
  const [firstTry, setFirstTry] = useState(0);
  const [wrongKind, setWrongKind] = useState<HourHandKind | null>(null);

  const round = rounds[Math.min(index, rounds.length - 1)];
  const choices = hourHandChoices(round.hour);
  const correctKind = hourHandKind(round.minute);
  const phrase = formatDutchTime(round.hour, round.minute);
  const revealed = phase === "revealed" || phase === "done";

  function ask(nextIndex: number) {
    setIndex(nextIndex);
    setAttempts(0);
    setWrongKind(null);
    setPhase("asking");
    speak(HOUR_HAND_LINES.intro);
  }

  function choose(kind: HourHandKind) {
    if (phase !== "asking" && phase !== "wrong") return;
    if (kind !== correctKind) {
      setAttempts((value) => value + 1);
      setWrongKind(kind);
      setPhase("wrong");
      speak(HOUR_HAND_LINES.why[correctKind]);
      return;
    }
    if (attempts === 0) {
      setFirstTry((value) => value + 1);
      onStar();
    }
    setPhase("revealed");
    const praise = SET_CLOCK_LINES.correct[index % SET_CLOCK_LINES.correct.length];
    speak([praise, HOUR_HAND_LINES.reveal, phrase]);
  }

  function next() {
    if (index + 1 >= rounds.length) {
      setPhase("done");
      return;
    }
    ask(index + 1);
  }

  function again() {
    setRounds(createHourHandRounds(ROUNDS));
    setFirstTry(0);
    ask(0);
  }

  return (
    <div className="setclock-layout">
      <section className="setclock-clock" aria-label="Klok met alleen de korte wijzer">
        <div className="card-kicker"><Eye aria-hidden="true" /> Alleen de korte wijzer</div>
        <ClockFace
          hour={round.hour}
          minute={round.minute}
          hideMinuteHand={!revealed}
          guide={revealed ? explainTime(round.hour, round.minute) : null}
          ring={revealed}
        />
      </section>

      <section className="setclock-task" aria-labelledby="hourhand-title">
        <span className="eyebrow">Spelen</span>
        <h2 id="hourhand-title">Korte wijzer eerst</h2>

        {phase === "intro" && (
          <div className="setclock-intro">
            <p>De korte wijzer vertelt het uur. Kijk waar hij staat:</p>
            <ul>
              <li>vlak <strong>na</strong> een getal: net na dat uur</li>
              <li><strong>midden</strong> tussen twee getallen: ongeveer half</li>
              <li>vlak <strong>vóór</strong> een getal: bijna dat uur</li>
            </ul>
            <Button size="lg" className="listen-button setclock-start" onClick={() => ask(0)}>
              <Sparkles aria-hidden="true" /> Start
            </Button>
          </div>
        )}

        {(phase === "asking" || phase === "wrong" || phase === "revealed") && (
          <>
            <p className="question-label">Klok {index + 1} van {rounds.length} · Hoe laat is het ongeveer?</p>
            <div className="answer-choices hourhand-choices">
              {choices.map((choice) => {
                const state = revealed && choice.kind === correctKind
                  ? "is-correct"
                  : phase === "wrong" && choice.kind === wrongKind
                    ? "is-wrong"
                    : "";
                return (
                  <button
                    key={choice.kind}
                    type="button"
                    className={`answer-choice ${state}`}
                    onClick={() => choose(choice.kind)}
                    disabled={revealed}
                  >
                    <span>{choice.text}</span>
                  </button>
                );
              })}
            </div>
            <div className={`feedback-box ${phase === "wrong" ? "wrong" : revealed ? "correct" : ""}`} aria-live="polite">
              {phase === "asking" && (
                <Button variant="outline" size="sm" onClick={() => speak(HOUR_HAND_LINES.intro)}>
                  <Volume2 aria-hidden="true" /> Luister
                </Button>
              )}
              {phase === "wrong" && <p><Lightbulb aria-hidden="true" /> {HOUR_HAND_LINES.why[correctKind]}</p>}
              {phase === "revealed" && (
                <div>
                  <p>
                    <Sparkles aria-hidden="true" /> Precies: <PhraseChips explanation={explainTime(round.hour, round.minute)} />
                  </p>
                  <Button onClick={next}>
                    {index + 1 >= rounds.length ? "Klaar" : "Volgende klok"} <ArrowRight aria-hidden="true" />
                  </Button>
                </div>
              )}
            </div>
          </>
        )}

        {phase === "done" && (
          <div className="setclock-done" aria-live="polite">
            <div className="setclock-trophy"><Star aria-hidden="true" fill="currentColor" /></div>
            <h3>Goed gekeken!</h3>
            <p>{firstTry} van {rounds.length} in één keer goed.</p>
            <Button size="lg" className="listen-button" onClick={again}>
              <RotateCcw aria-hidden="true" /> Nog een keer
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
