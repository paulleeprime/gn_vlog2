-- Profiles: public handle + bio, readable by everyone, email no longer stored here
alter table public.profiles
  add column username text unique
    check (username ~ '^[a-z0-9_]{3,20}$'),
  add column bio text check (char_length(bio) <= 300);

alter table public.profiles drop column email;

drop policy "Users can view own profile" on public.profiles;

create policy "Profiles are viewable by everyone" on public.profiles
  for select to anon, authenticated
  using (true);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.set_updated_at() from public, anon, authenticated;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Posts
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  slug text not null check (char_length(slug) between 1 and 120),
  content jsonb not null,
  excerpt text,
  cover_image_url text,
  published boolean not null default true,
  view_count bigint not null default 0,
  like_count integer not null default 0,
  comment_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (author_id, slug)
);

create index posts_published_created_at_idx on public.posts (created_at desc) where published;
create index posts_author_id_created_at_idx on public.posts (author_id, created_at desc);

alter table public.posts enable row level security;

create policy "Published posts are viewable by everyone" on public.posts
  for select to anon, authenticated
  using (published or (select auth.uid()) = author_id);

create policy "Authors can create posts" on public.posts
  for insert to authenticated
  with check ((select auth.uid()) = author_id);

create policy "Authors can update own posts" on public.posts
  for update to authenticated
  using ((select auth.uid()) = author_id)
  with check ((select auth.uid()) = author_id);

create policy "Authors can delete own posts" on public.posts
  for delete to authenticated
  using ((select auth.uid()) = author_id);

-- Counters are maintained by triggers/RPC only
revoke insert, update on public.posts from anon, authenticated;
grant insert (author_id, title, slug, content, excerpt, cover_image_url, published)
  on public.posts to authenticated;
grant update (title, slug, content, excerpt, cover_image_url, published)
  on public.posts to authenticated;

create trigger posts_set_updated_at
  before update of title, slug, content, excerpt, cover_image_url, published on public.posts
  for each row execute function public.set_updated_at();

-- Likes
create table public.post_likes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index post_likes_user_id_idx on public.post_likes (user_id);

alter table public.post_likes enable row level security;

create policy "Likes are viewable by everyone" on public.post_likes
  for select to anon, authenticated
  using (true);

create policy "Users can like posts" on public.post_likes
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can remove own likes" on public.post_likes
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Comments
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index comments_post_id_created_at_idx on public.comments (post_id, created_at);
create index comments_author_id_idx on public.comments (author_id);

alter table public.comments enable row level security;

create policy "Comments are viewable by everyone" on public.comments
  for select to anon, authenticated
  using (true);

create policy "Users can comment on published posts" on public.comments
  for insert to authenticated
  with check (
    (select auth.uid()) = author_id
    and exists (select 1 from public.posts p where p.id = post_id and p.published)
  );

create policy "Comment or post authors can delete comments" on public.comments
  for delete to authenticated
  using (
    (select auth.uid()) = author_id
    or exists (select 1 from public.posts p where p.id = post_id and p.author_id = (select auth.uid()))
  );

-- Follows
create table public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create index follows_following_id_idx on public.follows (following_id);

alter table public.follows enable row level security;

create policy "Follows are viewable by everyone" on public.follows
  for select to anon, authenticated
  using (true);

create policy "Users can follow others" on public.follows
  for insert to authenticated
  with check ((select auth.uid()) = follower_id);

create policy "Users can unfollow" on public.follows
  for delete to authenticated
  using ((select auth.uid()) = follower_id);

-- Counter triggers
create function public.handle_post_like_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set like_count = like_count + 1 where id = new.post_id;
    return new;
  end if;
  update public.posts set like_count = greatest(like_count - 1, 0) where id = old.post_id;
  return old;
end;
$$;

create function public.handle_comment_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set comment_count = comment_count + 1 where id = new.post_id;
    return new;
  end if;
  update public.posts set comment_count = greatest(comment_count - 1, 0) where id = old.post_id;
  return old;
end;
$$;

revoke execute on function public.handle_post_like_change() from public, anon, authenticated;
revoke execute on function public.handle_comment_change() from public, anon, authenticated;

create trigger on_post_like_change
  after insert or delete on public.post_likes
  for each row execute function public.handle_post_like_change();

create trigger on_comment_change
  after insert or delete on public.comments
  for each row execute function public.handle_comment_change();

-- View counter
create function public.increment_post_view(p_post_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.posts set view_count = view_count + 1
  where id = p_post_id and published;
$$;

revoke execute on function public.increment_post_view(uuid) from public;
grant execute on function public.increment_post_view(uuid) to anon, authenticated;

-- Storage
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-images',
  'post-images',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/gif', 'image/webp']
);

create policy "Users can upload post images to own folder" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can update own post images" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can delete own post images" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
