"use client";

import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { hourFromAngle, minuteFromAngle } from "@/lib/clock-geometry";
import { formatDutchTime, normalizeHour } from "@/lib/dutch-time";
import type { ClockZone, TimeExplanation } from "@/lib/time-explainer";

type ClockFaceProps = {
  hour: number;
  minute: number;
  interactive?: boolean;
  compact?: boolean;
  /** Shows the teaching overlay: zones, the 12 as start/finish, the 6 as halte, and jump arcs. */
  guide?: TimeExplanation | null;
  /** "halves" (over / voor) for levels up to 4, "quarters" once "rond half" is taught. */
  guideMode?: GuideMode;
  /** Blue 5, 10 … 55 around the rim: the minutes the long (blue) hand points at. */
  minuteNumbers?: boolean;
  onChange?: (hour: number, minute: number) => void;
};

export type GuideMode = "halves" | "quarters";

type Hand = "hour" | "minute";

type ZoneShape = { zone: ClockZone; from: number; span: number; label: string };

const ZONES: Record<GuideMode, ZoneShape[]> = {
  // Over = just left the 12 (right half); voor = almost back at the 12 (left half).
  halves: [
    { zone: "over", from: 0, span: 30, label: "over" },
    { zone: "voor", from: 30, span: 30, label: "voor" },
  ],
  quarters: [
    { zone: "over", from: 0, span: 15, label: "over" },
    { zone: "voor-half", from: 15, span: 15, label: "voor half" },
    { zone: "over-half", from: 30, span: 15, label: "over half" },
    { zone: "voor", from: 45, span: 15, label: "voor" },
  ],
};

/** Which drawn zone holds the long hand, e.g. "voor half" lies in the "over" half. */
function currentZone(zone: ClockZone | null, mode: GuideMode) {
  if (mode === "quarters" || !zone) return zone;
  return zone === "voor-half" ? "over" : zone === "over-half" ? "voor" : zone;
}

/** Extra room around the face for the minute-number ring. */
const MINUTE_RING_PAD = 26;

/** Point on the face for a minute mark; rounded so server and browser SVG match. */
function markPoint(minuteMark: number, radius: number) {
  const angle = (minuteMark * 6 * Math.PI) / 180;
  return {
    x: Number((160 + Math.sin(angle) * radius).toFixed(4)),
    y: Number((160 - Math.cos(angle) * radius).toFixed(4)),
  };
}

