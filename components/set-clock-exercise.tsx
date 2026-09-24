"use client";

import { ArrowRight, Check, Lightbulb, RotateCcw, Sparkles, Star, Target, Volume2 } from "lucide-react";
import { useState } from "react";
import { ClockFace } from "@/components/clock-face";
import { ExplanationSteps, PhraseChips, stepsToSpeech } from "@/components/time-explanation";
import { Button } from "@/components/ui/button";
import { formatDutchTime, normalizeHour, type LearningStep } from "@/lib/dutch-time";
import { MY_DAY, MY_DAY_LINES } from "@/lib/games";
import {
  checkClock,
  createMyDayMission,
  nextClock,
  recordAnswer,
  SET_CLOCK_LINES,
  startMission,
  startQueue,
  wrongFeedback,
  type ClockTime,
  type MissionClock,
  type MissionState,
} from "@/lib/set-clock-mission";
import type { AnswerResult, SavedProgress } from "@/lib/progress";
import { explainTime, type ExplanationStep } from "@/lib/time-explainer";

type Phase = "intro" | "setting" | "wrong" | "correct" | "done";

type SetClockExerciseProps = {
  /** "missie": five clocks from the level; "mijn-dag": the moments of a child's day, in order. */
  variant: "missie" | "mijn-dag";
  step: LearningStep;
  speak: (texts: string | string[]) => void;
  trickyMinutes: SavedProgress["trickyMinutes"];
  showHelpers: boolean;
  /** Reported once per clock, on its first "Klaar!". */
  onAnswer: (result: Omit<AnswerResult, "level">) => void;
  onMissionDone: () => void;
};

/** What is said when a clock appears. */
function promptFor(clock: MissionClock) {
  if (clock.moment) return [clock.moment.sentence];
  return [SET_CLOCK_LINES.prompt, formatDutchTime(clock.target.hour, clock.target.minute)];
}

// Remount (via `key`) when the level changes to start a fresh mission.
export function SetClockExercise({ variant, step, speak, trickyMinutes, showHelpers, onAnswer, onMissionDone }: SetClockExerciseProps) {
  const myDay = variant === "mijn-dag";
  const createState = () => (myDay ? startQueue(createMyDayMission(MY_DAY)) : startMission(step.minutes, Math.random, trickyMinutes));
  // Only mounted on the client once the tab opens, so a random mission can't cause a hydration mismatch.
  const [mission, setMission] = useState<MissionState>(createState);
  const [phase, setPhase] = useState<Phase>("intro");
  const [clock, setClock] = useState<ClockTime>(() => mission.queue[0].start);
  const [feedback, setFeedback] = useState<ExplanationStep[]>([]);
  const [praise, setPraise] = useState(SET_CLOCK_LINES.correct[0]);

  const current = mission.queue[Math.min(mission.index, mission.queue.length - 1)];
  const targetExplanation = explainTime(current.target.hour, current.target.minute);
  const prompt = promptFor(current);
  // With helpers on, the clock reads the child's own setting live; after a mistake it shows the target.
  const guide = phase === "wrong" || phase === "correct"
    ? targetExplanation
    : showHelpers && phase === "setting"
      ? explainTime(clock.hour, clock.minute)
      : null;

  function begin(state: MissionState) {
    const first = state.queue[state.index];
    setClock(first.start);
    setFeedback([]);
    setPhase("setting");
    speak(promptFor(first));
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
    if (mission.attempts === 0) {
      // Same rule as the mission score: stars and level wins only for original clocks right the first time.
      onAnswer({
        minute: current.target.minute,
        correct: result.correct,
        firstTry: true,
        rewarded: result.correct && !current.retry,
        // A child's day uses fixed times, so it earns stars but doesn't unlock levels.
        levelWin: !myDay,
      });
    }
    setMission((state) => recordAnswer(state, result.correct));
    if (result.correct) {
      const line = SET_CLOCK_LINES.correct[mission.index % SET_CLOCK_LINES.correct.length];
      setPraise(line);
      setPhase("correct");
      speak(line);
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
      speak(myDay ? MY_DAY_LINES.done : SET_CLOCK_LINES.done);
      onMissionDone();
      return;
    }
    begin(state);
  }

  function newMission() {
    const state = createState();
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
          guide={guide}
          ring={showHelpers}
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
            <span className="eyebrow">{myDay ? "Spelen" : `Missie ${step.id} · ${step.title}`}</span>
            <h2 id="setclock-title">{myDay ? "Mijn dag" : "Zet de klok"}</h2>
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
            <p>
              {myDay ? MY_DAY_LINES.intro : "Je hoort een tijd."} Zet de wijzers goed en tik op <strong>Klaar!</strong>
            </p>
            <ul>
              <li>Eerste drie klokken: de korte wijzer staat al goed. Sleep de lange blauwe wijzer.</li>
              <li>Daarna: zet allebei de wijzers.</li>
            </ul>
            <Button size="lg" className="listen-button setclock-start" onClick={() => begin(mission)}>
              <Sparkles aria-hidden="true" /> Start de missie
            </Button>
          </div>
        )}

        {phase !== "intro" && phase !== "done" && (
          <>
            {current.moment && (
              <div className="myday-moment">
                <span aria-hidden="true">{current.moment.emoji}</span>
                <div>
                  <strong>{current.moment.title}</strong>
                  <p>{current.moment.sentence}</p>
                </div>
              </div>
            )}
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
              {mission.firstTry === originals ? " Perfect!" : " Oefenen maakt je sterker."}
            </p>
            <p className="setclock-bonus">+1 bonusster voor een hele missie</p>
            <Button size="lg" className="listen-button" onClick={newMission}>
              <RotateCcw aria-hidden="true" /> {myDay ? "Nog een keer" : "Nog een missie"}
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
