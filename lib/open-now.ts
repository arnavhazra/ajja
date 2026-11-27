export type HoursDay = {
  day: string;
  open: string;
  close: string;
  closed: boolean;
};

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const WEEKDAY_NAMES = WEEKDAYS;
