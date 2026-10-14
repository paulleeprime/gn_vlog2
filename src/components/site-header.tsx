import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { signOut } from "@/app/auth/actions";
import { Avatar } from "@/components/avatar";
import { getViewer } from "@/lib/auth";
import { site } from "@/lib/site";

async function HeaderActions() {
  const viewer = await getViewer();
  if (!viewer) return null;

  const username = viewer.profile?.username;
  if (!username) {
    return (
      <Link href="/onboarding" className="text-sm font-medium underline">
        아이디 설정하기
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/write"
        className="flex h-9 items-center rounded-full bg-foreground px-4 text-sm font-medium text-background"
      >
        글쓰기
      </Link>
      <Link href={`/@${username}`} aria-label="내 블로그">
        <Avatar src={viewer.profile?.avatar_url} name={viewer.profile?.full_name ?? username} />
      </Link>
      <form action={signOut}>
        <button className="text-sm text-zinc-500 hover:text-foreground">로그아웃</button>
      </form>
    </div>
  );
}

export function SiteHeader() {
  return (
    <header className="border-b border-black/10 dark:border-white/10">
      <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5 text-lg font-bold tracking-tight">
          <Image src="/logo.jpg" alt="" width={36} height={36} className="h-9 w-9" priority />
          {site.name}
        </Link>
        <Suspense fallback={null}>
          <HeaderActions />
        </Suspense>
      </div>
    </header>
  );
}
