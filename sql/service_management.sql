-- ============================================================
--  ECTRA — شاشة إدارة الصيانة (تم تطبيقها على المشروع quybqrlxhrnthspqrgpa)
--  محفوظة هنا للأرشيف فقط.
-- ============================================================

alter table public.ectra_service_requests add column if not exists notes text;

create or replace function public.ectra_service_list(p_token text)
returns setof public.ectra_service_requests
language plpgsql security definer set search_path = public
as $$
begin
  if not public.ectra_can(p_token, 'services', 'view') then raise exception 'unauthorized'; end if;
  return query select * from public.ectra_service_requests order by created_at desc;
end; $$;
grant execute on function public.ectra_service_list(text) to anon, authenticated;

create or replace function public.ectra_service_update(p_token text, p_id uuid, p_stage smallint, p_notes text)
returns public.ectra_service_requests
language plpgsql security definer set search_path = public
as $$
declare v_row public.ectra_service_requests;
begin
  if not public.ectra_can(p_token, 'services', 'update') then raise exception 'unauthorized'; end if;
  update public.ectra_service_requests
     set stage = coalesce(p_stage, stage), notes = p_notes, updated_at = now()
   where id = p_id returning * into v_row;
  return v_row;
end; $$;
grant execute on function public.ectra_service_update(text, uuid, smallint, text) to anon, authenticated;

create or replace function public.ectra_service_delete(p_token text, p_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.ectra_can(p_token, 'services', 'delete') then raise exception 'unauthorized'; end if;
  delete from public.ectra_service_requests where id = p_id;
end; $$;
grant execute on function public.ectra_service_delete(text, uuid) to anon, authenticated;

-- منح صلاحية services لأدوار الاستلام/الإدارة
update public.ectra_roles
set permissions = jsonb_set(coalesce(permissions,'{}'::jsonb), '{services}',
      jsonb_build_object('open', true, 'buttons',
        jsonb_build_object('view', true, 'update', true, 'delete', false)), true)
where coalesce(permissions->'intake'->>'open','false') = 'true'
   or coalesce(permissions->'users'->>'open','false') = 'true';
