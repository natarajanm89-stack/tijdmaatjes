# Zet de klok — design

**Goal:** a dedicated tab where the child sets the clock to a spoken time, extending the lesson's "Nu jij!" challenge with varied combinations.

## Mission
- 5 clocks from the selected level's minutes, no repeated times.
- Clocks 1–3: short hand starts on the right hour (only the long hand moves). Clocks 4–5: both hands start wrong.
- Prompt: phrase chips + spoken "Zet de klok op … <tijd>".
- "Klaar!" checks. Wrong: praise the right hand, spoken "zet …" instruction for the wrong one(s), halte overlay on the clock; try again. A first-try miss comes back once at the end (max 2 retries).
- Stars: 1 per original clock right on the first try, +1 bonus per finished mission. Score card "x van 5 in één keer goed", "Nog een missie".

## Units
- `lib/set-clock-mission.ts` — createMission/startMission, checkClock, recordAnswer/nextClock, settingSteps (imperative instructions), wrongFeedback.
- `lib/clock-geometry.ts` — pointer angle → hour/minute. Fixes the short-hand drag: the `minute × 0.5°` offset is removed before rounding, so at 8:40 a hand dropped near the 9 reads 8.
- `components/set-clock-exercise.tsx` — the tab (intro → setting → wrong/correct → done). Mounted client-side only when the tab opens; `key={level}` restarts it on level change.

## Narration
24 new fixed clips (prompt, praise, "… staat goed!", minute and short-hand instructions), pre-generated like the rest.

## Testing
node:test for mission rules, retries, answer checks, feedback, instruction clips present, and the drag fix; headless walkthrough of a full mission on desktop and phone.

## Out of scope
Timers/speed scoring.
