import "server-only";

import { generateHTML } from "@tiptap/html/server";
import type { JSONContent } from "@tiptap/react";
import { postExtensions } from "./extensions";
import { sanitizeContent } from "./content";

export function renderPostHTML(content: JSONContent) {
  const safe = sanitizeContent(content);
  if (!safe) return "";
  try {
    return generateHTML(safe, postExtensions);
  } catch {
    return "";
  }
}
