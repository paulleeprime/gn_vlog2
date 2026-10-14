"use client";

import { useOptimistic, useTransition } from "react";
import { setLike } from "@/actions/social";
import { formatCount } from "@/lib/format";

type Props = {
  postId: string;
  liked: boolean;
  count: number;
  canLike: boolean;
};

export function LikeButton({ postId, liked, count, canLike }: Props) {
  const [, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic({ liked, count });

  function toggle() {
    if (!canLike) {
      alert("로그인 후 좋아요를 누를 수 있습니다.");
      return;
    }
    const next = !optimistic.liked;
    startTransition(async () => {
      setOptimistic({ liked: next, count: optimistic.count + (next ? 1 : -1) });
      await setLike(postId, next);
    });
  }

  return (
    <button
      onClick={toggle}
      aria-pressed={optimistic.liked}
      className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors ${
        optimistic.liked
          ? "border-rose-300 bg-rose-50 text-rose-600 dark:border-rose-800 dark:bg-rose-950"
          : "border-black/10 hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
      }`}
    >
      <span aria-hidden>{optimistic.liked ? "♥" : "♡"}</span>
      좋아요 {formatCount(optimistic.count)}
    </button>
  );
}
