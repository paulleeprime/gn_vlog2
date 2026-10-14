"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/safe-next-path";

export type OnboardingState = { error?: string };

const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

export async function saveUsername(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const bio = String(formData.get("bio") ?? "").trim().slice(0, 300);
  const next = safeNextPath(String(formData.get("next") ?? "/"));

  if (!USERNAME_PATTERN.test(username)) {
    return { error: "아이디는 영어 소문자, 숫자, _ 로 3~20자여야 합니다." };
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) redirect("/?error=login_required");

  const { error } = await supabase
    .from("profiles")
    .update({ username, bio: bio || null })
    .eq("id", userId);

  if (error) {
    if (error.code === "23505") return { error: "이미 사용 중인 아이디입니다." };
    return { error: "저장하지 못했습니다. 다시 시도해 주세요." };
  }

  redirect(next === "/" ? `/@${username}` : next);
}
