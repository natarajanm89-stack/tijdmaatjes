"use client";

import { ArrowLeft, ArrowRight, Check, Volume2 } from "lucide-react";
import { useState } from "react";
import { ClockFace } from "@/components/clock-face";
import { PhraseChips } from "@/components/time-explanation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { formatDutchTime } from "@/lib/dutch-time";
import type { ClockLesson as Lesson } from "@/lib/lessons";
import { explainTime } from "@/lib/time-explainer";

/** What to say when a screen opens: its lines, then its time phrase. */
export function lessonScreenSpeech(lesson: Lesson, index: number) {
  if (index >= lesson.screens.length) return lesson.challenge.lines;
  const screen = lesson.screens[index];
  return [...screen.lines, formatDutchTime(screen.hour, screen.minute)];
}

type ClockLessonProps = {
  lesson: Lesson;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  speak: (texts: string[]) => void;
  onChallengeSolved: () => void;
};

// Remount (via `key`) to restart from the first screen.
export function ClockLesson({ lesson, open, onOpenChange, speak, onChallengeSolved }: ClockLessonProps) {
  const { screens, challenge } = lesson;
  const challengeIndex = screens.length;
  const [index, setIndex] = useState(0);
  const [challengeTime, setChallengeTime] = useState(challenge.start);
  const [solved, setSolved] = useState(false);

  const isChallenge = index === challengeIndex;
  const screen = isChallenge ? null : screens[index];
  const shown = screen ?? challengeTime;
  const explanation = explainTime(shown.hour, shown.minute);

  function goTo(nextIndex: number) {
    setIndex(nextIndex);
    speak(lessonScreenSpeech(lesson, nextIndex));
  }

  function moveChallengeClock(hour: number, minute: number) {
    if (solved) return;
    setChallengeTime({ hour, minute });
    const { target } = challenge;
    if (hour === target.hour && minute === target.minute) {
      setSolved(true);
      speak([challenge.success]);
      onChallengeSolved();
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="lesson-dialog">
        <div className="lesson-progress" aria-label={`Stap ${index + 1} van ${challengeIndex + 1}`}>
          {Array.from({ length: challengeIndex + 1 }, (_, dot) => (
            <span key={dot} className={dot === index ? "is-current" : dot < index ? "is-done" : ""} />
          ))}
        </div>

        <div className="lesson-body">
          <ClockFace
            hour={shown.hour}
            minute={shown.minute}
            compact
            interactive={isChallenge && !solved}
            guide={explanation}
            guideMode={lesson.guideMode}
            minuteNumbers={lesson.minuteNumbers}
            onChange={moveChallengeClock}
          />

          <div className="lesson-copy">
            <span className="eyebrow">{lesson.name}</span>
            <DialogTitle className="lesson-title">{screen?.title ?? challenge.title}</DialogTitle>
            <DialogDescription asChild>
              <div className="lesson-lines" lang="nl-NL">
                {(screen?.lines ?? challenge.lines).map((line) => <p key={line}>{line}</p>)}
              </div>
            </DialogDescription>
            {(screen || solved) && <PhraseChips explanation={explanation} className="lesson-phrase" />}
            {solved && (
              <p className="lesson-success" aria-live="polite">
                <Check aria-hidden="true" /> {challenge.success} Je verdient een ster.
              </p>
            )}
          </div>
        </div>

        <div className="lesson-actions">
          <Button variant="outline" onClick={() => speak(lessonScreenSpeech(lesson, index))}>
            <Volume2 aria-hidden="true" /> Nog eens
          </Button>
          <span className="lesson-nav">
            {index > 0 && (
              <Button variant="outline" onClick={() => goTo(index - 1)} aria-label="Vorige stap">
                <ArrowLeft aria-hidden="true" />
              </Button>
            )}
            {isChallenge ? (
              <Button onClick={() => onOpenChange(false)}>{solved ? "Klaar" : "Later proberen"}</Button>
            ) : (
              <Button onClick={() => goTo(index + 1)}>
                Volgende <ArrowRight aria-hidden="true" />
              </Button>
            )}
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
