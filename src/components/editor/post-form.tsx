"use client";

import { useActionState, useState } from "react";
import type { JSONContent } from "@tiptap/react";
import { savePost, type PostFormState } from "@/actions/posts";
import { EMPTY_DOC } from "@/lib/editor/content";
import { LEDE_MAX } from "@/lib/seo";
import { PostEditor } from "./post-editor";
import { SeoPanel } from "./seo-panel";

type Props = {
  userId: string;
  username: string;
  post?: {
    id: string;
    title: string;
    lede: string | null;
    content: JSONContent;
    published: boolean;
  };
};

export function PostForm({ userId, username, post }: Props) {
  const [title, setTitle] = useState(post?.title ?? "");
  const [lede, setLede] = useState(post?.lede ?? "");
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
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="제목"
        className="w-full bg-transparent text-3xl font-bold outline-none placeholder:text-zinc-400"
      />
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">이 글의 한 줄</span>
        <textarea
          name="lede"
          maxLength={LEDE_MAX}
          rows={2}
          value={lede}
          onChange={(event) => setLede(event.target.value)}
          placeholder="검색과 AI가 인용할 결론을 한 문장으로 적으세요."
          className="w-full resize-none rounded-lg border border-[#e4d9c8] bg-transparent px-3 py-2 outline-none"
        />
      </label>
      <SeoPanel username={username} title={title} lede={lede} content={content} />
      <PostEditor userId={userId} initialContent={post?.content ?? EMPTY_DOC} onChange={setContent} />
      <div className="sticky bottom-0 flex items-center justify-between gap-4 border-t border-[#e4d9c8] bg-background py-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="published" defaultChecked={post?.published ?? true} />
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
