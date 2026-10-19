import { site } from "@/lib/site";

export const LEDE_MAX = 160;

export function postPath(username: string, slug: string) {
  return `/@${username}/${encodeURIComponent(slug)}`;
}

export function absoluteUrl(path: string) {
  return new URL(path, site.url).toString();
}

export function postDescription(lede?: string | null, excerpt?: string | null) {
  return (lede || excerpt || "").replace(/\s+/g, " ").trim();
}
