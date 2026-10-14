import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth";
import { safeNextPath } from "@/lib/safe-next-path";
import { OnboardingForm } from "./onboarding-form";

async function Onboarding({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const viewer = await getViewer();
  if (!viewer) redirect("/?error=login_required");

  const { next } = await searchParams;
  const safeNext = safeNextPath(next);
  if (viewer.profile?.username) redirect(safeNext);

  return <OnboardingForm next={safeNext} />;
}

export default function OnboardingPage({ searchParams }: PageProps<"/onboarding">) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-16">
      <div className="text-center">
        <h1 className="text-2xl font-bold">회원가입을 마무리해 주세요</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          블로그 주소로 사용할 아이디를 정해 주세요.
        </p>
      </div>
      <Suspense fallback={<p className="text-sm text-zinc-500">불러오는 중...</p>}>
        <Onboarding searchParams={searchParams as Promise<{ next?: string }>} />
      </Suspense>
    </main>
  );
}