function ClockGuide({ guide, mode }: { guide: TimeExplanation; mode: GuideMode }) {
  // Jumps run from the anchor (12 or halte) towards the long hand.
  const step = guide.anchor === 60 || guide.zone === "voor-half" ? -5 : 5;
  const hops = Array.from({ length: guide.jumps }, (_, index) => {
    const from = (guide.anchor ?? 0) + step * index;
    const to = from + step;
    // Hops run along the rim, bulging outward, so their badges stay clear of
    // the hour numbers, the start flag and the halte sign.
    const start = markPoint(from, 120);
    const end = markPoint(to, 120);
    const bend = markPoint((from + to) / 2, 142);
    return {
      key: from,
      path: `M${start.x} ${start.y} Q${bend.x} ${bend.y} ${end.x} ${end.y}`,
      label: markPoint((from + to) / 2, 129),
      // Count in minutes, like the voice does: vijf, tien.
      minutes: 5 * (index + 1),
      delay: `${index * 0.55}s`,
    };
  });
  const drawnZone = currentZone(guide.zone, mode);

  return (
    <g aria-hidden="true">
      {ZONES[mode].map(({ zone, from, span, label }) => {
        const start = markPoint(from, 137);
        const end = markPoint(from + span, 137);
        const text = markPoint(from + span / 2, 74);
        // Two short lines stay clear of both the numbers and the hour-hand tip.
        const lines = label.split(" ");
        return (
          <g key={zone} className={`clock-zone clock-zone--${zone} ${drawnZone === zone ? "is-current" : ""}`}>
            <path d={`M160 160 L${start.x} ${start.y} A137 137 0 0 1 ${end.x} ${end.y} Z`} className="clock-zone-fill" />
            <text x={text.x} y={text.y - (lines.length - 1) * 6.5} className="clock-zone-label">
              {lines.map((line, index) => (
                <tspan key={line} x={text.x} dy={index === 0 ? 0 : 13}>{line}</tspan>
              ))}
            </text>
          </g>
        );
      })}
      <g className={`clock-flag ${guide.anchor === 0 || guide.anchor === 60 ? "is-current" : ""}`}>
        {/* Start/finish flag under the 12: over = just started, voor = almost at the finish. */}
        <rect x="143" y="70" width="34" height="22" rx="7" className="clock-flag-badge" />
        <line x1="152" y1="74" x2="152" y2="88" className="clock-flag-pole" />
        {[0, 1, 2, 3].map((column) => [0, 1].map((row) => (
          <rect
            key={`${column}-${row}`}
            x={153 + column * 4.5}
            y={74 + row * 4.5}
            width="4.5"
            height="4.5"
            className={(column + row) % 2 ? "clock-flag-light" : "clock-flag-dark"}
          />
        )))}
      </g>
      <g className={`clock-halte ${guide.anchor === 30 || guide.phrase.startsWith("half") ? "is-current" : ""}`}>
        <rect x="129" y="224" width="62" height="24" rx="12" />
        <text x="160" y="236.5">halte</text>
      </g>
      {hops.map((hop) => (
        <g key={hop.key} className={`clock-jump clock-jump--${guide.zone}`} style={{ animationDelay: hop.delay }}>
          <path d={hop.path} style={{ animationDelay: hop.delay }} />
          <circle cx={hop.label.x} cy={hop.label.y} r="10" />
          <text x={hop.label.x} y={hop.label.y + 0.5}>{hop.minutes}</text>
        </g>
      ))}
    </g>
  );
}

