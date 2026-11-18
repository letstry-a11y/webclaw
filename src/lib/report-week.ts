const day = 86_400_000;
const offset = 8 * 3_600_000;

export function shanghaiDate(value: Date | string) {
  return new Date(new Date(value).getTime() + offset).toISOString().slice(0, 10);
}

export function reportingWeek(input?: string, now = new Date()) {
  const date = input ?? shanghaiDate(now);
  const midnight = new Date(date + "T00:00:00Z");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(midnight.getTime()) ||
      midnight.toISOString().slice(0, 10) !== date) return null;
  const monday = midnight.getTime() - ((midnight.getUTCDay() + 6) % 7) * day - offset;
  const start = new Date(monday);
  const end = new Date(monday + 7 * day);
  return {
    start: shanghaiDate(start), through: shanghaiDate(new Date(end.getTime() - 1)),
    from: start.toISOString(), until: end.toISOString(),
    previous: shanghaiDate(new Date(monday - 7 * day)), next: shanghaiDate(end),
  };
}

export type ReportWeek = NonNullable<ReturnType<typeof reportingWeek>>;
