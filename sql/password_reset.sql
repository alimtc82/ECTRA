-- ECTRA — استعادة كلمة السر بالبريد الإلكتروني (idempotent — مُطبّق Live بالفعل)
-- project: quybqrlxhrnthspqrgpa

-- 1) عمود الإيميل + فهرس فريد (case-insensitive، يتجاهل NULL)
alter table public.ectra_users add column if not exists email text;
create unique index if not exists ectra_users_email_uniq
  on public.ectra_users (lower(email)) where email is not null;

-- إيميل الأدمن
update public.ectra_users set email='mtc2tech@gmail.com' where username='admin' and email is null;

-- 2) جدول طلبات الاستعادة (هاش التوكن فقط)
create table if not exists public.ectra_password_resets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.ectra_users(id) on delete cascade,
  token_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists ectra_password_resets_hash_idx on public.ectra_password_resets(token_hash);
alter table public.ectra_password_resets enable row level security;

-- 3) إنشاء توكن (service_role فقط — يُستدعى من Edge Function)
create or replace function public.ectra_create_reset_token(p_email text)
returns text language plpgsql security definer set search_path to 'public','extensions' as $$
declare v_uid uuid; v_raw text;
begin
  select id into v_uid from public.ectra_users
   where lower(email)=lower(btrim(p_email)) and active=true limit 1;
  if v_uid is null then return null; end if;
  delete from public.ectra_password_resets where user_id=v_uid and used_at is null;
  v_raw := encode(extensions.gen_random_bytes(24),'hex');
  insert into public.ectra_password_resets(user_id, token_hash, expires_at)
  values (v_uid, encode(extensions.digest(v_raw,'sha256'),'hex'), now() + interval '1 hour');
  return v_raw;
end; $$;
revoke execute on function public.ectra_create_reset_token(text) from public, anon, authenticated;
grant execute on function public.ectra_create_reset_token(text) to service_role;

-- 4) تنفيذ إعادة التعيين بالتوكن (متاح للعامة — التوكن هو السر)
create or replace function public.ectra_reset_password(p_token text, p_new_password text)
returns text language plpgsql security definer set search_path to 'public','extensions' as $$
declare v_uid uuid; v_hash text;
begin
  if p_new_password is null or length(p_new_password) < 6 then
    raise exception 'كلمة السر يجب أن تكون 6 أحرف على الأقل'; end if;
  v_hash := encode(extensions.digest(p_token,'sha256'),'hex');
  select user_id into v_uid from public.ectra_password_resets
   where token_hash=v_hash and used_at is null and expires_at > now()
   order by created_at desc limit 1;
  if v_uid is null then raise exception 'الرابط غير صالح أو انتهت صلاحيته'; end if;
  insert into public.ectra_auth(user_id, password_hash)
  values (v_uid, extensions.crypt(p_new_password, extensions.gen_salt('bf')))
  on conflict (user_id) do update set password_hash=excluded.password_hash, updated_at=now();
  update public.ectra_password_resets set used_at=now() where token_hash=v_hash;
  delete from public.ectra_sessions where user_id=v_uid;
  return 'ok';
end; $$;
grant execute on function public.ectra_reset_password(text,text) to anon, authenticated, service_role;

-- 5) save_user + الإيميل
drop function if exists public.ectra_admin_save_user(text,uuid,text,text,uuid,boolean,text);
create function public.ectra_admin_save_user(
  p_token text, p_id uuid, p_name text, p_username text, p_phone text,
  p_role_id uuid, p_active boolean, p_password text, p_email text default null)
returns uuid language plpgsql security definer set search_path to 'public','extensions' as $$
declare v_id uuid;
begin
  if not public.ectra_can(p_token,'users','manageUsers') then raise exception 'unauthorized'; end if;
  if p_id is null then
    insert into public.ectra_users(name, username, phone, role_id, active, email)
    values (p_name, p_username, p_phone, p_role_id, p_active, nullif(btrim(p_email),''))
    returning id into v_id;
  else
    update public.ectra_users set name=p_name, username=p_username, phone=p_phone,
           role_id=p_role_id, active=p_active, email=nullif(btrim(p_email),'') where id=p_id;
    v_id := p_id;
  end if;
  if p_password is not null and length(p_password) > 0 then
    insert into public.ectra_auth(user_id, password_hash)
    values (v_id, extensions.crypt(p_password, extensions.gen_salt('bf')))
    on conflict (user_id) do update set password_hash=excluded.password_hash, updated_at=now();
  end if;
  return v_id;
end; $$;

-- 6) list_users + الإيميل
drop function if exists public.ectra_admin_list_users(text);
create function public.ectra_admin_list_users(p_token text)
returns table(id uuid, name text, username text, phone text, email text,
              role_id uuid, active boolean, created_at timestamptz)
language plpgsql security definer set search_path to 'public' as $$
begin
  if not public.ectra_can(p_token,'users','manageUsers') then raise exception 'unauthorized'; end if;
  return query select u.id, u.name, u.username, u.phone, u.email, u.role_id, u.active, u.created_at
               from public.ectra_users u order by u.created_at desc;
end; $$;
