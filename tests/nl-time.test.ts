import assert from "node:assert/strict";
import { test } from "node:test";
import { handAngles, netherlandsTime } from "../lib/nl-time.ts";

test("shows Dutch time in winter (UTC+1) and summer (UTC+2)", () => {
  assert.deepEqual(netherlandsTime(new Date("2026-01-15T12:34:56Z")), { hour: 13, minute: 34, second: 56 });
  assert.deepEqual(netherlandsTime(new Date("2026-07-15T12:34:56Z")), { hour: 14, minute: 34, second: 56 });
  // Summer time starts on 29 March 2026 at 01:00 UTC: 02:00 becomes 03:00.
  assert.deepEqual(netherlandsTime(new Date("2026-03-29T00:59:59Z")), { hour: 1, minute: 59, second: 59 });
  assert.deepEqual(netherlandsTime(new Date("2026-03-29T01:00:00Z")), { hour: 3, minute: 0, second: 0 });
  assert.deepEqual(netherlandsTime(new Date("2026-06-30T22:15:00Z")), { hour: 0, minute: 15, second: 0 });
});

test("hand angles", () => {
  assert.deepEqual(handAngles({ hour: 15, minute: 0, second: 0 }), { hour: 90, minute: 0, second: 0 });
  assert.deepEqual(handAngles({ hour: 8, minute: 30, second: 30 }), { hour: 255.25, minute: 183, second: 180 });
});
