-- Prime Page: pedidos de orçamento vindos do construtor.
-- Rode no SQL Editor do Supabase.

create table if not exists public.quote_requests (
  id uuid primary key,
  created_at timestamptz not null default now(),
  kind text not null check (kind in ('site', 'system')),
  name text,
  origin text,
  reference_url text,
  prompt text,
  contact_name text,
  contact_phone text,
  business text,
  flags text[] not null default '{}',
  complexity text,
  model jsonb not null,
  message text,
  status text not null default 'novo' check (status in ('novo', 'em_analise', 'orcado', 'fechado', 'perdido'))
);

alter table public.quote_requests enable row level security;

-- Visitante anônimo só insere.
create policy "anon insere pedido" on public.quote_requests
  for insert to anon with check (true);

-- Equipe logada lê e atualiza.
create policy "equipe le pedidos" on public.quote_requests
  for select to authenticated using (true);
create policy "equipe atualiza pedidos" on public.quote_requests
  for update to authenticated using (true);
