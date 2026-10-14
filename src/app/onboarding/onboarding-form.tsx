"use client";

import { useActionState } from "react";
import { saveUsername, type OnboardingState } from "./actions";

export function OnboardingForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState<OnboardingState, FormData>(
    saveUsername,
    {},
  );

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">아이디</span>
        <div className="flex items-center rounded-lg border border-black/15 px-3 dark:border-white/20">
          <span className="text-zinc-500">@</span>
          <input
            name="username"
            required
            minLength={3}
            maxLength={20}
            pattern="[a-z0-9_]{3,20}"
            placeholder="my_blog"
            className="w-full bg-transparent px-1 py-2 outline-none"
          />
        </div>
        <span className="text-xs text-zinc-500">
          영어 소문자, 숫자, _ 로 3~20자. 블로그 주소가 /@아이디 가 됩니다.
        </span>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">소개 (선택)</span>
        <textarea
          name="bio"
          maxLength={300}
          rows={3}
          className="rounded-lg border border-black/15 bg-transparent px-3 py-2 outline-none dark:border-white/20"
        />
      </label>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        disabled={pending}
        className="h-11 rounded-full bg-foreground font-medium text-background disabled:opacity-50"
      >
        {pending ? "저장 중..." : "시작하기"}
      </button>
    </form>
  );
}
