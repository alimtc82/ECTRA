-- ============================================================
--  ECTRA — تعديل / حذف شهادات الضمان + الصلاحيات
--  شغّل هذا الملف مرة واحدة على Supabase (مشروع quybqrlxhrnthspqrgpa)
--  (SQL Editor → الصق المحتوى → Run). بعدها اعمل Logout/Login.
-- ============================================================

-- (1) تعديل شهادة ضمان  — صلاحية warranties/edit
create or replace function public.ectra_warranty_update(
  p_token text, p_cert_no text,
  p_customer_name text, p_whatsapp text, p_model text,
  p_serial text, p_purchase_date date, p_start_date date, p_end_date date
) returns public.ectra_warranties
language plpgsql security definer set search_path = public
as $$
declare v_row public.ectra_warranties;
begin
  if not public.ectra_can(p_token, 'warranties', 'edit') then
    raise exception 'unauthorized';
  end if;
  if p_customer_name is null or btrim(p_customer_name) = '' then
    raise exception 'name_required';
  end if;

  -- نفس قاعدة الإصدار: السيريال (لو موجود) لازم يكون مسجّل في ectra_units
  if p_serial is not null and btrim(p_serial) <> '' then
    if not exists (
      select 1 from public.ectra_units u
      where upper(btrim(u.serial)) = upper(btrim(p_serial))
    ) then
      raise exception 'serial_not_registered';
    end if;
  end if;

  update public.ectra_warranties
     set customer_name = btrim(p_customer_name),
         whatsapp      = nullif(btrim(coalesce(p_whatsapp, '')), ''),
         model         = coalesce(p_model, model),
         serial        = coalesce(nullif(btrim(coalesce(p_serial, '')), ''), serial),
         purchase_date = coalesce(p_purchase_date, purchase_date),
         start_date    = coalesce(p_start_date, start_date),
         end_date      = coalesce(p_end_date, end_date)
   where cert_no = p_cert_no
   returning * into v_row;

  if not found then
    raise exception 'not_found';
  end if;
  return v_row;
end; $$;
grant execute on function public.ectra_warranty_update(text, text, text, text, text, text, date, date, date) to anon, authenticated;

-- (2) حذف شهادة ضمان — صلاحية warranties/delete
create or replace function public.ectra_warranty_delete(p_token text, p_cert_no text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.ectra_can(p_token, 'warranties', 'delete') then
    raise exception 'unauthorized';
  end if;
  delete from public.ectra_warranties where cert_no = p_cert_no;
end; $$;
grant execute on function public.ectra_warranty_delete(text, text) to anon, authenticated;

-- (3) منح «تعديل» و«حذف» الضمانات للأدوار التي تملك «عرض الضمانات» بالفعل
--     (المدير يقدر يفعّلها/يلغيها بعد كده من شاشة إدارة الصلاحيات لكل دور)
update public.ectra_roles
set permissions = jsonb_set(
      jsonb_set(coalesce(permissions, '{}'::jsonb),
        '{warranties,buttons,edit}',   'true'::jsonb, true),
        '{warranties,buttons,delete}', 'true'::jsonb, true)
where coalesce(permissions->'warranties'->>'open', 'false') = 'true';

-- ملاحظة: لو أسماء أعمدة جدول ectra_warranties مختلفة عندك
-- (مثلاً purchase_date)، عدّلها في دالة update أعلاه بما يطابق مشروعك.

-- ============================================================
-- (4) منع تكرار شهادة الضمان لنفس السيريال
--     لا يمكن إصدار أكثر من شهادة ضمان للمنتج (السيريال) نفسه.
--     يعمل عند الإصدار (insert) وعند تغيير السيريال (update).
-- ملاحظة: هذا يمنع التكرارات الجديدة فقط؛ أي تكرارات موجودة مسبقاً
--         تظل كما هي — احذف الزائد منها يدوياً من «قائمة الضمانات».
-- ============================================================
create or replace function public.ectra_warranties_no_dup_serial()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare v_cert text;
begin
  if new.serial is null or btrim(new.serial) = '' then
    return new;
  end if;
  select w.cert_no into v_cert
    from public.ectra_warranties w
   where upper(btrim(w.serial)) = upper(btrim(new.serial))
     and w.cert_no <> new.cert_no
   limit 1;
  if v_cert is not null then
    raise exception 'serial_has_warranty:%', v_cert;
  end if;
  return new;
end; $$;

drop trigger if exists ectra_warranties_no_dup on public.ectra_warranties;
create trigger ectra_warranties_no_dup
  before insert or update on public.ectra_warranties
  for each row execute function public.ectra_warranties_no_dup_serial();

-- (اختياري) عرض السيريالات اللي ليها أكثر من شهادة (لتنظيف القديم):
-- select upper(btrim(serial)) as serial, count(*), string_agg(cert_no, ', ') as certs
--   from public.ectra_warranties
--  where serial is not null and btrim(serial) <> ''
--  group by upper(btrim(serial)) having count(*) > 1;

-- ============================================================
-- (5) ترقيم حقيقي + بحث لقائمة الضمانات (من القاعدة)
--     تُرجع صفحة واحدة (limit/offset) + عمود total لحساب الصفحات.
--     البحث يشمل: رقم الشهادة / العميل / السيريال / الموديل / الواتساب.
-- ============================================================
create or replace function public.ectra_warranty_page(
  p_token text, p_limit int default 20, p_offset int default 0, p_search text default null
) returns table(
  cert_no text, customer_name text, whatsapp text, model text, serial text,
  purchase_date date, start_date date, end_date date, total bigint
)
language plpgsql security definer set search_path = public
as $$
begin
  if public.ectra_uid(p_token) is null then
    raise exception 'unauthorized';
  end if;
  return query
  with f as (
    select w.* from public.ectra_warranties w
    where p_search is null or btrim(p_search) = '' or (
      w.cert_no                    ilike '%' || p_search || '%' or
      coalesce(w.customer_name,'') ilike '%' || p_search || '%' or
      coalesce(w.serial,'')        ilike '%' || p_search || '%' or
      coalesce(w.model,'')         ilike '%' || p_search || '%' or
      coalesce(w.whatsapp,'')      ilike '%' || p_search || '%'
    )
  )
  select f.cert_no, f.customer_name, f.whatsapp, f.model, f.serial,
         f.purchase_date, f.start_date, f.end_date,
         count(*) over() as total
  from f
  order by f.start_date desc nulls last, f.cert_no desc
  limit greatest(p_limit, 1) offset greatest(p_offset, 0);
end; $$;
grant execute on function public.ectra_warranty_page(text, int, int, text) to anon, authenticated;
