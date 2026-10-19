import type { MetadataRoute } from "next";
import { postPath } from "@/lib/seo";
import { site } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("posts")
    .select("slug, updated_at, author:profiles!posts_author_id_fkey(username)")
    .eq("published", true)
    .order("updated_at", { ascending: false })
    .limit(1000);

  return [
    { url: site.url, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    ...(posts ?? []).flatMap((post) => {
      if (!post.author?.username) return [];
      return [
        {
          url: new URL(postPath(post.author.username, post.slug), site.url).toString(),
          lastModified: new Date(post.updated_at),
          changeFrequency: "weekly" as const,
          priority: 0.8,
        },
      ];
    }),
  ];
}
