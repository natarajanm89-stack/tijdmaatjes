"use client";

import { Hand, RotateCcw, Sparkles, Star } from "lucide-react";
import { useState } from "react";
import { ClockFace } from "@/components/clock-face";
import { PhraseChips } from "@/components/time-explanation";
import { Button } from "@/components/ui/button";
import { formatDutchTime, hourWord } from "@/lib/dutch-time";
import { COUNT_AROUND_LINES, countAroundTime } from "@/lib/games";
import { explainTime } from "@/lib/time-explainer";

type CountAroundGameProps = {
  speak: (texts: string | string[]) => void;
  onStar: () => void;
};

const randomHour = () => Math.floor(Math.random() * 12) + 1;

/**
 * Tel mee rond de klok: tap 1 → 12 and the long hand walks one five-minute
 * step per tap while the phrase is spoken ("vijf over acht", "tien over acht" …).
 * Children hear where "over" turns into "voor half" and the hour word changes.
 */
export function CountAroundGame({ speak, onStar }: CountAroundGameProps) {
  // Only mounted on the client once the game opens, so the random hour can't cause a hydration mismatch.
  const [startHour, setStartHour] = useState(randomHour);
  const [step, setStep] = useState(0);
  const [started, setStarted] = useState(false);
  const [hint, setHint] = useState("");

  const time = step === 0 ? { hour: startHour, minute: 0 } : countAroundTime(startHour, step);
  const explanation = explainTime(time.hour, time.minute);
  const done = step === 12;

  function start() {
    setStarted(true);
    speak([COUNT_AROUND_LINES.intro, formatDutchTime(startHour, 0)]);
  }

  function tap(number: number) {
    if (!started || done) return;
    const expected = step + 1;
    if (number !== expected) {
      setHint(`Zoek de ${expected}.`);
      speak([COUNT_AROUND_LINES.find, hourWord(expected)]);
      return;
    }
    const next = countAroundTime(startHour, number);
    setStep(number);
    setHint("");
    if (number === 12) {
      speak([formatDutchTime(next.hour, next.minute), COUNT_AROUND_LINES.done]);
      onStar();
      return;
    }
    speak(formatDutchTime(next.hour, next.minute));
  }

  function again() {
    const hour = randomHour();
    setStartHour(hour);
    setStep(0);
    setHint("");
    speak([COUNT_AROUND_LINES.intro, formatDutchTime(hour, 0)]);
  }

  return (
    <div className="setclock-layout">
      <section className="setclock-clock" aria-label="Tel mee rond de klok">
        <div className="card-kicker"><Hand aria-hidden="true" /> Tik op de getallen</div>
        <ClockFace
          hour={time.hour}
          minute={time.minute}
          guide={explanation}
          ring
          onNumberTap={started ? tap : undefined}
          markedNumbers={Array.from({ length: step }, (_, index) => index + 1)}
        />
      </section>

      <section className="setclock-task" aria-labelledby="count-title">
        <span className="eyebrow">Spelen</span>
        <h2 id="count-title">Tel mee rond de klok</h2>
        {!started ? (
          <div className="setclock-intro">
            <p>{COUNT_AROUND_LINES.intro}</p>
            <p>Luister goed: waar wordt <strong>over</strong> ineens <strong>voor half</strong>?</p>
            <Button size="lg" className="listen-button setclock-start" onClick={start}>
              <Sparkles aria-hidden="true" /> Start
            </Button>
          </div>
        ) : (
          <>
            <p className="question-label">{done ? "Een heel uur rond!" : `Tik op de ${step + 1}`}</p>
            <div className="spoken-phrase setclock-phrase">
              <PhraseChips explanation={explanation} />
            </div>
            <div className="count-progress" aria-label={`${step} van 12 stappen`}>
              {Array.from({ length: 12 }, (_, index) => (
                <span key={index} className={index < step ? "is-done" : ""} />
              ))}
            </div>
            <p className="setclock-hint" aria-live="polite">{hint || "Elke stap is vijf minuten."}</p>
            {done && (
              <div className="setclock-done">
                <div className="setclock-trophy"><Star aria-hidden="true" fill="currentColor" /></div>
                <p>{COUNT_AROUND_LINES.done} Je verdient een ster.</p>
                <Button size="lg" className="listen-button" onClick={again}>
                  <RotateCcw aria-hidden="true" /> Nog een rondje
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
