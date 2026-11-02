function formatNewYork(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  const hour = get("hour") === "24" ? "00" : get("hour");
  return `${get("year")}-${get("month")}-${get("day")}T${hour}:${get("minute")}`;
}

export function parseNewYork(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const base = Date.parse(`${value}:00Z`);
  if (Number.isNaN(base)) return null;
  for (let hours = -14; hours <= 14; hours += 1) {
    const date = new Date(base - hours * 60 * 60 * 1000);
    if (formatNewYork(date) === value) return date;
  }
  return null;
}

export function isOlderThanDays(iso: string, days: number) {
  if (!iso) return true;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return true;
  return Date.now() - then > days * 24 * 60 * 60 * 1000;
}

export function formatNewYorkInput(value: Date | string | null) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return formatNewYork(date);
}
