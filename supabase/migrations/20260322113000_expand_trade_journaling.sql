alter table public.trades
  add column if not exists status text not null default 'Open'
    check (status in ('Open', 'Closed')),
  add column if not exists entry_value numeric(14, 4) not null default 0,
  add column if not exists realized_pnl numeric(14, 4) not null default 0,
  add column if not exists realized_pnl_percent numeric(12, 6),
  add column if not exists holding_minutes integer,
  add column if not exists trade_date date,
  add column if not exists followed_plan boolean,
  add column if not exists confidence_rating smallint
    check (confidence_rating between 1 and 5),
  add column if not exists grade text
    check (grade in ('A', 'B', 'C', 'D', 'F')),
  add column if not exists tags text[] not null default '{}'::text[],
  add column if not exists mistake_tags text[] not null default '{}'::text[],
  add column if not exists thesis text,
  add column if not exists lessons text;

create or replace function public.set_trade_derived_fields()
returns trigger
language plpgsql
as $$
declare
  next_entry_value numeric(14, 4);
  next_realized_pnl numeric(14, 4);
begin
  next_entry_value := round((new.entry_price * new.quantity)::numeric, 4);
  new.entry_value := next_entry_value;

  if new.exit_price is not null and new.closed_at is not null then
    new.status := 'Closed';
    next_realized_pnl := round((
      case
        when new.direction = 'Long' then (new.exit_price - new.entry_price) * new.quantity
        else (new.entry_price - new.exit_price) * new.quantity
      end
    )::numeric, 4);
    new.realized_pnl := next_realized_pnl;
    new.realized_pnl_percent := case
      when next_entry_value > 0 then round((next_realized_pnl / next_entry_value)::numeric, 6)
      else null
    end;
    new.holding_minutes := greatest(
      1,
      round(extract(epoch from (new.closed_at - new.opened_at)) / 60.0)::integer
    );
    new.trade_date := (new.closed_at at time zone 'utc')::date;
  else
    new.status := 'Open';
    new.realized_pnl := 0;
    new.realized_pnl_percent := null;
    new.holding_minutes := null;
    new.trade_date := (new.opened_at at time zone 'utc')::date;
  end if;

  new.updated_at := timezone('utc', now());

  return new;
end;
$$;

drop trigger if exists set_trade_derived_fields_on_write on public.trades;

create trigger set_trade_derived_fields_on_write
before insert or update on public.trades
for each row
execute function public.set_trade_derived_fields();

update public.trades
set
  status = case
    when exit_price is not null and closed_at is not null then 'Closed'
    else 'Open'
  end,
  entry_value = round((entry_price * quantity)::numeric, 4),
  realized_pnl = round((
    case
      when exit_price is not null and closed_at is not null and direction = 'Long'
        then (exit_price - entry_price) * quantity
      when exit_price is not null and closed_at is not null and direction = 'Short'
        then (entry_price - exit_price) * quantity
      else 0
    end
  )::numeric, 4),
  realized_pnl_percent = case
    when exit_price is not null and closed_at is not null and entry_price * quantity > 0
      then round((
        case
          when direction = 'Long'
            then ((exit_price - entry_price) * quantity) / (entry_price * quantity)
          else ((entry_price - exit_price) * quantity) / (entry_price * quantity)
        end
      )::numeric, 6)
    else null
  end,
  holding_minutes = case
    when exit_price is not null and closed_at is not null
      then greatest(
        1,
        round(extract(epoch from (closed_at - opened_at)) / 60.0)::integer
      )
    else null
  end,
  trade_date = (coalesce(closed_at, opened_at) at time zone 'utc')::date;

create index if not exists trades_user_id_trade_date_idx
  on public.trades (user_id, trade_date desc);

create index if not exists trades_user_id_status_trade_date_idx
  on public.trades (user_id, status, trade_date desc);

create index if not exists trades_user_id_symbol_trade_date_idx
  on public.trades (user_id, symbol, trade_date desc);

create index if not exists trades_user_id_setup_trade_date_idx
  on public.trades (user_id, setup, trade_date desc);

create index if not exists trades_user_id_followed_plan_trade_date_idx
  on public.trades (user_id, followed_plan, trade_date desc);
