export function getDailyBettingLockTime(matches: { startsAt: Date }[], matchDay: Date): Date {
  const noon = new Date(matchDay);
  noon.setHours(12, 0, 0, 0);

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

export function getIsraelNoonForDate(matchDay: string): Date {
  return new Date(`${matchDay}T12:00:00+03:00`);
}
