// Current time in the Netherlands, whatever the device's own time zone is.
// Europe/Amsterdam switches between CET and CEST (summer time) automatically.

const formatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Amsterdam",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

export function netherlandsTime(date: Date) {
  const parts = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
  return { hour: Number(parts.hour), minute: Number(parts.minute), second: Number(parts.second) };
}

/** Hand angles in degrees; hour and minute hands move smoothly between marks. */
export function handAngles({ hour, minute, second }: { hour: number; minute: number; second: number }) {
  return {
    hour: (hour % 12) * 30 + minute * 0.5 + second / 120,
    minute: minute * 6 + second * 0.1,
    second: second * 6,
  };
}
