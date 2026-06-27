-- ECTRA — مبيعات لنقطة بيع: نقاط البيع + أوامر تسليم البضاعة (idempotent — مُطبّق Live)
-- project: quybqrlxhrnthspqrgpa

-- ===== الأدوار والصلاحيات =====
insert into public.ectra_roles(name, permissions)
select 'نقطة بيع', '{}'::jsonb
where not exists (select 1 from public.ectra_roles where name='نقطة بيع');

update public.ectra_roles
set permissions = coalesce(permissions,'{}'::jsonb)
  || '{"pos":{"open":true,"buttons":{"managePos":true,"delivery":true}}}'::jsonb
where name='مدير النظام';

-- ===== الجداول =====
create table if not exists public.ectra_pos (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  manager_name text,
  phone text,
  email text,
  user_id uuid references public.ectra_users(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.ectra_pos enable row level security;

create table if not exists public.ectra_delivery_orders (
  id uuid primary key default gen_random_uuid(),
  pos_id uuid not null references public.ectra_pos(id) on delete restrict,
  note text,
  created_by uuid,
  created_at timestamptz not null default now()
);
alter table public.ectra_delivery_orders enable row level security;

create table if not exists public.ectra_delivery_serials (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.ectra_delivery_orders(id) on delete cascade,
  item_id uuid not null references public.ectra_items(id) on delete restrict,
  unit_id uuid not null references public.ectra_units(id) on delete restrict,
  serial text not null,
  created_at timestamptz not null default now(),
  unique(unit_id)
);
alter table public.ectra_delivery_serials enable row level security;
create index if not exists ectra_delivery_serials_order_idx on public.ectra_delivery_serials(order_id);

-- ===== الدوال (RPCs) =====
-- ملاحظة: التعريفات الكاملة منشورة Live. القائمة:
--   ectra_pos_list / ectra_pos_save / ectra_pos_delete
--   ectra_delivery_item_options / ectra_delivery_unit_search
--   ectra_delivery_list / ectra_delivery_get / ectra_delivery_save / ectra_delivery_delete
-- لإعادة الإنشاء راجع نسخة الـ migration "pos_and_delivery_orders".

-- ===== (4023) منع إصدار ضمان لسيريال تم تسليمه لنقطة بيع =====
-- أُضيف داخل ectra_warranty_issue تحقّق:
--   if exists(select 1 from public.ectra_units u
--             join public.ectra_delivery_serials ds on ds.unit_id=u.id
--             where upper(btrim(u.serial))=upper(btrim(p_serial)))
--     then raise exception 'serial_delivered_to_pos'; end if;

-- ===== (4024) ربط الضمان بمُصدِره + تخصيص السيريال المُسلَّم لنقطة بيعه =====
-- alter table public.ectra_warranties add column if not exists created_by uuid;
-- ectra_warranty_issue: السيريال المُسلَّم لنقطة بيع → فقط مستخدم تلك النقطة يصدر له ضمان
--   (وإلا serial_belongs_other_pos)؛ ومستخدم نقطة بيع لا يصدر لسيريال غير مُسلَّم له (serial_not_yours).
-- ectra_warranty_page / ectra_warranty_list: مستخدم نقطة البيع يرى ضماناته فقط (created_by = uid).

-- ===== (4025) اسم نقطة البيع على الشهادة وفي قائمة الضمانات =====
-- ectra_login: يرجّع pos_name (اسم نقطة البيع للمستخدم إن كان نقطة بيع).
-- ectra_warranty_page: يرجّع sold_by (اسم نقطة البيع المُصدِرة لكل ضمان) — للأدمن لرؤية الكل مع الاسم.
-- ملاحظة: الضمانات الصادرة قبل عمود created_by تظهر sold_by = null.

-- ===== (4027) تسجيل الدخول غير حسّاس لحالة الأحرف في اسم المستخدم =====
-- ectra_login: where lower(u.username)=lower(btrim(p_username))  (كان حسّاسًا للحالة، فـ Amgad1 ≠ amgad1)

-- ===== (4028) كتالوج نقطة البيع مفلتر + حذف ضمان مقصور على المُصدِر =====
-- ectra_item_list / ectra_unit_list / ectra_section_list: مستخدم نقطة البيع يرى الأصناف/السريالات/الأقسام المُسلَّمة له فقط (الأدمن يرى الكل).
-- ectra_warranty_delete: نقطة البيع تحذف ما أصدرته فقط (created_by = uid)، المركز يحذف أي شيء — والصلاحية warranties.delete لازمة.
