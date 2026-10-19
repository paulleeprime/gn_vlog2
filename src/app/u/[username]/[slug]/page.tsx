import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { JSONContent } from "@tiptap/react";
import { deleteComment } from "@/actions/social";
import { Avatar } from "@/components/avatar";
import { DeletePostButton } from "@/components/posts/delete-post-button";
import { ViewCounter } from "@/components/posts/view-counter";
import { CommentForm } from "@/components/social/comment-form";
import { LikeButton } from "@/components/social/like-button";
import { getViewer } from "@/lib/auth";
import { renderPostHTML } from "@/lib/editor/render";
import { decodeParam, formatCount, formatDate } from "@/lib/format";
import { getPost } from "@/lib/queries";
import { absoluteUrl, postDescription, postPath } from "@/lib/seo";
import { site } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

type Params = Promise<{ username: string; slug: string }>;

export async function generateMetadata({
  params,
}: PageProps<"/u/[username]/[slug]">): Promise<Metadata> {
  const { username, slug } = await params;
  const result = await getPost(decodeParam(username), decodeParam(slug));
  if (!result) return { title: "글을 찾을 수 없습니다" };

  const { post, author } = result;
  const authorName = author.full_name || author.username || "작성자";
  const description = postDescription(post.lede, post.excerpt);
  const path = postPath(author.username!, post.slug);

  return {
    title: `${post.title} · ${authorName}`,
    description: description || undefined,
    alternates: { canonical: path },
    robots: post.published ? undefined : { index: false, follow: false },
    openGraph: {
      type: "article",
      title: post.title,
      description: description || undefined,
      url: path,
      publishedTime: post.created_at,
      modifiedTime: post.updated_at,
      authors: [authorName],
      images: post.cover_image_url ? [{ url: post.cover_image_url }] : undefined,
    },
  };
}

function PostJsonLd({
  post,
  author,
}: {
  post: {
    title: string;
    lede: string | null;
    excerpt: string | null;
    slug: string;
    created_at: string;
    updated_at: string;
    cover_image_url: string | null;
  };
  author: { username: string | null; full_name: string | null };
}) {
  const path = postPath(author.username!, post.slug);
  const url = absoluteUrl(path);
  const description = postDescription(post.lede, post.excerpt);
  const authorName = author.full_name || author.username;
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        headline: post.title,
        ...(description ? { description } : {}),
        datePublished: post.created_at,
        dateModified: post.updated_at,
        mainEntityOfPage: url,
        author: {
          "@type": "Person",
          name: authorName,
          url: absoluteUrl(`/@${author.username}`),
        },
        ...(post.cover_image_url ? { image: [post.cover_image_url] } : {}),
        publisher: {
          "@type": "Organization",
          name: site.name,
          logo: { "@type": "ImageObject", url: absoluteUrl("/logo.jpg") },
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "홈", item: absoluteUrl("/") },
          {
            "@type": "ListItem",
            position: 2,
            name: `@${author.username}`,
            item: absoluteUrl(`/@${author.username}`),
          },
          { "@type": "ListItem", position: 3, name: post.title, item: url },
        ],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replaceAll("<", "\\u003c") }}
    />
  );
}

