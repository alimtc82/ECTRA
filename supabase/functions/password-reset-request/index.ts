// ECTRA — طلب استعادة كلمة السر عبر البريد (Resend)
// أسرار مطلوبة في إعدادات الـ Edge Functions:
//   RESEND_API_KEY  (إجباري لإرسال الإيميل فعليًا)
//   MAIL_FROM       (اختياري — افتراضي: ECTRA <onboarding@resend.dev>)
//   APP_URL         (اختياري — افتراضي: https://ectra-app.vercel.app)
// SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY بيتحقنوا تلقائيًا.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const ok = () =>
    new Response(JSON.stringify({ ok: true }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });

  try {
    const { email } = await req.json().catch(() => ({ email: "" }));
    if (!email || typeof email !== "string") return ok();

    const SB_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const APP_URL = Deno.env.get("APP_URL") ?? "https://ectra-app.vercel.app";
    const FROM = Deno.env.get("MAIL_FROM") ?? "ECTRA <onboarding@resend.dev>";
    const RESEND = Deno.env.get("RESEND_API_KEY");

    // إنشاء توكن (يرجّع null لو الإيميل مش مسجّل) — service role فقط
    const r = await fetch(`${SB_URL}/rest/v1/rpc/ectra_create_reset_token`, {
      method: "POST",
      headers: {
        apikey: SERVICE,
        Authorization: "Bearer " + SERVICE,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ p_email: email.trim() }),
    });
    const token = await r.json().catch(() => null);

    // رد عام دائمًا حتى لو الإيميل غير مسجّل (منع كشف الحسابات)
    if (!token || typeof token !== "string") return ok();

    const link = `${APP_URL}/?reset=${encodeURIComponent(token)}`;

    if (!RESEND) {
      console.error("RESEND_API_KEY غير مضبوط — لن يُرسل الإيميل. الرابط:", link);
      return ok();
    }

    const html = `
      <div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;max-width:480px;margin:auto;padding:24px;color:#16181D">
        <h2 style="margin:0 0 8px">إعادة تعيين كلمة السر</h2>
        <p style="color:#6B7280;line-height:1.8;margin:0 0 20px">
          وصلنا طلب لإعادة تعيين كلمة السر لحسابك في مركز خدمة ECTRA.
          اضغط على الزر لاختيار كلمة سر جديدة. الرابط صالح لمدة ساعة واحدة.
        </p>
        <a href="${link}" style="display:inline-block;background:#FF5A3C;color:#fff;text-decoration:none;font-weight:700;padding:13px 28px;border-radius:12px">
          إعادة تعيين كلمة السر
        </a>
        <p style="color:#9AA0A6;font-size:12px;line-height:1.8;margin:22px 0 0">
          لو مش إنت اللي طلبت ده، تجاهل الرسالة وكلمة السر هتفضل زي ما هي.
        </p>
      </div>`;

    const send = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + RESEND, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM,
        to: [email.trim()],
        subject: "إعادة تعيين كلمة السر — مركز خدمة ECTRA",
        html,
      }),
    });
    if (!send.ok) console.error("Resend error:", await send.text());

    return ok();
  } catch (e) {
    console.error("reset-request error:", String(e));
    return ok();
  }
});
