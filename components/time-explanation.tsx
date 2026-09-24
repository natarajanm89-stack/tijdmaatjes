import type { ExplanationStep, TimeExplanation } from "@/lib/time-explainer";

/**
 * The Dutch phrase as colored chips. Colors match the clock: the count is the
 * long blue hand, the hour is the short orange hand, and "voor half"/"over half"
 * uses the color of the zone the long hand is in.
 */
export function PhraseChips({ explanation, className = "" }: { explanation: TimeExplanation; className?: string }) {
  return (
    <span className={`phrase-chips ${className}`} lang="nl-NL">
      {explanation.chunks.map((chunk, index) => (
        <span
          key={`${chunk.text}-${index}`}
          className={`phrase-chip phrase-chip--${chunk.role} ${chunk.role === "direction" && explanation.zone ? `phrase-chip--${explanation.zone}` : ""}`}
        >
          {chunk.text}
        </span>
      ))}
    </span>
  );
}

export function ExplanationSteps({ steps }: { steps: ExplanationStep[] }) {
  return (
    <ol className="explanation-steps" lang="nl-NL">
      {steps.map((step, index) => (
        <li key={step.text}>
          <span aria-hidden="true">{index + 1}</span>
          <p>{step.text}</p>
        </li>
      ))}
    </ol>
  );
}

/** All clips for a step list, in order, ready for `speak()`. */
export function stepsToSpeech(steps: ExplanationStep[]) {
  return steps.flatMap((step) => step.say);
}
