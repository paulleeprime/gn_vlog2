import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export const POST_CARD_COLUMNS =
  "id, title, slug, excerpt, content, cover_image_url, published, view_count, like_count, comment_count, created_at, author:profiles!posts_author_id_fkey(username, full_name, avatar_url)";

export const getProfileByUsername = cache(async (username: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url, bio, created_at")
    .eq("username", username.toLowerCase())
    .maybeSingle();
  return data;
});

export const getPost = cache(async (username: string, slug: string) => {
  const profile = await getProfileByUsername(username);
  if (!profile) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select("*")
    .eq("author_id", profile.id)
    .eq("slug", slug)
    .maybeSingle();
  return data ? { post: data, author: profile } : null;
});
