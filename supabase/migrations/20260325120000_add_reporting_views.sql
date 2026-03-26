-- Reporting views for dashboard and analytics pages.
-- All views scope by user_id so they are safe to call with the user's supabase client
-- and RLS on the underlying trades table enforces row-level ownership.

create or replace view public.v_daily_pnl as
  select
    user_id,
    trade_date,
    count(*)                                                   as total_trades,
    count(*) filter (where status = 'Closed')                  as closed_trades,
    count(*) filter (where status = 'Closed' and realized_pnl > 0) as wins,
    count(*) filter (where status = 'Closed' and realized_pnl < 0) as losses,
    coalesce(sum(realized_pnl) filter (where status = 'Closed'), 0) as daily_pnl,
    coalesce(sum(entry_value), 0)                              as daily_entry_value
  from public.trades
  where trade_date is not null
  group by user_id, trade_date;

create or replace view public.v_setup_performance as
  select
    user_id,
    coalesce(setup, 'Unclassified')                            as setup,
    count(*)                                                   as total_trades,
    count(*) filter (where status = 'Closed')                  as closed_trades,
    count(*) filter (where status = 'Closed' and realized_pnl > 0) as wins,
    coalesce(sum(realized_pnl) filter (where status = 'Closed'), 0) as total_pnl,
    coalesce(avg(realized_pnl) filter (where status = 'Closed'), 0) as avg_pnl,
    coalesce(sum(entry_value), 0)                              as total_entry_value,
    case
      when sum(entry_value) > 0
        then sum(realized_pnl) filter (where status = 'Closed') / sum(entry_value)
      else 0
    end                                                        as return_percent,
    count(*) filter (where followed_plan = true)               as followed_plan_count,
    count(*) filter (where followed_plan is not null)          as reviewed_count
  from public.trades
  group by user_id, coalesce(setup, 'Unclassified');

create or replace view public.v_trade_metrics as
  select
    user_id,
    count(*)                                                   as total_trades,
    count(*) filter (where status = 'Open')                    as open_trades,
    count(*) filter (where status = 'Closed')                  as closed_trades,
    count(*) filter (where status = 'Closed' and realized_pnl > 0) as wins,
    count(*) filter (where status = 'Closed' and realized_pnl < 0) as losses,
    coalesce(sum(realized_pnl) filter (where status = 'Closed'), 0) as total_closed_pnl,
    coalesce(sum(entry_value), 0)                              as total_money_traded,
    coalesce(sum(entry_value) filter (where status = 'Open'), 0) as total_currently_invested,
    coalesce(sum(realized_pnl) filter (where status = 'Closed' and realized_pnl > 0), 0) as gross_profit,
    coalesce(abs(sum(realized_pnl) filter (where status = 'Closed' and realized_pnl < 0)), 0) as gross_loss,
    coalesce(avg(holding_minutes) filter (where status = 'Closed'), 0) as avg_hold_minutes
  from public.trades
  group by user_id;
