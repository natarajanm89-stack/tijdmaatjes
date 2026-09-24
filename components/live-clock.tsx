"use client";

import { useSyncExternalStore } from "react";
import { handAngles, netherlandsTime } from "@/lib/nl-time";

// The current time, re-read at every minute boundary. Between those moments the
// hands turn with CSS animations, so nothing re-renders every second and the
// clock keeps time even while the tab is in the background.
let now = 0;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setTimeout> | undefined;

function tick() {
  now = Date.now();
  listeners.forEach((listener) => listener());
  timer = setTimeout(tick, 60_000 - (now % 60_000) + 20);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) tick();
  return () => {
    listeners.delete(listener);
    if (!listeners.size) clearTimeout(timer);
  };
}

const getSnapshot = () => now;
// No time on the server: the face renders without hands until the browser takes over.
const getServerSnapshot = () => 0;

const SPINS = [
  { hand: "hour", seconds: 43_200, x2: 20, y2: 11.5 },
  { hand: "minute", seconds: 3_600, x2: 20, y2: 7 },
  { hand: "second", seconds: 60, x2: 20, y2: 5.5 },
] as const;

/** A small live clock showing the current time in the Netherlands. */
export function LiveClock() {
  const time = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const nl = time ? netherlandsTime(new Date(time)) : null;
  const angles = nl ? handAngles(nl) : null;
  const label = nl
    ? `Nu in Nederland: ${String(nl.hour).padStart(2, "0")}:${String(nl.minute).padStart(2, "0")}`
    : "Klok van Nederland";

  return (
    <span className="live-clock" title={label}>
      <svg viewBox="0 0 40 40" role="img" aria-label={label}>
        <circle cx="20" cy="20" r="18" className="live-clock-face" />
        {Array.from({ length: 12 }, (_, index) => (
          <line
            key={index}
            x1="20"
            y1={index % 3 === 0 ? 4.5 : 5}
            x2="20"
            y2="7.5"
            className={index % 3 === 0 ? "live-clock-tick live-clock-tick--major" : "live-clock-tick"}
            transform={`rotate(${index * 30} 20 20)`}
          />
        ))}
        {angles && SPINS.map(({ hand, seconds, x2, y2 }) => (
          // Outer group: the angle at this minute. Inner group: turns on from there,
          // one full turn per `seconds`.
          <g key={`${hand}-${time}`} transform={`rotate(${angles[hand]} 20 20)`}>
            <g
              className={`live-clock-spin live-clock-spin--${hand}`}
              // Start part-way into the current second so the ticks land on real seconds.
              style={{ animationDuration: `${seconds}s`, animationDelay: `-${time % 1000}ms` }}
            >
              <line x1="20" y1={hand === "second" ? 24 : 21.5} x2={x2} y2={y2} className={`live-clock-hand live-clock-hand--${hand}`} />
            </g>
          </g>
        ))}
        <circle cx="20" cy="20" r="2.2" className="live-clock-pin" />
      </svg>
      <span className="live-clock-caption" aria-hidden="true">nu in NL</span>
    </span>
  );
}
