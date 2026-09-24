"use client";

import { ArrowRight, Check, Lightbulb, RotateCcw, Sparkles, Star, Target, Volume2 } from "lucide-react";
import { useState } from "react";
import { ClockFace } from "@/components/clock-face";
import { ExplanationSteps, PhraseChips, stepsToSpeech } from "@/components/time-explanation";
import { Button } from "@/components/ui/button";
import { formatDutchTime, normalizeHour, type LearningStep } from "@/lib/dutch-time";
import {
  checkClock,
  MISSION_SIZE,
  nextClock,
  recordAnswer,
  SET_CLOCK_LINES,
  startMission,
  wrongFeedback,
  type ClockTime,
  type MissionState,
} from "@/lib/set-clock-mission";
import { explainTime, type ExplanationStep } from "@/lib/time-explainer";

type Phase = "intro" | "setting" | "wrong" | "correct" | "done";

type SetClockExerciseProps = {
  step: LearningStep;
  speak: (texts: string | string[]) => void;
  onStars: (stars: number) => void;
};

// Remount (via `key`) when the level changes to start a fresh mission.
export function SetClockExercise({ step, speak, onStars }: SetClockExerciseProps) {
  // Only mounted on the client once the tab opens, so a random mission can't cause a hydration mismatch.
  const [mission, setMission] = useState<MissionState>(() => startMission(step.minutes));
  const [phase, setPhase] = useState<Phase>("intro");
  const [clock, setClock] = useState<ClockTime>(() => mission.queue[0].start);
  const [feedback, setFeedback] = useState<ExplanationStep[]>([]);
  const [praise, setPraise] = useState(SET_CLOCK_LINES.correct[0]);

  const current = mission.queue[Math.min(mission.index, mission.queue.length - 1)];
  const targetPhrase = formatDutchTime(current.target.hour, current.target.minute);
  const targetExplanation = explainTime(current.target.hour, current.target.minute);
  const prompt = [SET_CLOCK_LINES.prompt, targetPhrase];

  function begin(state: MissionState) {
    const first = state.queue[state.index];
    setClock(first.start);
    setFeedback([]);
    setPhase("setting");
    speak([SET_CLOCK_LINES.prompt, formatDutchTime(first.target.hour, first.target.minute)]);
  }

  function moveHands(hour: number, minute: number) {
    if (phase === "correct" || phase === "done" || phase === "intro") return;
    setClock({ hour, minute });
  }

  function adjust(kind: "hour" | "minute", amount: number) {
    if (kind === "hour") {
      moveHands(normalizeHour(clock.hour + amount), clock.minute);
      return;
    }
    const total = ((clock.hour * 60 + clock.minute + amount) % 720 + 720) % 720;
    moveHands(normalizeHour(Math.floor(total / 60)), total % 60);
  }

  function check() {
    const result = checkClock(current.target, clock);
    // Same rule as the mission score: stars only for original clocks right the first time.
    const firstTry = mission.attempts === 0 && !current.retry;
    setMission((state) => recordAnswer(state, result.correct));
    if (result.correct) {
      const line = SET_CLOCK_LINES.correct[mission.index % SET_CLOCK_LINES.correct.length];
      setPraise(line);
      setPhase("correct");
      speak(line);
      if (firstTry) onStars(1);
      return;
    }
    const steps = wrongFeedback(current.target, result);
    setFeedback(steps);
    setPhase("wrong");
    speak(stepsToSpeech(steps));
  }

  function next() {
    const state = nextClock(mission);
    setMission(state);
    if (state.finished) {
      setPhase("done");
      speak(SET_CLOCK_LINES.done);
      onStars(1);
      return;
    }
    begin(state);
  }

  function newMission() {
    const state = startMission(step.minutes);
    setMission(state);
    begin(state);
  }

  const originals = mission.queue.filter((item) => !item.retry).length;
  const clockNumber = Math.min(mission.index + 1, mission.queue.length);

  return (
    <div className="setclock-layout">
      <section className="setclock-clock" aria-label="Klok om te zetten">
        <div className="card-kicker"><Target aria-hidden="true" /> Zet de wijzers</div>
        <ClockFace
          hour={clock.hour}
          minute={clock.minute}
          interactive={phase === "setting" || phase === "wrong"}
          guide={phase === "wrong" || phase === "correct" ? targetExplanation : null}
          onChange={moveHands}
        />
        {(phase === "setting" || phase === "wrong") && (
          <div className="clock-controls" aria-label="Verplaats de wijzers met knoppen">
            <div>
              <span>Uur</span>
              <Button variant="outline" size="icon" onClick={() => adjust("hour", -1)} aria-label="Eén uur terug">−</Button>
              <Button variant="outline" size="icon" onClick={() => adjust("hour", 1)} aria-label="Eén uur vooruit">+</Button>
            </div>
            <div>
              <span>Minuten</span>
              <Button variant="outline" size="icon" onClick={() => adjust("minute", -5)} aria-label="Vijf minuten terug">−</Button>
              <Button variant="outline" size="icon" onClick={() => adjust("minute", 5)} aria-label="Vijf minuten vooruit">+</Button>
            </div>
          </div>
        )}
      </section>

      <section className="setclock-task" aria-labelledby="setclock-title">
        <div className="practice-meta">
          <div>
            <span className="eyebrow">Missie {step.id} · {step.title}</span>
            <h2 id="setclock-title">Zet de klok</h2>
          </div>
          {phase !== "intro" && phase !== "done" && (
            <div className="setclock-dots" aria-label={`Klok ${clockNumber} van ${mission.queue.length}`}>
              {mission.queue.map((item, index) => (
                <span
                  key={`${item.target.hour}-${item.target.minute}-${index}`}
                  className={`${index < mission.index ? "is-done" : ""} ${index === mission.index ? "is-current" : ""} ${item.retry ? "is-retry" : ""}`}
                />
              ))}
            </div>
          )}
        </div>

        {phase === "intro" && (
          <div className="setclock-intro">
            <p>Je hoort een tijd. Zet de wijzers goed en tik op <strong>Klaar!</strong></p>
            <ul>
              <li>Klok 1 tot 3: de korte wijzer staat al goed. Sleep de lange blauwe wijzer.</li>
              <li>Klok 4 en 5: zet allebei de wijzers.</li>
            </ul>
            <Button size="lg" className="listen-button setclock-start" onClick={() => begin(mission)}>
              <Sparkles aria-hidden="true" /> Start de missie
            </Button>
          </div>
        )}

        {phase !== "intro" && phase !== "done" && (
          <>
            <p className="question-label">Zet de klok op</p>
            <div className="spoken-phrase setclock-phrase">
              <PhraseChips explanation={targetExplanation} />
            </div>
            <p className="setclock-hint">
              {current.retry
                ? "Deze komt terug. Jij kunt het nu!"
                : current.presetHour
                  ? "De korte wijzer staat al goed. Sleep de lange blauwe wijzer."
                  : "Zet allebei de wijzers: eerst de lange, dan de korte."}
            </p>
            <div className="speak-actions">
              <Button variant="outline" size="lg" onClick={() => speak(prompt)}>
                <Volume2 aria-hidden="true" /> Luister
              </Button>
              {phase !== "correct" ? (
                <Button size="lg" className="setclock-check" onClick={check}>
                  <Check aria-hidden="true" /> Klaar!
                </Button>
              ) : (
                <Button size="lg" onClick={next}>
                  {mission.index + 1 >= mission.queue.length ? "Bekijk je missie" : "Volgende klok"} <ArrowRight aria-hidden="true" />
                </Button>
              )}
            </div>

            <div className={`feedback-box ${phase === "wrong" ? "wrong" : phase === "correct" ? "correct" : ""}`} aria-live="polite">
              {phase === "setting" && <p>Kijk eerst naar de lange wijzer.</p>}
              {phase === "wrong" && (
                <div className="hint-explanation">
                  <p><Lightbulb aria-hidden="true" /> Bijna! Probeer het nog eens.</p>
                  <ExplanationSteps steps={feedback} />
                  <Button variant="outline" size="sm" onClick={() => speak(stepsToSpeech(feedback))}>
                    <Volume2 aria-hidden="true" /> Hoor de uitleg
                  </Button>
                </div>
              )}
              {phase === "correct" && (
                <p>
                  <Sparkles aria-hidden="true" /> {praise}{" "}
                  {mission.attempts === 0 && !current.retry ? "Je verdient een ster." : "Goed dat je doorzette!"}
                </p>
              )}
            </div>
          </>
        )}

        {phase === "done" && (
          <div className="setclock-done" aria-live="polite">
            <div className="setclock-trophy"><Star aria-hidden="true" fill="currentColor" /></div>
            <h3>Missie klaar!</h3>
            <p>
              {mission.firstTry} van {originals} klokken in één keer goed.
              {mission.firstTry === MISSION_SIZE ? " Perfect!" : " Oefenen maakt je sterker."}
            </p>
            <p className="setclock-bonus">+1 bonusster voor een hele missie</p>
            <Button size="lg" className="listen-button" onClick={newMission}>
              <RotateCcw aria-hidden="true" /> Nog een missie
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
