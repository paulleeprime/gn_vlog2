import { Suspense } from "react";
import { connection } from "next/server";

async function ConnectionStatus() {
  await connection();

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/health`,
    {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY! },
    },
  );

  return (
    <p className="mt-4">
      {res.ok
        ? "✅ Supabase에 연결되었습니다."
        : `❌ 연결 실패: ${res.status} ${res.statusText}`}
    </p>
  );
}

export default function SupabaseCheckPage() {
  return (
    <main className="p-8 font-mono">
      <h1 className="text-xl font-bold">Supabase 연결 확인</h1>
      <Suspense fallback={<p className="mt-4">확인 중...</p>}>
        <ConnectionStatus />
      </Suspense>
    </main>
  );
}
