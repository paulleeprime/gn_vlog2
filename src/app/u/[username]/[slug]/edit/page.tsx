import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { JSONContent } from "@tiptap/react";
import { PostForm } from "@/components/editor/post-form";
import { requireViewerWithUsername } from "@/lib/auth";
import { decodeParam } from "@/lib/format";
import { getPost } from "@/lib/queries";

async function EditPost({
  params,
}: {
  params: Promise<{ username: string; slug: string }>;
}) {
  const viewer = await requireViewerWithUsername();
  const { username, slug } = await params;
  const result = await getPost(decodeParam(username), decodeParam(slug));
  if (!result || result.post.author_id !== viewer.id) notFound();
  const { post } = result;

  return (
    <PostForm
      userId={viewer.id}
      post={{
        id: post.id,
        title: post.title,
        content: post.content as JSONContent,
        published: post.published,
      }}
    />
  );
}

export default function EditPostPage({ params }: PageProps<"/u/[username]/[slug]/edit">) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <Suspense fallback={<p className="text-sm text-zinc-500">에디터를 불러오는 중...</p>}>
        <EditPost params={params} />
      </Suspense>
    </main>
  );
}
