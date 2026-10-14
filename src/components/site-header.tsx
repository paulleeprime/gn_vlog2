import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { signOut } from "@/app/auth/actions";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { Avatar } from "@/components/avatar";
import { getViewer } from "@/lib/auth";
import { site } from "@/lib/site";

async function HeaderActions() {
  const viewer = await getViewer();
  if (!viewer) return <GoogleSignInButton />;

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
    <header className="border-b border-[#e4d9c8]">
      <div className="mx-auto flex h-[4.5rem] w-full max-w-3xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3 font-serif text-xl font-medium tracking-tight">
          <Image src="/logo.jpg" alt="" width={40} height={40} className="h-10 w-10" priority />
          {site.name}
        </Link>
        <Suspense fallback={null}>
          <HeaderActions />
        </Suspense>
      </div>
    </header>
  );
}
