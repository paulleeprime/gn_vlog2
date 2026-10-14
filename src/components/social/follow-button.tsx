"use client";

import { useOptimistic, useTransition } from "react";
import { setFollow } from "@/actions/social";

type Props = {
  targetId: string;
  following: boolean;
  canFollow: boolean;
};

export function FollowButton({ targetId, following, canFollow }: Props) {
  const [, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(following);

  function toggle() {
    if (!canFollow) {
      alert("로그인 후 팔로우할 수 있습니다.");
      return;
    }
    const next = !optimistic;
    startTransition(async () => {
      setOptimistic(next);
      await setFollow(targetId, next);
    });
  }

  return (
    <button
      onClick={toggle}
      className={`h-9 rounded-full px-5 text-sm font-medium transition-colors ${
        optimistic
          ? "border border-black/15 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
          : "bg-foreground text-background hover:opacity-90"
      }`}
    >
      {optimistic ? "팔로잉" : "팔로우"}
    </button>
  );
}
