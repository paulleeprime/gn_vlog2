const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "long",
  day: "numeric",
});

const countFormatter = new Intl.NumberFormat("ko-KR", { notation: "compact" });

export function formatDate(value: string) {
  return dateFormatter.format(new Date(value));
}

export function formatCount(value: number) {
  return countFormatter.format(value);
}

export function decodeParam(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
