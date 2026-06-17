const matchBetLockOffsetMs = 7 * 60 * 60 * 1000;

export function getMatchBettingLockTime(startsAt: Date): Date {
  return new Date(startsAt.getTime() - matchBetLockOffsetMs);
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
