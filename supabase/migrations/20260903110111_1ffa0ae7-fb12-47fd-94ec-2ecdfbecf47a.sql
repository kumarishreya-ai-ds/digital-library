create type public.app_role as enum ('admin');
create type public.entry_type as enum ('half_day','full_day');
create type public.pay_status as enum ('pending','verified','rejected');
create type public.entry_status as enum ('pending','confirmed','rejected');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "own roles readable" on public.user_roles for select to authenticated using (user_id = auth.uid());

create table public.students (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  mobile text not null unique,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.students to authenticated;
grant all on public.students to service_role;
alter table public.students enable row level security;
create policy "admins manage students" on public.students for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create sequence public.entry_code_seq;

create table public.entries (
  id uuid primary key default gen_random_uuid(),
  entry_code text,
  student_id uuid not null references public.students(id) on delete cascade,
  entry_type public.entry_type not null,
  entry_date date not null,
  entry_time time not null,
  amount numeric(10,2),
  status public.entry_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.entries to authenticated;
grant all on public.entries to service_role;
alter table public.entries enable row level security;
create policy "admins manage entries" on public.entries for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create unique index entries_code_unique on public.entries (entry_code);
create unique index entries_no_duplicate_day on public.entries (student_id, entry_date, entry_type) where status <> 'rejected';

create or replace function public.set_entry_code()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.entry_code is null or new.entry_code = '' then
    new.entry_code := 'SGL-' || to_char(new.entry_date,'YYYY') || '-' || lpad(nextval('public.entry_code_seq')::text, 5, '0');
  end if;
  return new;
end; $$;
create trigger entries_set_code before insert on public.entries for each row execute function public.set_entry_code();

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;
create trigger entries_touch before update on public.entries for each row execute function public.touch_updated_at();

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.entries(id) on delete cascade,
  amount numeric(10,2),
  utr text unique,
  screenshot_path text,
  status public.pay_status not null default 'pending',
  method text not null default 'upi',
  verified_by uuid,
  verified_at timestamptz,
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.payments to authenticated;
grant all on public.payments to service_role;
alter table public.payments enable row level security;
create policy "admins manage payments" on public.payments for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger payments_touch before update on public.payments for each row execute function public.touch_updated_at();

create table public.admin_settings (
  id boolean primary key default true,
  upi_id text,
  receiver_name text,
  half_day_price numeric(10,2),
  full_day_price numeric(10,2),
  qr_image_path text,
  address text,
  timings text,
  owner_name text,
  contact_phone text default '9852688787',
  contact_email text,
  updated_at timestamptz not null default now(),
  constraint admin_settings_singleton check (id)
);
grant select, insert, update on public.admin_settings to authenticated;
grant all on public.admin_settings to service_role;
alter table public.admin_settings enable row level security;
create policy "admins read settings" on public.admin_settings for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admins write settings" on public.admin_settings for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger settings_touch before update on public.admin_settings for each row execute function public.touch_updated_at();

insert into public.admin_settings (id) values (true);

create policy "admins read screenshots" on storage.objects for select to authenticated using (bucket_id = 'payment-screenshots' and public.has_role(auth.uid(),'admin'));
create policy "admins read library assets" on storage.objects for select to authenticated using (bucket_id = 'library-assets' and public.has_role(auth.uid(),'admin'));
create policy "admins write library assets" on storage.objects for insert to authenticated with check (bucket_id = 'library-assets' and public.has_role(auth.uid(),'admin'));
create policy "admins update library assets" on storage.objects for update to authenticated using (bucket_id = 'library-assets' and public.has_role(auth.uid(),'admin'));