create table public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  symbol text not null,
  setup text,
  direction text not null check (direction in ('Long', 'Short')),
  entry_price numeric(12, 4) not null check (entry_price > 0),
  exit_price numeric(12, 4),
  quantity integer not null check (quantity > 0),
  opened_at timestamptz not null,
  closed_at timestamptz,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (closed_at is null or closed_at >= opened_at)
);

create index trades_user_id_opened_at_idx
  on public.trades (user_id, opened_at desc);

alter table public.trades enable row level security;

create policy "Users can view their own trades"
  on public.trades
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own trades"
  on public.trades
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own trades"
  on public.trades
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own trades"
  on public.trades
  for delete
  using (auth.uid() = user_id);
