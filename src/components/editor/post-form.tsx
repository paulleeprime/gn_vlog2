"use client";

import { useActionState, useState } from "react";
import type { JSONContent } from "@tiptap/react";
import { savePost, type PostFormState } from "@/actions/posts";
import { EMPTY_DOC } from "@/lib/editor/content";
import { PostEditor } from "./post-editor";

type Props = {
  userId: string;
  post?: {
    id: string;
    title: string;
    content: JSONContent;
    published: boolean;
  };
};

export function PostForm({ userId, post }: Props) {
  const [content, setContent] = useState<JSONContent>(post?.content ?? EMPTY_DOC);
  const [state, formAction, pending] = useActionState<PostFormState, FormData>(
    savePost,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {post && <input type="hidden" name="postId" value={post.id} />}
      <input type="hidden" name="content" value={JSON.stringify(content)} />
      <input
        name="title"
        required
        maxLength={200}
        defaultValue={post?.title}
        placeholder="제목"
        className="w-full bg-transparent text-3xl font-bold outline-none placeholder:text-zinc-400"
      />
      <PostEditor
        userId={userId}
        initialContent={post?.content ?? EMPTY_DOC}
        onChange={setContent}
      />
      <div className="sticky bottom-0 flex items-center justify-between gap-4 border-t border-black/10 bg-background py-4 dark:border-white/15">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="published"
            defaultChecked={post?.published ?? true}
          />
          공개
        </label>
        <div className="flex items-center gap-3">
          {state.error && <p className="text-sm text-red-600">{state.error}</p>}
          <button
            disabled={pending}
            className="h-10 rounded-full bg-foreground px-6 font-medium text-background disabled:opacity-50"
          >
            {pending ? "저장 중..." : post ? "수정하기" : "발행하기"}
          </button>
        </div>
      </div>
    </form>
  );
}
