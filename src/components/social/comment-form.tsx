"use client";

import { useActionState } from "react";
import { addComment, type CommentFormState } from "@/actions/social";

export function CommentForm({ postId }: { postId: string }) {
  const [state, formAction, pending] = useActionState<CommentFormState, FormData>(
    addComment,
    {},
  );

  return (
    <form action={formAction} key={state.ok} className="flex flex-col gap-2">
      <input type="hidden" name="postId" value={postId} />
      <textarea
        name="body"
        required
        maxLength={2000}
        rows={3}
        placeholder="댓글을 남겨 주세요"
        className="w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 outline-none focus:border-black/40 dark:border-white/20 dark:focus:border-white/50"
      />
      <div className="flex items-center justify-end gap-3">
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button
          disabled={pending}
          className="h-9 rounded-full bg-foreground px-5 text-sm font-medium text-background disabled:opacity-50"
        >
          {pending ? "등록 중..." : "댓글 등록"}
        </button>
      </div>
    </form>
  );
}
