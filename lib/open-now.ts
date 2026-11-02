export type HoursDay = {
  day: string;
  open: string;
  close: string;
  closed: boolean;
};

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function openNow(hours: HoursDay[], now?: Date): boolean | null {
  if (!hours.length) return null;
  const clock = now ?? new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(clock);
  const weekday = parts.find((part) => part.type === "weekday")?.value ?? "";
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");
  const row = hours.find((entry) => entry.day === weekday) ?? hours[WEEKDAYS.indexOf(weekday)] ?? null;
  if (!row || row.closed || !row.open || !row.close) return row ? false : null;
  const [openHour, openMinute] = row.open.split(":").map(Number);
  const [closeHour, closeMinute] = row.close.split(":").map(Number);
  const current = hour * 60 + minute;
  return current >= openHour * 60 + openMinute && current < closeHour * 60 + closeMinute;
}

export const WEEKDAY_NAMES = WEEKDAYS;
