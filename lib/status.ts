export const STATUS_LABELS = {
  draft: "Draft",
  scheduled: "Scheduled",
  published: "On the site",
  sold: "Sold",
  hidden: "Hidden",
} as const;

export function statusLabel(status: string) {
  return STATUS_LABELS[status as keyof typeof STATUS_LABELS] ?? status;
}
