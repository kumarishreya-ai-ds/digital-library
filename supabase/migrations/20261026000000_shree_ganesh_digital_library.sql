-- Migration: Shree Ganesh Digital Library Production Schema
-- 20 physical seats, student admission, bookings, memberships, attendance, audit logs

-- Enums
do $$ begin
  create type public.slot_type as enum ('morning_half', 'second_half', 'full_time');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.admission_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.membership_status as enum ('active', 'expired', 'pending', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.attendance_status as enum ('present', 'incomplete', 'absent');
exception when duplicate_object then null; end $$;

-- Sequence for unique student IDs (SGDL-YYYY-XXXXX)
create sequence if not exists public.student_code_seq start with 1;

-- 1. Physical Seats (20 Seats)
create table if not exists public.seats (
  id uuid primary key default gen_random_uuid(),
  seat_number text not null unique,
  label text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

grant select on public.seats to anon, authenticated;
grant all on public.seats to service_role;
alter table public.seats enable row level security;
create policy "seats viewable by all" on public.seats for select using (true);
create policy "admins manage seats" on public.seats for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- Seed the 20 seats if empty
insert into public.seats (seat_number, label)
select
  'Seat ' || lpad(i::text, 2, '0'),
  'Seat ' || lpad(i::text, 2, '0')
from generate_series(1, 20) as s(i)
on conflict (seat_number) do nothing;

-- 2. Extend Students table
alter table public.students add column if not exists student_id_code text unique;
alter table public.students add column if not exists email text;
alter table public.students add column if not exists address text;
alter table public.students add column if not exists photo_path text;
alter table public.students add column if not exists signature_path text;
alter table public.students add column if not exists id_proof_path text;
alter table public.students add column if not exists admission_status public.admission_status not null default 'pending';
alter table public.students add column if not exists selected_plan public.slot_type;
alter table public.students add column if not exists assigned_seat_id uuid references public.seats(id);
alter table public.students add column if not exists rejection_reason text;
alter table public.students add column if not exists updated_at timestamptz not null default now();

-- 3. Seat Bookings & Reservations
create table if not exists public.seat_bookings (
  id uuid primary key default gen_random_uuid(),
  seat_id uuid not null references public.seats(id) on delete cascade,
  student_id uuid references public.students(id) on delete set null,
  booking_date date not null,
  slot public.slot_type not null,
  status text not null default 'reserved', -- 'reserved', 'confirmed', 'cancelled', 'expired'
  reserved_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update on public.seat_bookings to anon, authenticated;
grant all on public.seat_bookings to service_role;
alter table public.seat_bookings enable row level security;
create policy "bookings viewable by all" on public.seat_bookings for select using (true);
create policy "admins manage bookings" on public.seat_bookings for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- 4. Memberships
create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  seat_id uuid references public.seats(id) on delete set null,
  plan_type public.slot_type not null,
  start_date date not null,
  expiry_date date not null,
  status public.membership_status not null default 'pending',
  monthly_fee numeric(10,2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select on public.memberships to anon, authenticated;
grant all on public.memberships to service_role;
alter table public.memberships enable row level security;
create policy "students view own memberships" on public.memberships for select using (true);
create policy "admins manage memberships" on public.memberships for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- 5. Attendance
create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  attendance_date date not null default current_date,
  check_in_at timestamptz not null default now(),
  check_out_at timestamptz,
  status public.attendance_status not null default 'present',
  is_manual_correction boolean not null default false,
  correction_reason text,
  corrected_by uuid,
  created_at timestamptz not null default now()
);

grant select, insert, update on public.attendance to anon, authenticated;
grant all on public.attendance to service_role;
alter table public.attendance enable row level security;
create policy "attendance viewable" on public.attendance for select using (true);
create policy "admins manage attendance" on public.attendance for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- 6. Renewal Requests
create table if not exists public.renewal_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  membership_id uuid not null references public.memberships(id) on delete cascade,
  requested_plan public.slot_type not null,
  utr text,
  screenshot_path text,
  status text not null default 'pending', -- 'pending', 'approved', 'rejected'
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update on public.renewal_requests to anon, authenticated;
grant all on public.renewal_requests to service_role;
alter table public.renewal_requests enable row level security;
create policy "renewals viewable" on public.renewal_requests for select using (true);
create policy "admins manage renewals" on public.renewal_requests for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- 7. Admin Audit Logs
create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid,
  admin_email text,
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb,
  created_at timestamptz not null default now()
);

grant select on public.admin_audit_logs to authenticated;
grant all on public.admin_audit_logs to service_role;
alter table public.admin_audit_logs enable row level security;
create policy "admins read audit logs" on public.admin_audit_logs for select to authenticated using (public.has_role(auth.uid(), 'admin'));

-- 8. Storage bucket policy for student documents
create policy "admins read student documents" on storage.objects for select to authenticated using (bucket_id = 'student-documents' and public.has_role(auth.uid(), 'admin'));
create policy "authenticated insert student documents" on storage.objects for insert to anon, authenticated with check (bucket_id = 'student-documents');

-- 9. Update default admin settings
update public.admin_settings
set
  upi_id = '7061038932-p36a@ibl',
  receiver_name = 'Shree Ganesh Digital Library',
  half_day_price = 400.00,
  full_day_price = 700.00,
  address = 'Khudra, Pachlakhi, Siwan, Bihar, India',
  timings = 'Morning: 7:00 AM - 12:00 PM | Second Half: 12:00 PM - 5:00 PM | Full-Time: 7:00 AM - 5:00 PM',
  owner_name = 'Kumari Shreya',
  contact_phone = '9852688787',
  contact_email = 'kumarishreya70610@gmail.com'
where id = true;
