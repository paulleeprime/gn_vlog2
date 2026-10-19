alter table public.posts
  add column lede text check (char_length(lede) <= 160);

grant insert (lede), update (lede) on public.posts to authenticated;

drop trigger posts_set_updated_at on public.posts;

create trigger posts_set_updated_at
  before update of title, slug, content, excerpt, cover_image_url, published, lede
  on public.posts
  for each row execute function public.set_updated_at();
