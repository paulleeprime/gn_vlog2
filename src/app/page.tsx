import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { PostCard } from "@/components/posts/post-card";
import { getViewer } from "@/lib/auth";
import { POST_CARD_COLUMNS } from "@/lib/queries";
import { site } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

type SearchParams = Promise<{ feed?: string; error?: string }>;

const ERROR_MESSAGES: Record<string, string> = {
  auth: "로그인에 실패했습니다. 다시 시도해 주세요.",
  login_required: "로그인이 필요한 페이지입니다.",
};

async function Feed({ searchParams }: { searchParams: SearchParams }) {
  const { feed, error } = await searchParams;
  const viewer = await getViewer();
  const showFollowing = feed === "following" && Boolean(viewer);
  const supabase = await createClient();

  let query = supabase
    .from("posts")
    .select(POST_CARD_COLUMNS)
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(30);

  if (showFollowing && viewer) {
    const { data: follows } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", viewer.id);
    query = query.in("author_id", (follows ?? []).map((f) => f.following_id));
  }

  const { data: posts } = await query;
  const tabClass = (active: boolean) =>
    `border-b-2 pb-3 text-sm font-medium ${
      active ? "border-foreground" : "border-transparent text-zinc-500 hover:text-foreground"
    }`;

  return (
    <>
      {error && ERROR_MESSAGES[error] && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {ERROR_MESSAGES[error]}
        </p>
      )}

      {!viewer && (
        <section className="flex flex-col items-center px-2 pt-16 pb-6 text-center">
          <p className="text-[0.7rem] tracking-[0.42em] text-[#8a7b68]">RY</p>
          <h1 className="mt-6 font-serif text-5xl font-medium tracking-tight sm:text-6xl">
            {site.name}
          </h1>
          <p className="mt-5 font-serif text-xl text-[#5c5146]">{site.tagline}</p>
          <div className="mt-9 flex items-center gap-5">
            <span className="h-px w-16 bg-[#d9cfc0]" />
            <Image
              src="/logo.jpg"
              alt="RY 로고"
              width={96}
              height={96}
              className="h-24 w-24"
            />
            <span className="h-px w-16 bg-[#d9cfc0]" />
          </div>
          <p className="mt-8 max-w-md text-[1.05rem] leading-8 text-[#6a5e52]">
            {site.description}
          </p>
        </section>
      )}

      {viewer && (
        <nav className="flex gap-6 border-b border-[#e4d9c8]">
          <Link href="/" className={tabClass(!showFollowing)}>
            최신 글
          </Link>
          <Link href="/?feed=following" className={tabClass(showFollowing)}>
            팔로잉
          </Link>
        </nav>
      )}

      <section>
        {posts && posts.length > 0 ? (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        ) : (
          <p className="py-16 text-center text-zinc-500">
            {showFollowing
              ? "팔로우한 사람의 글이 아직 없습니다."
              : "아직 첫 글이 비어 있습니다. 첫 글을 써 보세요."}
          </p>
        )}
      </section>
    </>
  );
}

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-10">
      <Suspense fallback={<p className="text-sm text-zinc-500">불러오는 중...</p>}>
        <Feed searchParams={searchParams as SearchParams} />
      </Suspense>
    </main>
  );
}
