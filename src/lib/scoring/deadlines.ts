export function getDailyBettingLockTime(matches: { startsAt: Date }[], matchDay: Date): Date {
  const noon = getIsraelNoonForDate(getIsraelMatchDay(matchDay));

  const firstKickoff = matches
    .map((match) => match.startsAt)
    .sort((a, b) => a.getTime() - b.getTime())[0];

  if (!firstKickoff) {
    return noon;
  }

  return firstKickoff.getTime() < noon.getTime() ? firstKickoff : noon;
}

export function getDailyBettingLockTimeForKickoffs(kickoffs: Date[], matchDay: Date): Date {
  return getDailyBettingLockTime(
    kickoffs.map((startsAt) => ({ startsAt })),
    matchDay,
  );
}

export function getIsraelMatchDay(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jerusalem",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function getNextIsraelMatchDay(matchDay: string): string {
  const nextDay = new Date(`${matchDay}T12:00:00.000Z`);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(nextDay);
}

export function getIsraelDayStartForDate(matchDay: string): Date {
  return getIsraelDateForWallTime(matchDay, 0, 0);
}

export function getIsraelNoonForDate(matchDay: string): Date {
  return getIsraelDateForWallTime(matchDay, 12, 0);
}

export function parseIsraelDateTimeLocal(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const [, year, month, day, hour, minute] = match;
  return getIsraelDateForWallTime(`${year}-${month}-${day}`, Number(hour), Number(minute));
}

function getIsraelDateForWallTime(matchDay: string, hour: number, minute: number): Date {
  const [year, month, day] = matchDay.split("-").map(Number);
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0);
  const firstOffset = getTimeZoneOffsetMs(new Date(utcGuess), "Asia/Jerusalem");
  const firstInstant = utcGuess - firstOffset;
  const secondOffset = getTimeZoneOffsetMs(new Date(firstInstant), "Asia/Jerusalem");

  return new Date(utcGuess - secondOffset);
}

function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    month: "2-digit",
    second: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(date);
  const values = new Map(parts.map((part) => [part.type, part.value]));
  const asUtc = Date.UTC(
    Number(values.get("year")),
    Number(values.get("month")) - 1,
    Number(values.get("day")),
    Number(values.get("hour")),
    Number(values.get("minute")),
    Number(values.get("second")),
  );

  return asUtc - date.getTime();
}
