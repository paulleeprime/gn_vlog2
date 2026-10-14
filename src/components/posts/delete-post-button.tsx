"use client";

import { useTransition } from "react";
import { deletePost } from "@/actions/posts";

export function DeletePostButton({ postId }: { postId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() => {
        if (!confirm("이 글을 삭제할까요? 되돌릴 수 없습니다.")) return;
        startTransition(() => deletePost(postId));
      }}
      className="text-sm text-red-600 hover:underline disabled:opacity-50"
    >
      {pending ? "삭제 중..." : "삭제"}
    </button>
  );
}
