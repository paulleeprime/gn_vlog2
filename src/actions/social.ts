"use server";

import { revalidatePath } from "next/cache";
import { getViewer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

async function requireViewerId() {
  const viewer = await getViewer();
  if (!viewer?.profile?.username) throw new Error("로그인이 필요합니다.");
  return viewer.id;
}

export async function recordView(postId: string) {
  const supabase = await createClient();
  await supabase.rpc("increment_post_view", { p_post_id: postId });
  const { data } = await supabase
    .from("posts")
    .select("view_count")
    .eq("id", postId)
    .maybeSingle();
  return data?.view_count ?? null;
}

export async function setLike(postId: string, like: boolean) {
  const userId = await requireViewerId();
  const supabase = await createClient();
  if (like) {
    await supabase
      .from("post_likes")
      .upsert({ post_id: postId, user_id: userId }, { ignoreDuplicates: true });
  } else {
    await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", userId);
  }
  revalidatePath("/", "layout");
}

export async function setFollow(targetId: string, follow: boolean) {
  const userId = await requireViewerId();
  if (userId === targetId) return;
  const supabase = await createClient();
  if (follow) {
    await supabase
      .from("follows")
      .upsert({ follower_id: userId, following_id: targetId }, { ignoreDuplicates: true });
  } else {
    await supabase
      .from("follows")
      .delete()
      .eq("follower_id", userId)
      .eq("following_id", targetId);
  }
  revalidatePath("/", "layout");
}

export type CommentFormState = { error?: string; ok?: number };

export async function addComment(
  prev: CommentFormState,
  formData: FormData,
): Promise<CommentFormState> {
  const viewer = await getViewer();
  if (!viewer?.profile?.username) return { error: "로그인 후 댓글을 남길 수 있습니다." };

  const postId = String(formData.get("postId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "댓글 내용을 입력해 주세요." };
  if (body.length > 2000) return { error: "댓글은 2000자 이하로 입력해 주세요." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("comments")
    .insert({ post_id: postId, author_id: viewer.id, body });
  if (error) return { error: "댓글을 남기지 못했습니다." };

  revalidatePath("/", "layout");
  return { ok: (prev.ok ?? 0) + 1 };
}

export async function deleteComment(commentId: string) {
  await requireViewerId();
  const supabase = await createClient();
  await supabase.from("comments").delete().eq("id", commentId);
  revalidatePath("/", "layout");
}