export function ClockFace({
  hour,
  minute,
  interactive = false,
  compact = false,
  guide = null,
  guideMode = "quarters",
  minuteNumbers = false,
  onChange,
}: ClockFaceProps) {
  const pad = minuteNumbers ? MINUTE_RING_PAD : 0;
  const size = 320 + pad * 2;
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState<Hand | null>(null);
  const minuteAngle = minute * 6;
  const hourAngle = (normalizeHour(hour) % 12) * 30 + minute * 0.5;

  function updateFromPointer(kind: Hand, event: PointerEvent<SVGGElement>) {
    if (!interactive || !onChange || !svgRef.current) return;
    const bounds = svgRef.current.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * size - pad - 160;
    const y = ((event.clientY - bounds.top) / bounds.height) * size - pad - 160;
    const degrees = (Math.atan2(y, x) * 180) / Math.PI + 90;
    const normalized = (degrees + 360) % 360;

    if (kind === "minute") {
      onChange(hour, minuteFromAngle(normalized));
    } else {
      onChange(hourFromAngle(normalized, minute), minute);
    }
  }

  function startDrag(kind: Hand, event: PointerEvent<SVGGElement>) {
    if (!interactive) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(kind);
    updateFromPointer(kind, event);
  }

  function handleKey(kind: Hand, event: KeyboardEvent<SVGGElement>) {
    if (!interactive || !onChange) return;
    const direction = event.key === "ArrowRight" || event.key === "ArrowUp"
      ? 1
      : event.key === "ArrowLeft" || event.key === "ArrowDown"
        ? -1
        : 0;
    if (!direction) return;
    event.preventDefault();
    if (kind === "minute") {
      const total = hour * 60 + minute + direction * 5;
      const wrapped = ((total % 720) + 720) % 720;
      onChange(normalizeHour(Math.floor(wrapped / 60)), wrapped % 60);
    } else {
      onChange(normalizeHour(hour + direction), minute);
    }
  }

  return (
    <div className={compact ? "clock-shell clock-shell--compact" : "clock-shell"}>
      <svg
        ref={svgRef}
        viewBox={`${-pad} ${-pad} ${size} ${size}`}
        className="clock-svg"
        role="img"
        aria-label={`Analoge klok: ${formatDutchTime(hour, minute)}`}
      >
        <circle cx="160" cy="160" r="149" className="clock-rim" />
        <circle cx="160" cy="160" r="137" className="clock-face" />
        {guide && <ClockGuide guide={guide} mode={guideMode} />}
        {minuteNumbers && (
          <g className="clock-minute-numbers" aria-hidden="true">
            {Array.from({ length: 11 }, (_, index) => {
              const minuteMark = (index + 1) * 5;
              const point = markPoint(minuteMark, 165);
              return <text key={minuteMark} x={point.x} y={point.y}>{minuteMark}</text>;
            })}
          </g>
        )}

        {Array.from({ length: 60 }, (_, index) => {
          const angle = index * 6;
          const major = index % 5 === 0;
          return (
            <line
              key={index}
              x1="160"
              y1={major ? 30 : 25}
              x2="160"
              y2={major ? 41 : 32}
              className={major ? "clock-tick clock-tick--major" : "clock-tick"}
              transform={`rotate(${angle} 160 160)`}
            />
          );
        })}

        {Array.from({ length: 12 }, (_, index) => {
          const number = index + 1;
          const angle = (number * 30 - 90) * (Math.PI / 180);
          // Rounded coordinates keep server and browser SVG output byte-identical.
          const x = Number((160 + Math.cos(angle) * 105).toFixed(4));
          const y = Number((160 + Math.sin(angle) * 105).toFixed(4));
          const named = guide && normalizeHour(guide.namedHour) === number;
          return (
            <g key={number}>
              {named && <circle cx={x} cy={y} r="18" className="clock-number-glow" />}
              <text x={x} y={y} className="clock-number">
                {number}
              </text>
            </g>
          );
        })}

        <g
          className={interactive ? "clock-hand-group clock-hand-group--interactive" : "clock-hand-group"}
          transform={`rotate(${hourAngle} 160 160)`}
          onPointerDown={(event) => startDrag("hour", event)}
          onPointerMove={(event) => dragging === "hour" && updateFromPointer("hour", event)}
          onPointerUp={() => setDragging(null)}
          onPointerCancel={() => setDragging(null)}
          onKeyDown={(event) => handleKey("hour", event)}
          tabIndex={interactive ? 0 : undefined}
          role={interactive ? "slider" : undefined}
          aria-label={interactive ? "Kleine uurwijzer" : undefined}
          aria-valuemin={interactive ? 1 : undefined}
          aria-valuemax={interactive ? 12 : undefined}
          aria-valuenow={interactive ? normalizeHour(hour) : undefined}
        >
          <line x1="160" y1="172" x2="160" y2="91" className="clock-hand clock-hand--hour" />
          {interactive && <line x1="160" y1="180" x2="160" y2="80" className="clock-hand-hit" />}
          <circle cx="160" cy="91" r="8" className="clock-handle clock-handle--hour" />
        </g>

        <g
          className={interactive ? "clock-hand-group clock-hand-group--interactive" : "clock-hand-group"}
          transform={`rotate(${minuteAngle} 160 160)`}
          onPointerDown={(event) => startDrag("minute", event)}
          onPointerMove={(event) => dragging === "minute" && updateFromPointer("minute", event)}
          onPointerUp={() => setDragging(null)}
          onPointerCancel={() => setDragging(null)}
          onKeyDown={(event) => handleKey("minute", event)}
          tabIndex={interactive ? 0 : undefined}
          role={interactive ? "slider" : undefined}
          aria-label={interactive ? "Lange minutenwijzer" : undefined}
          aria-valuemin={interactive ? 0 : undefined}
          aria-valuemax={interactive ? 55 : undefined}
          aria-valuenow={interactive ? minute : undefined}
        >
          <line x1="160" y1="176" x2="160" y2="56" className="clock-hand clock-hand--minute" />
          {interactive && <line x1="160" y1="184" x2="160" y2="47" className="clock-hand-hit" />}
          <circle cx="160" cy="56" r="8" className="clock-handle clock-handle--minute" />
        </g>

        <circle cx="160" cy="160" r="11" className="clock-pin-outer" />
        <circle cx="160" cy="160" r="4" className="clock-pin-inner" />
      </svg>
      {interactive && <span className="clock-help">Sleep de gekleurde rondjes</span>}
    </div>
  );
}
