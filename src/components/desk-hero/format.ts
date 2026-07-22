export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function padDatePart(value: number): string {
  return String(value).padStart(2, "0");
}

export function formatLiveDate(now: Date | null): {
  readonly year: string;
  readonly month: string;
  readonly day: string;
  readonly time: string;
} {
  if (!now) {
    return { year: "----", month: "--", day: "--", time: "--:--:--" };
  }

  return {
    year: String(now.getFullYear()),
    month: padDatePart(now.getMonth() + 1),
    day: padDatePart(now.getDate()),
    time: `${padDatePart(now.getHours())}:${padDatePart(now.getMinutes())}:${padDatePart(now.getSeconds())}`,
  };
}
