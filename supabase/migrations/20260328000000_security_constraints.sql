-- Length constraints on trades text fields to prevent storage abuse.
-- Long-form fields (notes, thesis, lessons, setup) are capped at 10 000 chars —
-- generous for real journal use, but blocks multi-MB submissions.
-- symbol is capped at 20 to cover crypto tickers; most equities are ≤5.

alter table public.trades
  add constraint trades_symbol_length     check (char_length(symbol)  <= 20),
  add constraint trades_setup_length      check (char_length(setup)   <= 200),
  add constraint trades_notes_length      check (char_length(notes)   <= 10000),
  add constraint trades_thesis_length     check (char_length(thesis)  <= 10000),
  add constraint trades_lessons_length    check (char_length(lessons) <= 10000);

-- Allow users to update their own profile (e.g. email sync, future settings).
-- DELETE is intentionally omitted — profile deletion should be admin-only.
create policy "Users can update their own profile"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
