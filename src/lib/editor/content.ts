import type { JSONContent } from "@tiptap/react";

export const POST_IMAGE_BUCKET = "post-images";
export const POST_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const POST_IMAGE_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];

const postImageUrlPrefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${POST_IMAGE_BUCKET}/`;

export const EMPTY_DOC: JSONContent = { type: "doc", content: [{ type: "paragraph" }] };

// Drops images that are not hosted in our storage bucket.
export function sanitizeContent(node: JSONContent): JSONContent | null {
  if (node.type === "image") {
    const src = node.attrs?.src;
    if (typeof src !== "string" || !src.startsWith(postImageUrlPrefix)) return null;
  }
  if (!node.content) return node;
  return {
    ...node,
    content: node.content
      .map(sanitizeContent)
      .filter((child): child is JSONContent => child !== null),
  };
}

export function extractText(node: JSONContent): string {
  if (node.type === "text") return node.text ?? "";
  const children = node.content ?? [];
  const isInline = children.every((c) => c.type === "text" || c.type === "hardBreak");
  return children.map(extractText).join(isInline ? "" : " ");
}

export function extractExcerpt(doc: JSONContent, maxLength = 160) {
  const text = (doc.content ?? [])
    .map(extractText)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}

export function extractCoverImage(node: JSONContent): string | null {
  if (node.type === "image" && typeof node.attrs?.src === "string") {
    return node.attrs.src;
  }
  for (const child of node.content ?? []) {
    const src = extractCoverImage(child);
    if (src) return src;
  }
  return null;
}

export function hasMeaningfulContent(doc: JSONContent) {
  return extractText(doc).trim().length > 0 || extractCoverImage(doc) !== null;
}

const filenameAlt = /\.(png|jpe?g|gif|webp)$/i;

export function imagesMissingAlt(node: JSONContent): number {
  let missing = 0;
  if (node.type === "image") {
    const alt = typeof node.attrs?.alt === "string" ? node.attrs.alt.trim() : "";
    if (!alt || filenameAlt.test(alt)) missing += 1;
  }
  for (const child of node.content ?? []) missing += imagesMissingAlt(child);
  return missing;
}

export function hasHeading2(node: JSONContent): boolean {
  if (node.type === "heading" && node.attrs?.level === 2) return true;
  return (node.content ?? []).some(hasHeading2);
}
