# Rond half explanations — design

**Goal:** make _vijf/tien voor half_ and _vijf/tien over half_ understandable for 6–8 year olds.

## Teaching model: “de halte”
- The 6 is the halte (bus stop). On the halte it is _half_; half always names the **next** hour.
- Each number is one five-minute jump: 1 jump = _vijf_, 2 jumps = _tien_.
- Before the halte → _voor half_; after it → _over half_.
- The face has four zones, each with a text label (not color alone): over (12–3), voor half (3–6), over half (6–9), voor (9–12).

## Architecture
- `lib/time-explainer.ts` — `explainTime(hour, minute)` returns zone, anchor (12/halte), jumps, named hour, phrase chunks, and three steps (`text` shown, `say` = clip list). Single source for every screen.
- `components/clock-face.tsx` — optional `guide` prop draws zones, halte, jump arcs, and a glow on the named hour.
- `components/time-explanation.tsx` — colored phrase chips and the numbered step list.
- `components/rond-half-lesson.tsx` + `lib/rond-half-lesson.ts` — five narrated screens and a drag challenge (8:00 → 8:25, one star). Auto-opens the first time level 5 is chosen from the mission buttons; `seenRondHalfLesson` is saved in progress; replay via “Uitleg: de halte”.

## Surfaces
- **Ontdek:** overlay on level 5; chips at all levels.
- **Oefen:** wrong answer → overlay on the question clock + spoken three steps (all levels).
- **Praat:** chips + “Waarom zeg je dit?” shows and speaks the steps.

## Narration
All explanation and lesson lines are fixed texts, pre-generated with `pnpm speech:generate` (51 clips beyond the 144 time phrases). Hour words are separate clips so steps don't multiply per hour. `speak()` plays a list of clips in order and a new call interrupts the old one.

## Testing
`pnpm test` (node:test): chunks spell every phrase, jump/anchor/hour for voor/over half, 12 → één wrap, step length ≤ 80, unique clip names. Manual/automated browser pass on desktop and phone width.

## Out of scope
Mini-lessons for levels 1–4; a mascot; per-word highlighting during playback (clips have no word timings).
