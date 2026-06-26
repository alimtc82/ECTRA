import React, { useState } from "react";

const SB_URL = "https://quybqrlxhrnthspqrgpa.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1eWJxcmx4aHJudGhzcHFyZ3BhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MzI0MTYsImV4cCI6MjA5NzMwODQxNn0.rozu9zNvA1JAbFQAPS47j__GuYsiN8AJRpLGkMrPsf0";

const C = {
  bg: "#F4F5F7", card: "#FFFFFF", ink: "#16181D", muted: "#6B7280",
  line: "#E4E7EC", field: "#F7F8FA", primary: "#FF5A3C", danger: "#E5484D",
};

export default function ResetPassword({ token }) {
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  const submit = async () => {
    setErr("");
    if (p1.length < 6) { setErr("كلمة السر يجب أن تكون 6 أحرف على الأقل"); return; }
    if (p1 !== p2) { setErr("كلمتا السر غير متطابقتين"); return; }
    setBusy(true);
    try {
      const r = await fetch(`${SB_URL}/rest/v1/rpc/ectra_reset_password`, {
        method: "POST",
        headers: { apikey: SB_KEY, Authorization: "Bearer " + SB_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ p_token: token, p_new_password: p1 }),
      });
      if (!r.ok) {
        const t = await r.text();
        const m = t.match(/"message"\s*:\s*"([^"]+)"/);
        throw new Error(m ? m[1] : "تعذّر إعادة التعيين");
      }
      setDone(true);
    } catch (ex) {
      setErr(String(ex.message || ex).slice(0, 160));
    } finally { setBusy(false); }
  };

  const goHome = () => { window.location.href = window.location.origin + window.location.pathname; };

  const inputStyle = { width: "100%", padding: "13px 14px", borderRadius: 14, border: `1.5px solid ${C.line}`, background: C.field, fontSize: 15, color: C.ink, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 2, boxSizing: "border-box" };

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "28px 20px", fontFamily: "'IBM Plex Sans Arabic', 'Cairo', system-ui, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div style={{ display: "inline-flex", alignItems: "baseline", gap: 3, fontFamily: "'Archivo', sans-serif", fontWeight: 900, fontSize: 30, letterSpacing: "0.04em", color: C.ink, lineHeight: 1 }}>
            ECTRA<span style={{ color: C.primary }}>.</span>
          </div>
          <div style={{ fontSize: 14, color: C.muted, fontWeight: 700, marginTop: 8 }}>بواسطة MTC GROUP</div>
        </div>

        <div style={{ background: C.card, borderRadius: 26, padding: "30px 26px", border: `1px solid ${C.line}`, boxShadow: "0 20px 50px rgba(20,20,20,0.08)" }}>
          {!token ? (
            <div style={{ textAlign: "center" }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 8px", color: C.danger }}>رابط غير صالح</h1>
              <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.8 }}>الرابط ناقص أو غير صحيح. اطلب رابط جديد من شاشة الدخول.</p>
              <button onClick={goHome} style={{ marginTop: 16, padding: "12px 24px", borderRadius: 12, border: "none", background: C.primary, color: "#fff", fontWeight: 700, fontSize: 14.5, cursor: "pointer" }}>الرجوع لتسجيل الدخول</button>
            </div>
          ) : done ? (
            <div style={{ textAlign: "center" }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 8px", color: "#16A34A" }}>تم تغيير كلمة السر</h1>
              <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.8 }}>تقدر دلوقتي تسجّل الدخول بكلمة السر الجديدة.</p>
              <button onClick={goHome} style={{ marginTop: 16, padding: "12px 24px", borderRadius: 12, border: "none", background: C.primary, color: "#fff", fontWeight: 700, fontSize: 14.5, cursor: "pointer" }}>تسجيل الدخول</button>
            </div>
          ) : (
            <>
              <h1 style={{ fontSize: 26, fontWeight: 800, margin: "0 0 6px", color: C.ink }}>كلمة سر جديدة</h1>
              <p style={{ fontSize: 14, color: C.muted, margin: "0 0 22px" }}>اختر كلمة سر جديدة لحسابك</p>
              <div style={{ display: "grid", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13.5, fontWeight: 700, marginBottom: 7, color: C.ink }}>كلمة السر الجديدة</label>
                  <input type="password" value={p1} onChange={(e) => setP1(e.target.value)} placeholder="••••••••" style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13.5, fontWeight: 700, marginBottom: 7, color: C.ink }}>تأكيد كلمة السر</label>
                  <input type="password" value={p2} onChange={(e) => setP2(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="••••••••" style={inputStyle} />
                </div>
                {err && <div style={{ fontSize: 13, color: C.danger, fontWeight: 600, textAlign: "center", padding: "8px 12px", background: "#FDECEC", borderRadius: 10 }}>{err}</div>}
                <button onClick={submit} disabled={busy} style={{ padding: "15px", borderRadius: 16, border: "none", background: C.primary, color: "#fff", fontWeight: 800, fontSize: 16, cursor: "pointer", opacity: busy ? 0.7 : 1 }}>
                  {busy ? "جارٍ الحفظ..." : "حفظ كلمة السر"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
