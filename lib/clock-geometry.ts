// Turns a pointer angle on the clock (0° = 12, clockwise) into a clock value.

/** Nearest five-minute mark for the long hand. */
export function minuteFromAngle(degrees: number) {
  return (Math.round(degrees / 30) * 5) % 60;
}

/**
 * Hour for the short hand. The short hand sits `minute * 0.5`° past its hour,
 * so that offset is removed first; otherwise at 8:40 a hand dropped near the 9
 * (where it really belongs) would read as 9.
 */
export function hourFromAngle(degrees: number, minute: number) {
  const hour = ((Math.round((degrees - minute * 0.5) / 30) % 12) + 12) % 12;
  return hour === 0 ? 12 : hour;
}
