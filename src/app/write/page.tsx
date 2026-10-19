import { Suspense } from "react";
import { requireViewerWithUsername } from "@/lib/auth";
import { PostForm } from "@/components/editor/post-form";

async function NewPost() {
  const viewer = await requireViewerWithUsername();
  return <PostForm userId={viewer.id} username={viewer.username} />;
}

export default function WritePage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <Suspense fallback={<p className="text-sm text-zinc-500">에디터를 불러오는 중...</p>}>
        <NewPost />
      </Suspense>
    </main>
  );
}
