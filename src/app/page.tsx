import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

type SearchParams = Promise<{ welcome?: string; error?: string }>;

async function AuthPanel({ searchParams }: { searchParams: SearchParams }) {
  const { welcome, error } = await searchParams;
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;

  if (!userId) {
    return (
      <div className="flex flex-col items-center gap-4">
        {error && (
          <p className="text-sm text-red-600">
            로그인에 실패했습니다. 다시 시도해 주세요.
          </p>
        )}
        <GoogleSignInButton />
      </div>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name, avatar_url, created_at")
    .eq("id", userId)
    .single();

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl border border-black/10 p-6 dark:border-white/15">
      {welcome && (
        <p className="font-medium text-emerald-600">🎉 회원가입이 완료되었습니다!</p>
      )}
      {profile?.avatar_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profile.avatar_url}
          alt=""
          referrerPolicy="no-referrer"
          className="h-16 w-16 rounded-full"
        />
      )}
      <div className="text-center">
        <p className="text-lg font-semibold">{profile?.full_name ?? "이름 없음"}</p>
        <p className="text-sm text-zinc-500">{profile?.email}</p>
        {profile && (
          <p className="mt-1 text-xs text-zinc-400">
            가입일 {new Date(profile.created_at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}
          </p>
        )}
      </div>
      <form action={signOut}>
        <button className="rounded-full border border-black/10 px-5 py-2 text-sm font-medium hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10">
          로그아웃
        </button>
      </form>
    </div>
  );
}

export default function Home({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 bg-zinc-50 px-6 py-24 font-sans dark:bg-black">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">gn vlog</h1>
        <p className="mt-3 text-zinc-600 dark:text-zinc-400">
          Google 계정으로 바로 가입하고 시작하세요.
        </p>
      </div>
      <Suspense fallback={<p className="text-sm text-zinc-500">확인 중...</p>}>
        <AuthPanel searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
