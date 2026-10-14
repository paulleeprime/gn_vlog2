import Image from "next/image";
import Link from "next/link";
import type { JSONContent } from "@tiptap/react";
import { Avatar } from "@/components/avatar";
import { extractText } from "@/lib/editor/content";
import { formatCount, formatDotDate, readingMinutes } from "@/lib/format";
import type { Json } from "@/lib/supabase/database.types";

export type PostCardData = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: Json;
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
  const minutes = readingMinutes(extractText(post.content as JSONContent));

  return (
    <article className="flex items-start gap-8 border-b border-[#e4d9c8] py-8">
      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        {showAuthor && (
          <Link href={`/@${username}`} className="flex w-fit items-center gap-2.5 text-sm">
            <Avatar src={post.author?.avatar_url} name={post.author?.full_name ?? username} size={28} />
            <span className="font-medium text-[#3f342c]">{post.author?.full_name ?? username}</span>
          </Link>
        )}
        <Link href={href} className="group flex flex-col gap-2">
          <h2 className="font-serif text-2xl font-semibold leading-snug group-hover:underline">
            {!post.published && (
              <span className="mr-2 rounded bg-amber-100 px-1.5 py-0.5 align-middle font-sans text-xs font-medium text-amber-800">
                비공개
              </span>
            )}
            {post.title}
          </h2>
          {post.excerpt && (
            <p className="line-clamp-2 leading-7 text-[#6a5e52]">{post.excerpt}</p>
          )}
        </Link>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#8a7b68]">
          <span>
            {formatDotDate(post.created_at)} {minutes}분 읽기
          </span>
          <span className="inline-flex items-center gap-1">
            <EyeIcon /> {formatCount(post.view_count)}
          </span>
          <span className="inline-flex items-center gap-1">
            <HeartIcon /> {formatCount(post.like_count)}
          </span>
          <span className="inline-flex items-center gap-1">
            <CommentIcon /> {formatCount(post.comment_count)}
          </span>
        </p>
      </div>
      {post.cover_image_url && (
        <Link href={href} className="hidden shrink-0 sm:block">
          <Image
            src={post.cover_image_url}
            alt=""
            width={112}
            height={148}
            className="h-[148px] w-[112px] object-contain"
          />
        </Link>
      )}
    </article>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M12 20s-7-4.4-7-9a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 4.6-7 9-7 9Z" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M6 17.5 3.5 20V6.5A2.5 2.5 0 0 1 6 4h12a2.5 2.5 0 0 1 2.5 2.5v8A2.5 2.5 0 0 1 18 17H6Z" />
    </svg>
  );
}