async function PostView({ params }: { params: Params }) {
  const { username, slug } = await params;
  const result = await getPost(decodeParam(username), decodeParam(slug));
  if (!result) notFound();
  const { post, author } = result;

  const supabase = await createClient();
  const viewer = await getViewer();
  const isOwner = viewer?.id === post.author_id;

  const likeResult = viewer
    ? await supabase
        .from("post_likes")
        .select("post_id")
        .eq("post_id", post.id)
        .eq("user_id", viewer.id)
        .maybeSingle()
    : null;

  const html = renderPostHTML(post.content as JSONContent);
  const authorPath = `/@${author.username}`;

  return (
    <article className="flex flex-col gap-8">
      <PostJsonLd post={post} author={author} />
      <header className="flex flex-col gap-5">
        <nav aria-label="경로" className="text-sm text-[#8a7b68]">
          <Link href="/" className="hover:underline">
            홈
          </Link>
          <span aria-hidden> / </span>
          <Link href={authorPath} className="hover:underline">
            @{author.username}
          </Link>
        </nav>
        {!post.published && (
          <span className="w-fit rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
            비공개 글
          </span>
        )}
        <h1 className="text-3xl font-bold leading-tight sm:text-4xl">{post.title}</h1>
        {post.lede && (
          <p className="font-serif text-xl leading-9 text-[#5c5146]">{post.lede}</p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href={authorPath} className="flex items-center gap-3">
            <Avatar src={author.avatar_url} name={author.full_name ?? author.username} size={40} />
            <div>
              <p className="font-medium">{author.full_name ?? author.username}</p>
              <p className="text-sm text-zinc-500">
                @{author.username} · <time dateTime={post.created_at}>{formatDate(post.created_at)}</time>
                {post.updated_at !== post.created_at && (
                  <>
                    {" "}
                    · 수정 <time dateTime={post.updated_at}>{formatDate(post.updated_at)}</time>
                  </>
                )}
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-4 text-sm text-zinc-500">
            {post.published ? (
              <ViewCounter postId={post.id} initialCount={post.view_count} />
            ) : (
              <span>조회 {formatCount(post.view_count)}</span>
            )}
            {isOwner && (
              <>
                <Link
                  href={`${authorPath}/${encodeURIComponent(post.slug)}/edit`}
                  className="hover:underline"
                >
                  수정
                </Link>
                <DeletePostButton postId={post.id} />
              </>
            )}
          </div>
        </div>
      </header>

      <div className="post-content" dangerouslySetInnerHTML={{ __html: html }} />

      <div className="flex justify-center border-y border-black/10 py-6 dark:border-white/15">
        <LikeButton
          postId={post.id}
          liked={Boolean(likeResult?.data)}
          count={post.like_count}
          canLike={Boolean(viewer?.profile?.username) && post.published}
        />
      </div>

      <Suspense fallback={<p className="text-sm text-zinc-500">댓글을 불러오는 중...</p>}>
        <Comments
          postId={post.id}
          postAuthorId={post.author_id}
          viewerId={viewer?.profile?.username ? viewer.id : null}
          published={post.published}
        />
      </Suspense>
    </article>
  );
}

async function Comments({
  postId,
  postAuthorId,
  viewerId,
  published,
}: {
  postId: string;
  postAuthorId: string;
  viewerId: string | null;
  published: boolean;
}) {
  const supabase = await createClient();
  const { data: comments } = await supabase
    .from("comments")
    .select("id, body, created_at, author_id, author:profiles!comments_author_id_fkey(username, full_name, avatar_url)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  return (
    <section className="flex flex-col gap-6">
      <h2 className="text-lg font-semibold">댓글 {comments?.length ?? 0}</h2>
      {published &&
        (viewerId ? (
          <CommentForm postId={postId} />
        ) : (
          <p className="rounded-lg bg-zinc-100 px-4 py-3 text-sm text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
            <Link href="/" className="font-medium underline">
              로그인
            </Link>{" "}
            후 댓글을 남길 수 있습니다.
          </p>
        ))}
      <ul className="flex flex-col gap-5">
        {comments?.map((c) => (
          <li key={c.id} className="flex gap-3">
            <Avatar src={c.author?.avatar_url} name={c.author?.full_name ?? c.author?.username} />
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm">
                <Link href={`/@${c.author?.username}`} className="font-medium hover:underline">
                  {c.author?.full_name ?? c.author?.username}
                </Link>
                <span className="text-zinc-500">{formatDate(c.created_at)}</span>
                {viewerId && (viewerId === c.author_id || viewerId === postAuthorId) && (
                  <form action={deleteComment.bind(null, c.id)} className="ml-auto">
                    <button className="text-xs text-zinc-500 hover:text-red-600">삭제</button>
                  </form>
                )}
              </div>
              <p className="mt-1 whitespace-pre-wrap break-words">{c.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function PostPage({ params }: PageProps<"/u/[username]/[slug]">) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <Suspense fallback={<p className="text-sm text-zinc-500">글을 불러오는 중...</p>}>
        <PostView params={params} />
      </Suspense>
    </main>
  );
}
