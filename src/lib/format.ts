const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "long",
  day: "numeric",
});

const countFormatter = new Intl.NumberFormat("ko-KR", { notation: "compact" });

const dotDateFormatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function formatDate(value: string) {
  return dateFormatter.format(new Date(value));
}

export function formatDotDate(value: string) {
  const formatted = dotDateFormatter.format(new Date(value));
  return formatted.endsWith(".") ? formatted : `${formatted}.`;
}

export function readingMinutes(text: string) {
  const chars = text.replace(/\s/g, "").length;
  return Math.max(1, Math.ceil(chars / 500));
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
