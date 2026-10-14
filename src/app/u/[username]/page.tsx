import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/avatar";
import { PostCard } from "@/components/posts/post-card";
import { FollowButton } from "@/components/social/follow-button";
import { getViewer } from "@/lib/auth";
import { decodeParam, formatCount } from "@/lib/format";
import { getProfileByUsername, POST_CARD_COLUMNS } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

async function Profile({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const profile = await getProfileByUsername(decodeParam(username));
  if (!profile) notFound();

  const supabase = await createClient();
  const viewer = await getViewer();
  const isSelf = viewer?.id === profile.id;

  const [followers, following, isFollowing, posts] = await Promise.all([
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", profile.id),
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", profile.id),
    viewer && !isSelf
      ? supabase
          .from("follows")
          .select("follower_id")
          .eq("follower_id", viewer.id)
          .eq("following_id", profile.id)
          .maybeSingle()
      : Promise.resolve(null),
    supabase
      .from("posts")
      .select(POST_CARD_COLUMNS)
      .eq("author_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const displayName = profile.full_name ?? profile.username;

  return (
    <>
      <header className="flex flex-col gap-5 border-b border-black/10 pb-8 dark:border-white/10 sm:flex-row sm:items-center">
        <Avatar src={profile.avatar_url} name={displayName} size={88} />
        <div className="flex flex-1 flex-col gap-2">
          <div>
            <h1 className="text-2xl font-bold">{displayName}</h1>
            <p className="text-zinc-500">@{profile.username}</p>
          </div>
          {profile.bio && <p className="whitespace-pre-wrap">{profile.bio}</p>}
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            팔로워 <b>{formatCount(followers.count ?? 0)}</b> · 팔로잉{" "}
            <b>{formatCount(following.count ?? 0)}</b> · 글{" "}
            <b>{formatCount(posts.data?.length ?? 0)}</b>
          </p>
        </div>
        {isSelf ? (
          <Link
            href="/write"
            className="flex h-9 items-center rounded-full bg-foreground px-5 text-sm font-medium text-background"
          >
            새 글 쓰기
          </Link>
        ) : (
          <FollowButton
            targetId={profile.id}
            following={Boolean(isFollowing?.data)}
            canFollow={Boolean(viewer?.profile?.username)}
          />
        )}
      </header>

      <section>
        {posts.data && posts.data.length > 0 ? (
          posts.data.map((post) => <PostCard key={post.id} post={post} showAuthor={false} />)
        ) : (
          <p className="py-16 text-center text-zinc-500">아직 작성한 글이 없습니다.</p>
        )}
      </section>
    </>
  );
}

export default function ProfilePage({ params }: PageProps<"/u/[username]">) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <Suspense fallback={<p className="text-sm text-zinc-500">불러오는 중...</p>}>
        <Profile params={params} />
      </Suspense>
    </main>
  );
}
