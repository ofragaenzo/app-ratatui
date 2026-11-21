begin;

create table public.diary_meals (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
    title text not null check (char_length(title) <= 80 and title ~ '[^[:space:]]'),
    category text not null check (category in ('breakfast', 'lunch', 'snack', 'dinner')),
    caption text not null default '' check (char_length(caption) <= 240),
    ingredients text not null default '' check (char_length(ingredients) <= 1000),
    created_at timestamptz not null default now()
);

create index diary_meals_user_created_idx
    on public.diary_meals (user_id, created_at desc, id desc);

alter table public.diary_meals enable row level security;
revoke all on table public.diary_meals from public, anon, authenticated;
grant select on public.diary_meals to authenticated;
grant insert (title, category, caption, ingredients) on public.diary_meals to authenticated;

create policy diary_meals_read_own on public.diary_meals
    for select to authenticated using ((select auth.uid()) = user_id);

create policy diary_meals_insert_own on public.diary_meals
    for insert to authenticated with check ((select auth.uid()) = user_id);

commit;
