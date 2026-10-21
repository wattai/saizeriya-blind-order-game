-- 全国ランキング用テーブル。Supabase の SQL Editor で実行する
create table if not exists public.scores (
  id bigint generated always as identity primary key,
  name text not null check (char_length(btrim(name)) between 1 and 12),
  score integer not null check (score between 0 and 15000),
  correct smallint not null check (correct between 0 and 10),
  -- 1問あたりの最高点は (100 + 300) × 3 + コンボ 9 × 50 = 1650
  constraint score_matches_correct check (score <= correct * 1650),
  bill integer not null default 0 check (bill between 0 and 100000),
  created_at timestamptz not null default now()
);
create index if not exists scores_score_idx on public.scores (score desc);
create index if not exists scores_created_idx on public.scores (created_at desc);

-- 誰でも閲覧・登録できるが、更新・削除はできない
alter table public.scores enable row level security;
drop policy if exists "scores are public" on public.scores;
create policy "scores are public" on public.scores for select to anon using (true);
drop policy if exists "anyone can submit" on public.scores;
create policy "anyone can submit" on public.scores for insert to anon with check (created_at > now() - interval '1 minute');
grant select, insert on public.scores to anon;
-- Supabase は既定で anon に全権限を付けるので、更新・削除の権限も明示的に外す（RLS でも防がれている）
revoke update, delete, truncate on public.scores from anon, authenticated;
