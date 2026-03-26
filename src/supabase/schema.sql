








-- Mercado Arcano - Supabase schema

create table if not exists public.players (
    id uuid primary key references auth.users (id) on delete cascade,
    created_at timestamptz not null default now(),
    gold integer not null default 0 check (gold >= 0)
);

create table if not exists public.inventory (
    id uuid primary key default gen_random_uuid(),
    player_id uuid not null references public.players (id) on delete cascade,
    item_id text not null,
    quantity integer not null check (quantity >= 0),
    created_at timestamptz not null default now(),
    unique (player_id, item_id)
);

create table if not exists public.market (
    id uuid primary key default gen_random_uuid(),
    item_id text not null unique,
    price integer not null check (price >= 0),
    stock integer not null check (stock >= 0),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.players enable row level security;
alter table public.inventory enable row level security;
alter table public.market enable row level security;

drop policy if exists "players_own_row" on public.players;
create policy "players_own_row" on public.players
for all to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "inventory_own_rows" on public.inventory;
create policy "inventory_own_rows" on public.inventory
for all to authenticated
using (auth.uid() = player_id)
with check (auth.uid() = player_id);

drop policy if exists "market_read" on public.market;
create policy "market_read" on public.market
for select to authenticated
using (true);

drop policy if exists "market_write" on public.market;
create policy "market_write" on public.market
for insert to authenticated
with check (true);

drop policy if exists "market_update" on public.market;
create policy "market_update" on public.market
for update to authenticated
using (true)
with check (true);


create or replace function public.touch_market_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

drop trigger if exists market_updated_at on public.market;
create trigger market_updated_at
before update on public.market
for each row execute function public.touch_market_updated_at();

create or replace function public.add_inventory_item(
    p_player_id uuid,
    p_item_id text,
    p_quantity integer
)
returns void
language plpgsql
security definer
as $$
begin
    if p_quantity <= 0 then
        raise exception 'quantity must be > 0';
    end if;

    insert into public.inventory (player_id, item_id, quantity)
    values (p_player_id, p_item_id, p_quantity)
    on conflict (player_id, item_id)
    do update set quantity = public.inventory.quantity + excluded.quantity;
end;
$$;

create or replace function public.update_player_gold(
    p_player_id uuid,
    p_amount integer
)
returns void
language plpgsql
security definer
as $$
begin
if p_amount < 0 then
    raise exception 'gold must be >= 0';
end if;

update public.players
set gold = p_amount
where id = p_player_id;
end;
$$;

create or replace function public.replace_inventory(
    p_player_id uuid,
    p_items jsonb
)
returns void
language plpgsql
security definer
as $$
declare
    row_data jsonb;
    v_item_id text;
    v_quantity integer;
begin
    delete from public.inventory where player_id = p_player_id;

    for row_data in select * from jsonb_array_elements(p_items)
    loop
    v_item_id := row_data->>'item_id';
    v_quantity := (row_data->>'quantity')::integer;

    if v_item_id is null or btrim(v_item_id) = '' then
        raise exception 'item_id is required';
    end if;

    if v_quantity is null or v_quantity < 0 then
        raise exception 'quantity must be >= 0';
    end if;

    if v_quantity > 0 then
        insert into public.inventory (player_id, item_id, quantity)
        values (p_player_id, v_item_id, v_quantity)
        on conflict (player_id, item_id)
        do update set quantity = excluded.quantity;
    end if;
end loop;
end;
$$;
