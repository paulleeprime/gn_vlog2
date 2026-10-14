"use client";

import { useEffect, useRef, useState } from "react";
import { recordView } from "@/actions/social";
import { formatCount } from "@/lib/format";

// Counts a view once per page open, not on server re-renders triggered by likes or comments.
export function ViewCounter({ postId, initialCount }: { postId: string; initialCount: number }) {
  const [recorded, setRecorded] = useState<number | null>(null);
  const sent = useRef<string | null>(null);

  useEffect(() => {
    if (sent.current === postId) return;
    sent.current = postId;
    recordView(postId).then(setRecorded);
  }, [postId]);

  return <span>조회 {formatCount(Math.max(initialCount, recorded ?? initialCount))}</span>;
}
