import assert from "node:assert/strict";
import { test } from "node:test";
import { hourWord } from "../lib/dutch-time.ts";
import { HOUR_HAND_LINES } from "../lib/games.ts";
import { allNarrationLines, allSpokenTexts, allTimePhrases } from "../lib/speech-clips.ts";
import { allTamilParts, speechParts, TAMIL, tamilClipPath } from "../lib/tamil.ts";

// Dutch content the child is learning or reads on buttons: always spoken in Dutch.
const dutchContent = new Set([
  ...allTimePhrases(),
  ...Array.from({ length: 12 }, (_, index) => hourWord(index + 1)),
  ...Object.values(HOUR_HAND_LINES.choice),
]);

test("every explanation line has a Tamil version, and no Tamil entry is stale", () => {
  const explanations = allNarrationLines().filter((line) => !dutchContent.has(line));
  for (const line of explanations) assert.ok(TAMIL[line], `missing Tamil: ${line}`);
  const narration = new Set(allNarrationLines());
  for (const key of Object.keys(TAMIL)) assert.ok(narration.has(key), `stale Tamil entry: ${key}`);
});

test("Tamil parts contain no Latin words; Dutch words go to the Dutch voice", () => {
  for (const [line, parts] of Object.entries(TAMIL)) {
    for (const part of parts) {
      if (typeof part === "string") {
        assert.ok(/[஀-௿]/.test(part), `not Tamil: ${part}`);
        assert.ok(!/[A-Za-z]/.test(part), `Latin text in Tamil part of "${line}": ${part}`);
        // The Tamil voice misreads digits ("12-இல்" came out as "toilet"): write numbers as words.
        assert.ok(!/\d/.test(part), `digit in Tamil part of "${line}": ${part}`);
      }
    }
  }
  const dutchClips = new Set(allSpokenTexts());
  for (const word of allTamilParts().dutch) assert.ok(dutchClips.has(word), `no Dutch clip for: ${word}`);
});

test("Tamil clip names are unique and time phrases stay Dutch", () => {
  const { tamil } = allTamilParts();
  assert.equal(new Set(tamil.map(tamilClipPath)).size, tamil.length);
  assert.deepEqual(speechParts("vijf voor half negen", "ta"), [{ nl: "vijf voor half negen" }]);
  assert.deepEqual(speechParts("Goed zo!", "nl"), [{ nl: "Goed zo!" }]);
  assert.equal(speechParts("Goed zo!", "ta")[0], "சபாஷ்!");
});
