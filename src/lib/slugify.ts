export function slugify(title: string) {
  const slug = title
    .normalize("NFC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/[\s-]+/g, "-")
    .slice(0, 80)
    .replace(/^-+|-+$/g, "");
  return slug || "post";
}
