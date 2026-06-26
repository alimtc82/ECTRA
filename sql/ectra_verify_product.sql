-- ============================================================
--  ECTRA — تأمين استعلام المنتج للصفحة العامة
--  المشروع: quybqrlxhrnthspqrgpa
--  نفّذ هذا الملف في Supabase → SQL Editor
-- ============================================================

-- 1) دالة التحقق الآمنة (SECURITY DEFINER) — تتجاوز RLS وترجّع
--    الحقول غير الحساسة فقط (بدون اسم العميل ولا رقم الواتساب).
create or replace function public.ectra_verify_product(p_term text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_term     text := btrim(coalesce(p_term, ''));
  v_prod     ectra_products%rowtype;
  v_war      ectra_warranties%rowtype;
  v_has_prod boolean := false;
  v_has_war  boolean := false;
  v_status   text;
  v_today    date := current_date;
begin
  if v_term = '' then
    return jsonb_build_object('status', 'not_in_db');
  end if;

  -- مرحلة 1: البحث في مخزون MTC GROUP بالسيريال أو الكود
  select * into v_prod
  from ectra_products
  where serial = v_term or code = v_term
  limit 1;
  v_has_prod := found;

  -- مرحلة 1ب: لو مش موجود في المخزون، جرّب رقم/سيريال شهادة مباشرة
  if not v_has_prod then
    select * into v_war
    from ectra_warranties
    where serial = v_term or cert_no = v_term
    limit 1;
    v_has_war := found;

    if not v_has_war then
      return jsonb_build_object('status', 'not_in_db');
    end if;

    v_status := case
      when v_war.end_date is not null and v_war.end_date >= v_today
        then 'warranty_active' else 'warranty_expired' end;

    return jsonb_build_object(
      'status', v_status,
      'product', null,
      'warranty', jsonb_build_object(
        'cert_no', v_war.cert_no, 'model', v_war.model, 'serial', v_war.serial,
        'start_date', v_war.start_date, 'end_date', v_war.end_date
      )
    );
  end if;

  -- مرحلة 2: المنتج موجود — هل صادر له شهادة ضمان؟
  select * into v_war
  from ectra_warranties
  where (v_prod.serial is not null and serial = v_prod.serial)
     or cert_no = v_term
  limit 1;
  v_has_war := found;

  if not v_has_war then
    return jsonb_build_object(
      'status', 'no_warranty',
      'product', jsonb_build_object(
        'model', v_prod.model, 'serial', v_prod.serial, 'section', v_prod.section
      )
    );
  end if;

  v_status := case
    when v_war.end_date is not null and v_war.end_date >= v_today
      then 'warranty_active' else 'warranty_expired' end;

  return jsonb_build_object(
    'status', v_status,
    'product', jsonb_build_object(
      'model', v_prod.model, 'serial', v_prod.serial, 'section', v_prod.section
    ),
    'warranty', jsonb_build_object(
      'cert_no', v_war.cert_no, 'model', v_war.model, 'serial', v_war.serial,
      'start_date', v_war.start_date, 'end_date', v_war.end_date
    )
  );
end;
$$;

grant execute on function public.ectra_verify_product(text) to anon, authenticated;


-- 2) قفل القراءة المباشرة على جدول الضمانات (فيه بيانات العملاء).
--    الصفحة العامة لم تعد تقرأه مباشرة — بتمرّ على الدالة أعلاه فقط.
--    الدالة SECURITY DEFINER فبتفضل شغّالة بعد القفل.
alter table public.ectra_warranties enable row level security;

revoke select on public.ectra_warranties from anon;
-- لو عايز تمنع المستخدم المسجّل بـ Supabase Auth كمان (الأدمن عندك بيستخدم توكن مخصّص، مش جلسة Auth):
revoke select on public.ectra_warranties from authenticated;

-- (اختياري للاحتياط) امسح أي policy قديمة بتسمح بقراءة anon — عدّل الاسم لو مختلف:
-- drop policy if exists "anon read warranties" on public.ectra_warranties;


-- 3) اختبار سريع (نفّذه وشوف النتيجة):
-- select public.ectra_verify_product('ضع_هنا_سيريال_موجود');
-- select public.ectra_verify_product('رقم_غير_موجود');
