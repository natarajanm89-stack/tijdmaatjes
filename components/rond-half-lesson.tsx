"use client";

import { ArrowLeft, ArrowRight, Check, Volume2 } from "lucide-react";
import { useState } from "react";
import { ClockFace } from "@/components/clock-face";
import { PhraseChips } from "@/components/time-explanation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { formatDutchTime } from "@/lib/dutch-time";
import { RONDHALF_CHALLENGE, RONDHALF_LESSON } from "@/lib/rond-half-lesson";
import { explainTime } from "@/lib/time-explainer";

const CHALLENGE_INDEX = RONDHALF_LESSON.length;

/** What to say when a screen opens: its lines, then its time phrase. */
export function lessonScreenSpeech(index: number) {
  if (index >= CHALLENGE_INDEX) return RONDHALF_CHALLENGE.lines;
  const screen = RONDHALF_LESSON[index];
  return [...screen.lines, formatDutchTime(screen.hour, screen.minute)];
}

type RondHalfLessonProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  speak: (texts: string[]) => void;
  onChallengeSolved: () => void;
};

// Remount (via `key`) to restart from the first screen.
export function RondHalfLesson({ open, onOpenChange, speak, onChallengeSolved }: RondHalfLessonProps) {
  const [index, setIndex] = useState(0);
  const [challengeTime, setChallengeTime] = useState(RONDHALF_CHALLENGE.start);
  const [solved, setSolved] = useState(false);

  const isChallenge = index === CHALLENGE_INDEX;
  const screen = isChallenge ? null : RONDHALF_LESSON[index];
  const shown = screen ?? challengeTime;
  const explanation = explainTime(shown.hour, shown.minute);

  function goTo(nextIndex: number) {
    setIndex(nextIndex);
    speak(lessonScreenSpeech(nextIndex));
  }

  function moveChallengeClock(hour: number, minute: number) {
    if (solved) return;
    setChallengeTime({ hour, minute });
    const { target } = RONDHALF_CHALLENGE;
    if (hour === target.hour && minute === target.minute) {
      setSolved(true);
      speak([RONDHALF_CHALLENGE.success]);
      onChallengeSolved();
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="lesson-dialog">
        <div className="lesson-progress" aria-label={`Stap ${index + 1} van ${CHALLENGE_INDEX + 1}`}>
          {Array.from({ length: CHALLENGE_INDEX + 1 }, (_, dot) => (
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
            onChange={moveChallengeClock}
          />

          <div className="lesson-copy">
            <span className="eyebrow">Rond half</span>
            <DialogTitle className="lesson-title">{screen?.title ?? RONDHALF_CHALLENGE.title}</DialogTitle>
            <DialogDescription asChild>
              <div className="lesson-lines" lang="nl-NL">
                {(screen?.lines ?? RONDHALF_CHALLENGE.lines).map((line) => <p key={line}>{line}</p>)}
              </div>
            </DialogDescription>
            {(screen || solved) && <PhraseChips explanation={explanation} className="lesson-phrase" />}
            {solved && (
              <p className="lesson-success" aria-live="polite">
                <Check aria-hidden="true" /> {RONDHALF_CHALLENGE.success} Je verdient een ster.
              </p>
            )}
          </div>
        </div>

        <div className="lesson-actions">
          <Button variant="outline" onClick={() => speak(lessonScreenSpeech(index))}>
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
