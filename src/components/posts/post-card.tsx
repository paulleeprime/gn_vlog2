import Image from "next/image";
import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { formatCount, formatDate } from "@/lib/format";

export type PostCardData = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image_url: string | null;
  published: boolean;
  view_count: number;
  like_count: number;
  comment_count: number;
  created_at: string;
  author: { username: string | null; full_name: string | null; avatar_url: string | null } | null;
};

export function PostCard({ post, showAuthor = true }: { post: PostCardData; showAuthor?: boolean }) {
  const username = post.author?.username;
  if (!username) return null;
  const href = `/@${username}/${encodeURIComponent(post.slug)}`;

  return (
    <article className="flex gap-5 border-b border-black/10 py-6 dark:border-white/10">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {showAuthor && (
          <Link href={`/@${username}`} className="flex w-fit items-center gap-2 text-sm">
            <Avatar src={post.author?.avatar_url} name={post.author?.full_name ?? username} size={22} />
            <span className="font-medium">{post.author?.full_name ?? username}</span>
          </Link>
        )}
        <Link href={href} className="group flex flex-col gap-1">
          <h2 className="line-clamp-2 text-xl font-bold group-hover:underline">
            {!post.published && (
              <span className="mr-2 rounded bg-amber-100 px-1.5 py-0.5 align-middle text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                비공개
              </span>
            )}
            {post.title}
          </h2>
          {post.excerpt && (
            <p className="line-clamp-2 text-zinc-600 dark:text-zinc-400">{post.excerpt}</p>
          )}
        </Link>
        <p className="text-xs text-zinc-500">
          {formatDate(post.created_at)} · 조회 {formatCount(post.view_count)} · 좋아요{" "}
          {formatCount(post.like_count)} · 댓글 {formatCount(post.comment_count)}
        </p>
      </div>
      {post.cover_image_url && (
        <Link href={href} className="hidden shrink-0 sm:block">
          <Image
            src={post.cover_image_url}
            alt=""
            width={160}
            height={107}
            className="h-[107px] w-[160px] rounded-lg object-cover"
          />
        </Link>
      )}
    </article>
  );
}
