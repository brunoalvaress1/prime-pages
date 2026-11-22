-- Prime Page: contas, projetos montados no construtor, pedidos de orçamento e admin.
-- Rode tudo no SQL Editor do Supabase.

-- ---------- ADMIN ----------
create table if not exists public.admins (
  email text primary key
);
insert into public.admins (email) values ('primepagesleme@gmail.com') on conflict do nothing;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where email = (auth.jwt() ->> 'email'));
$$;

-- ---------- PERFIS ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  name text,
  phone text,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name, phone)
  values (new.id, new.email, new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'phone')
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
drop policy if exists "perfil: dono ou admin le" on public.profiles;
create policy "perfil: dono ou admin le" on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());
drop policy if exists "perfil: dono grava" on public.profiles;
create policy "perfil: dono grava" on public.profiles for insert to authenticated with check (id = auth.uid());
drop policy if exists "perfil: dono atualiza" on public.profiles;
create policy "perfil: dono atualiza" on public.profiles for update to authenticated using (id = auth.uid());

-- ---------- PROJETOS ----------
create table if not exists public.projects (
  id uuid primary key,
  user_id uuid not null references auth.users on delete cascade,
  name text,
  kind text not null check (kind in ('site', 'system')),
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.projects enable row level security;
drop policy if exists "projeto: dono ou admin le" on public.projects;
create policy "projeto: dono ou admin le" on public.projects for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists "projeto: dono cria" on public.projects;
create policy "projeto: dono cria" on public.projects for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "projeto: dono ou admin edita" on public.projects;
create policy "projeto: dono ou admin edita" on public.projects for update to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists "projeto: dono apaga" on public.projects;
create policy "projeto: dono apaga" on public.projects for delete to authenticated using (user_id = auth.uid());

-- ---------- PEDIDOS DE ORÇAMENTO ----------
create table if not exists public.quote_requests (
  id uuid primary key,
  created_at timestamptz not null default now(),
  user_id uuid references auth.users on delete set null,
  project_id uuid references public.projects on delete set null,
  kind text not null check (kind in ('site', 'system')),
  name text,
  origin text,
  reference_url text,
  prompt text,
  contact_name text,
  contact_phone text,
  contact_email text,
  business text,
  flags text[] not null default '{}',
  complexity text,
  message text,
  admin_note text,
  status text not null default 'novo' check (status in ('novo', 'em_analise', 'orcado', 'fechado', 'perdido'))
);
-- Para quem já rodou a versão anterior do schema:
alter table public.quote_requests add column if not exists user_id uuid references auth.users on delete set null;
alter table public.quote_requests add column if not exists project_id uuid references public.projects on delete set null;
alter table public.quote_requests add column if not exists contact_email text;
alter table public.quote_requests add column if not exists admin_note text;
alter table public.quote_requests drop column if exists model;

alter table public.quote_requests enable row level security;
drop policy if exists "anon insere pedido" on public.quote_requests;
drop policy if exists "equipe le pedidos" on public.quote_requests;
drop policy if exists "equipe atualiza pedidos" on public.quote_requests;
drop policy if exists "pedido: dono cria" on public.quote_requests;
create policy "pedido: dono cria" on public.quote_requests for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "pedido: dono ou admin le" on public.quote_requests;
create policy "pedido: dono ou admin le" on public.quote_requests for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists "pedido: admin atualiza" on public.quote_requests;
create policy "pedido: admin atualiza" on public.quote_requests for update to authenticated using (public.is_admin());

-- ---------- DEPOIS DE RODAR ----------
-- 1) Authentication > Users > "Add user": crie primepagesleme@gmail.com com a senha do admin
--    (marque "Auto Confirm User"). A senha fica só no Supabase, nunca no código do site.
-- 2) Authentication > Email Templates > "Reset Password": inclua o código {{ .Token }} no texto,
--    por exemplo: "Seu código para redefinir a senha é {{ .Token }}".
