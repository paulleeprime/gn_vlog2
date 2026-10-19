"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { JSONContent } from "@tiptap/react";
import { requireViewerWithUsername } from "@/lib/auth";
import {
  extractCoverImage,
  extractExcerpt,
  hasMeaningfulContent,
  sanitizeContent,
} from "@/lib/editor/content";
import { LEDE_MAX } from "@/lib/seo";
import { slugify } from "@/lib/slugify";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";

export type PostFormState = { error?: string };

const UNIQUE_VIOLATION = "23505";

function parseContent(raw: FormDataEntryValue | null): JSONContent | null {
  try {
    const parsed = JSON.parse(String(raw ?? ""));
    if (parsed?.type !== "doc") return null;
    return sanitizeContent(parsed);
  } catch {
    return null;
  }
}

async function nextAvailableSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  authorId: string,
  base: string,
) {
  const { data } = await supabase
    .from("posts")
    .select("slug")
    .eq("author_id", authorId)
    .or(`slug.eq.${base},slug.like.${base}-%`);

  const taken = new Set((data ?? []).map((p) => p.slug));
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

export async function savePost(
  _prev: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  const viewer = await requireViewerWithUsername();
  const postId = String(formData.get("postId") ?? "") || null;
  const title = String(formData.get("title") ?? "").trim();
  const lede = String(formData.get("lede") ?? "").trim().slice(0, LEDE_MAX) || null;
  const published = formData.get("published") === "on";
  const content = parseContent(formData.get("content"));

  if (!title) return { error: "제목을 입력해 주세요." };
  if (title.length > 200) return { error: "제목은 200자 이하로 입력해 주세요." };
  if (!content || !hasMeaningfulContent(content)) {
    return { error: "본문을 입력해 주세요." };
  }

  const fields = {
    title,
    lede,
    content: content as Json,
    excerpt: extractExcerpt(content),
    cover_image_url: extractCoverImage(content),
    published,
  };

  const supabase = await createClient();
  let slug: string;

  if (postId) {
    const { data, error } = await supabase
      .from("posts")
      .update(fields)
      .eq("id", postId)
      .eq("author_id", viewer.id)
      .select("slug")
      .single();
    if (error || !data) return { error: "글을 수정하지 못했습니다." };
    slug = data.slug;
  } else {
    const base = slugify(title);
    slug = await nextAvailableSlug(supabase, viewer.id, base);
    let { error } = await supabase
      .from("posts")
      .insert({ ...fields, author_id: viewer.id, slug });
    if (error?.code === UNIQUE_VIOLATION) {
      slug = `${base}-${crypto.randomUUID().slice(0, 6)}`;
      ({ error } = await supabase
        .from("posts")
        .insert({ ...fields, author_id: viewer.id, slug }));
    }
    if (error) return { error: "글을 저장하지 못했습니다." };
  }

  revalidatePath("/", "layout");
  redirect(`/@${viewer.username}/${encodeURIComponent(slug)}`);
}

export async function deletePost(postId: string) {
  const viewer = await requireViewerWithUsername();
  const supabase = await createClient();
  await supabase.from("posts").delete().eq("id", postId).eq("author_id", viewer.id);
  revalidatePath("/", "layout");
  redirect(`/@${viewer.username}`);
}
