-- Witega 產品資料 — Supabase schema
-- 在 Supabase Dashboard → SQL Editor 執行一次

-- 1. products 表（欄位對應 admin 的 productData）
create table if not exists public.products (
  id              text primary key,          -- 產品 ID（如 R1），手動指定、不自增
  name            text not null,
  category        text not null,             -- 分類 id（tools / injection / ...）
  description     text,
  meta_description text,
  keywords        text,
  video_url       text,
  images          jsonb not null default '[]'::jsonb,   -- 圖片路徑陣列
  specs           jsonb not null default '[]'::jsonb,   -- [{label, value}]
  downloads       jsonb not null default '[]'::jsonb,   -- [{label, url, filename}]
  sort_order      int   not null default 0,             -- 列表排序
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists products_category_idx on public.products (category);

-- updated_at 自動更新
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- 2. RLS：anon 只能讀，登入者可寫/刪
alter table public.products enable row level security;

drop policy if exists "public read products" on public.products;
create policy "public read products"
  on public.products for select
  to anon, authenticated
  using (true);

drop policy if exists "authed write products" on public.products;
create policy "authed write products"
  on public.products for all
  to authenticated
  using (true)
  with check (true);

-- 3. Storage bucket：在 Dashboard → Storage 建立名為 product-images 的 bucket，
--    設為 Public。圖片路徑沿用 <id>/<id>-N.jpg。
--    Storage 的 RLS policy 用下列 SQL（Storage 也走 storage.objects 表）：

drop policy if exists "public read product images" on storage.objects;
create policy "public read product images"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'product-images');

drop policy if exists "authed write product images" on storage.objects;
create policy "authed write product images"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'product-images')
  with check (bucket_id = 'product-images');
