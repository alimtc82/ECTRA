import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Zap, Check, ChevronLeft, ChevronRight, ArrowLeft, User, Package, Wrench,
  MessageCircle, Bell, Camera, Search, Award, Printer, FileText, PlusCircle,
  Headphones, BatteryCharging, BadgeCheck, Users as UsersIcon, ShieldCheck,
  Trash2, Pencil, Plus, X, Loader2, KeyRound, LogOut, Lock, LogIn, Database, Upload, Download,
  ScanLine, ListPlus, Sun, Moon, ClipboardList, RefreshCw, Layers, Hash, Star, MessageSquare,
  Eye, EyeOff, Store, Truck, Minus,
} from "lucide-react";
import warrantyStamp from "./assets/warranty-stamp.png";
import * as XLSX from "xlsx";

/*  MTC GROUP — موزّع معتمد لمنتجات ECTRA — مركز خدمة (متصل بـ Supabase: Agency backend)  */

const SB_URL = "https://quybqrlxhrnthspqrgpa.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1eWJxcmx4aHJudGhzcHFyZ3BhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MzI0MTYsImV4cCI6MjA5NzMwODQxNn0.rozu9zNvA1JAbFQAPS47j__GuYsiN8AJRpLGkMrPsf0";
const H = { apikey: SB_KEY, Authorization: "Bearer " + SB_KEY, "Content-Type": "application/json" };
const nz = (v) => (v === "" || v === undefined ? null : v);

async function sbSelect(table, q = "select=*") {
  const r = await fetch(`${SB_URL}/rest/v1/${table}?${q}`, { headers: H });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
async function sbInsert(table, row) {
  const r = await fetch(`${SB_URL}/rest/v1/${table}`, { method: "POST", headers: { ...H, Prefer: "return=representation" }, body: JSON.stringify(row) });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
async function sbUpdate(table, id, patch) {
  const r = await fetch(`${SB_URL}/rest/v1/${table}?id=eq.${id}`, { method: "PATCH", headers: { ...H, Prefer: "return=representation" }, body: JSON.stringify(patch) });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
async function sbDelete(table, id) {
  const r = await fetch(`${SB_URL}/rest/v1/${table}?id=eq.${id}`, { method: "DELETE", headers: H });
  if (!r.ok) throw new Error(await r.text());
}
async function sbRpc(fn, args) {
  const r = await fetch(`${SB_URL}/rest/v1/rpc/${fn}`, { method: "POST", headers: H, body: JSON.stringify(args) });
  if (!r.ok) throw new Error(await r.text());
  const t = await r.text();
  return t ? JSON.parse(t) : null;
}

// ===== نظام الثيم (فاتح/غامق) — مبني على هوية ECTRA من Stitch =====
const THEMES = {
  light: {
    ink: "#141414", inkSoft: "#2E2E2E", bg: "#F3F2F0", surface: "#FFFFFF",
    primary: "#FF5A3C", primaryDark: "#E2452A", tint: "#FFF1ED",
    line: "#E7E5E1", muted: "#6B6B6B", danger: "#E5484D",
    field: "#F3F3F4", cardBg: "#FFFFFF", heroFrom: "#141414", heroTo: "#2E2E2E",
    dark: false,
  },
  dark: {
    ink: "#E5E2E1", inkSoft: "#201F1F", bg: "#131313", surface: "#1C1B1B",
    primary: "#FF5A3C", primaryDark: "#FFB4A5", tint: "#2A1A16",
    line: "#353534", muted: "#A89C99", danger: "#FFB4AB",
    field: "#201F1F", cardBg: "#1C1B1B", heroFrom: "#0E0E0E", heroTo: "#252525",
    dark: true,
  },
};
// كائن الألوان النشط — يُحدّث وقت التشغيل عبر مزوّد الثيم.
// يبدأ فاتحاً ويُبدَّل عبر state في App (مع الحفاظ على نفس مفاتيح C القديمة).
let C = { ...THEMES.light };

const CHARGERS = ["Fast Charger 22.5W", "Fast Charger 25W", "Fast Charger 35W"];
const AUDIO = ["Earbuds Echo", "Neckband Active", "Earbuds Free ANC"];
const GOVS = ["القليوبية", "القاهرة", "الجيزة", "الدقهلية", "الشرقية", "الغربية", "المنوفية", "الإسكندرية", "أخرى"];
const ISSUES = ["لا يعمل نهائياً", "تلف أو كسر", "عطل جزئي / متقطّع", "أخرى"];
const STAGES = ["تم الاستلام", "قيد الفحص", "تحت الإصلاح", "جاهز للتسليم", "تم التسليم"];
const WA_MTC = "201224822220";

// كتالوج القوائم وأزرارها (لمحرّر الصلاحيات)
const MENU_CATALOG = [
  { key: "warranty", label: "شهادة ضمان منتج", buttons: [{ key: "issue", label: "إصدار الشهادة" }, { key: "send", label: "إرسال واتساب" }, { key: "print", label: "طباعة / PDF" }] },
  { key: "intake", label: "إضافة استلام صيانة", buttons: [{ key: "submit", label: "تسجيل الطلب" }, { key: "photo", label: "إرفاق صورة" }] },
  { key: "inquiry", label: "استعلام عن صيانة", buttons: [{ key: "search", label: "بحث" }, { key: "contact", label: "تواصل واتساب" }] },
  { key: "services", label: "إدارة الصيانة", buttons: [{ key: "view", label: "عرض الطلبات" }, { key: "update", label: "تغيير المرحلة / ملاحظات" }, { key: "delete", label: "حذف الطلب" }] },
  { key: "users", label: "قائمة المستخدمين", buttons: [{ key: "manageUsers", label: "إدارة المستخدمين" }, { key: "manageRoles", label: "إدارة الصلاحيات" }] },
  { key: "products", label: "قاعدة البيانات", buttons: [{ key: "add", label: "إضافة منتج" }, { key: "edit", label: "تعديل" }, { key: "delete", label: "حذف" }, { key: "import", label: "استيراد Excel" }, { key: "template", label: "تنزيل القالب" }] },
  { key: "warranties", label: "قائمة الضمانات", buttons: [{ key: "view", label: "عرض الضمانات" }, { key: "edit", label: "تعديل الشهادة" }, { key: "delete", label: "حذف الشهادة" }] },
  { key: "feedback", label: "التقييمات", buttons: [{ key: "view", label: "عرض" }, { key: "delete", label: "حذف" }] },
  { key: "pos", label: "مبيعات لنقطة بيع", buttons: [{ key: "managePos", label: "إدارة نقاط البيع" }, { key: "delivery", label: "أوامر تسليم البضاعة" }] },
];
const blankPerms = () => {
  const p = {};
  MENU_CATALOG.forEach((m) => { p[m.key] = { open: false, buttons: {} }; m.buttons.forEach((b) => (p[m.key].buttons[b.key] = false)); });
  return p;
};

const code = (p) => p + String(Math.floor(10000 + Math.random() * 89999));
const addYear = (d) => { const x = d ? new Date(d) : new Date(); x.setFullYear(x.getFullYear() + 1); return x.toISOString().slice(0, 10); };

function Wordmark({ light, size = 22, sub }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 3, fontFamily: "'Archivo', sans-serif", fontWeight: 900, fontSize: size, letterSpacing: "0.04em", color: light ? "#fff" : C.ink, lineHeight: 1 }}>
        ECTRA<span style={{ color: C.primary }}>.</span>
      </div>
      {sub && <div style={{ fontSize: 11, color: light ? "rgba(255,255,255,0.6)" : C.muted, marginTop: 4, fontWeight: 700, lineHeight: 1.5 }}>{sub}</div>}
    </div>
  );
}


const Auth = React.createContext(null);
const useAuth = () => React.useContext(Auth);

export default function App() {
  const [view, setView] = useState("home");
  const [me, setMe] = useState(() => { try { const r = localStorage.getItem("ectra_me"); return r ? JSON.parse(r) : null; } catch { return null; } });
  const [theme, setTheme] = useState("light");
  // إعادة تعيين كائن الألوان النشط قبل أي render (يحافظ على نفس مفاتيح C في كل المكوّنات)
  C = { ...THEMES[theme] };
  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));
  const can = (m, b) => !!me?.permissions?.[m]?.buttons?.[b];
  const canOpen = (m) => !!me?.permissions?.[m]?.open;
  return (
    <Auth.Provider value={{ me, can, canOpen, theme, toggleTheme, logout: () => { setMe(null); setView("home"); try { localStorage.removeItem("ectra_me"); } catch {} } }}>
    <div dir="rtl" data-theme={theme} key={theme} style={{ background: C.bg, minHeight: "100vh", color: C.ink, fontFamily: "Tajawal, system-ui, sans-serif", transition: "background .3s, color .3s" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@800;900&family=Tajawal:wght@400;500;700;800&family=IBM+Plex+Mono:wght@500;600&display=swap');
        * { box-sizing: border-box; }
        input, select, textarea { font-family: inherit; }
        input:focus, select:focus, textarea:focus { outline: none; border-color: ${C.primary} !important; box-shadow: 0 0 0 3px rgba(255,90,60,0.18); }
        .ek-fade { animation: ekFade .35s ease both; }
        @keyframes ekFade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .ek-btn, .ek-card { transition: transform .12s ease, box-shadow .2s ease, background .2s, border-color .2s; }
        .ek-btn:active { transform: scale(.985); }
        .ek-card:hover { transform: translateY(-3px); box-shadow: 0 16px 40px rgba(20,20,20,0.14); border-color: ${C.primary}; }
        .spin { animation: sp 1s linear infinite; } @keyframes sp { to { transform: rotate(360deg); } }
        @media print { body * { visibility: hidden; } #cert, #cert * { visibility: visible; } #cert { position: absolute; inset: 0 0 auto 0; } }
        .ek-cert-foot { display: flex; flex-wrap: nowrap; align-items: center; gap: 14px; margin-top: 14px; }
        .ek-cert-foot .ek-cert-terms { flex: 1 1 auto; min-width: 0; }
        .ek-cert-foot .ek-cert-stamp { flex: 0 0 auto; text-align: center; }
        @media (max-width: 480px) {
          .ek-cert-foot { flex-direction: column; align-items: stretch; }
          .ek-cert-foot .ek-cert-terms { flex: 0 0 auto; }
          .ek-cert-foot .ek-cert-stamp { margin-top: 2px; }
        }
        @media (prefers-reduced-motion: reduce) { .ek-fade,.ek-btn,.ek-card { animation: none; transition: none; } }
      `}</style>

      {!me ? (
        <Login onLogin={(u, remember) => { setMe(u); setView("home"); try { remember ? localStorage.setItem("ectra_me", JSON.stringify(u)) : localStorage.removeItem("ectra_me"); } catch {} }} />
      ) : (
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "18px 16px 48px" }}>
          <Header onBack={view !== "home" ? () => setView("home") : null} />
          {view === "home" && <Home go={setView} />}
          {view === "warranty" && <Warranty />}
          {view === "intake" && <Intake />}
          {view === "inquiry" && <Inquiry />}
          {view === "services" && <ServicesView />}
          {view === "users" && <UsersView />}
          {view === "products" && <CatalogView />}
          {view === "warranties" && <WarrantiesView onIssue={() => setView("warranty")} />}
          {view === "feedback" && <FeedbackView />}
          {view === "pos" && <PosView />}
          <p style={{ textAlign: "center", color: C.muted, fontSize: 12.5, marginTop: 26 }}>مركز خدمة MTC GROUP — موزّع معتمد لمنتجات ECTRA · بنها</p>
        </div>
      )}
    </div>
    </Auth.Provider>
  );
}

/* ===================== تسجيل الدخول ===================== */
function Login({ onLogin }) {
  const { theme, toggleTheme } = useAuth();
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [remember, setRemember] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const submit = async () => {
    if (!u.trim() || !p) return;
    setBusy(true); setErr("");
    try {
      const rows = await sbRpc("ectra_login", { p_username: u.trim(), p_password: p });
      if (rows && rows.length) onLogin(rows[0], remember);
      else setErr("اسم المستخدم أو كلمة السر غير صحيحة");
    } catch (ex) { setErr("تعذّر تسجيل الدخول — حاول تاني"); }
    finally { setBusy(false); }
  };
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "28px 20px", position: "relative" }}>
      <button onClick={toggleTheme} title={theme === "light" ? "الوضع الليلي" : "الوضع النهاري"} className="ek-btn"
        style={{ position: "absolute", top: 18, left: 18, width: 42, height: 42, borderRadius: "50%", border: `1.5px solid ${C.line}`, background: C.surface, color: C.ink, display: "grid", placeItems: "center", cursor: "pointer" }}>
        {theme === "light" ? <Moon size={18} /> : <Sun size={18} color={C.primary} />}
      </button>

      <div className="ek-fade" style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 26 }}>
          <div style={{ fontSize: 10, letterSpacing: "0.14em", color: C.muted, fontWeight: 700, marginBottom: 12 }}>ECTRA · By Kieslect</div>
          <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 3, fontFamily: "'Archivo', sans-serif", fontWeight: 900, fontSize: 30, letterSpacing: "0.04em", color: C.ink, lineHeight: 1 }}>
              ECTRA<span style={{ color: C.primary }}>.</span>
            </div>
            <div style={{ fontSize: 15, color: C.muted, fontWeight: 700, marginTop: 8 }}>بواسطة MTC GROUP</div>
          </div>
        </div>

        <div style={{ background: C.cardBg, borderRadius: 26, padding: "30px 26px", border: `1px solid ${C.line}`, boxShadow: C.dark ? "0 20px 50px rgba(0,0,0,0.4)" : "0 20px 50px rgba(20,20,20,0.08)" }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 6px", color: C.ink }}>تسجيل الدخول</h1>
          <p style={{ fontSize: 14.5, color: C.muted, margin: "0 0 24px" }}>مرحباً بك مجدداً في مركز الخدمة</p>

          <div style={{ display: "grid", gap: 18 }}>
            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 700, marginBottom: 8, color: C.ink }}>اسم المستخدم</label>
              <div style={{ position: "relative" }}>
                <User size={18} color={C.muted} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)" }} />
                <input value={u} onChange={(e) => setU(e.target.value)} placeholder="أدخل اسم المستخدم"
                  style={{ width: "100%", padding: "13px 44px 13px 14px", borderRadius: 14, border: `1.5px solid ${C.line}`, background: C.field, fontSize: 15, color: C.ink, fontFamily: "'IBM Plex Mono', monospace" }} />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 700, marginBottom: 8, color: C.ink }}>كلمة السر</label>
              <div style={{ position: "relative" }}>
                <Lock size={18} color={C.muted} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)" }} />
                <input type={showPw ? "text" : "password"} value={p} onChange={(e) => setP(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="••••••••"
                  style={{ width: "100%", padding: "13px 44px 13px 44px", borderRadius: 14, border: `1.5px solid ${C.line}`, background: C.field, fontSize: 15, color: C.ink, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 2 }} />
                <button type="button" onClick={() => setShowPw((v) => !v)} title={showPw ? "إخفاء" : "إظهار"} style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", width: 32, height: 32, borderRadius: 8, border: "none", background: "transparent", color: C.muted, cursor: "pointer", display: "grid", placeItems: "center" }}>{showPw ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer", fontSize: 13.5, color: C.ink, fontWeight: 600 }}>
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} style={{ width: 16, height: 16, accentColor: C.primary, cursor: "pointer" }} />
                تذكرني
              </label>
              <span onClick={() => setShowForgot(true)} style={{ fontSize: 13.5, color: C.primary, fontWeight: 700, cursor: "pointer" }}>نسيت كلمة السر؟</span>
            </div>

            {err && <div style={{ fontSize: 13, color: C.danger, fontWeight: 600, textAlign: "center", padding: "8px 12px", background: C.dark ? "rgba(255,180,171,0.1)" : "#FDECEC", borderRadius: 10 }}>{err}</div>}

            <button onClick={submit} disabled={busy} className="ek-btn"
              style={{ padding: "15px", borderRadius: 16, border: "none", background: C.primary, color: "#fff", fontWeight: 800, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: `0 10px 28px ${C.primary}55` }}>
              {busy ? <Loader2 size={19} className="spin" color="#fff" /> : <LogIn size={19} />} تسجيل الدخول
            </button>
          </div>

          <div style={{ height: 1, background: C.line, margin: "24px 0" }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 13.5, color: C.muted, marginBottom: 12 }}>ليس لديك حساب؟</div>
            <a href={`https://wa.me/${WA_MTC}`} target="_blank" rel="noreferrer" className="ek-btn"
              style={{ display: "inline-block", padding: "11px 28px", borderRadius: 14, border: `1.5px solid ${C.ink}`, background: "transparent", color: C.ink, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
              تواصل مع الإدارة
            </a>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 24, fontSize: 12, color: C.muted, lineHeight: 1.9 }}>
          © 2026 مركز خدمة إكترا. جميع الحقوق محفوظة.<br />
          <span style={{ opacity: 0.8 }}>الشروط والأحكام · سياسة الخصوصية</span>
        </div>
      </div>
      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
    </div>
  );
}

function ForgotPasswordModal({ onClose }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const submit = async () => {
    if (!email.trim()) { setErr("اكتب البريد الإلكتروني"); return; }
    setBusy(true); setErr("");
    try {
      await fetch(`${SB_URL}/functions/v1/password-reset-request`, {
        method: "POST",
        headers: { apikey: SB_KEY, Authorization: "Bearer " + SB_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      setDone(true);
    } catch { setDone(true); } // رد عام دائمًا لمنع كشف الإيميلات المسجّلة
    finally { setBusy(false); }
  };
  return (
    <Modal title="استعادة كلمة السر" onClose={onClose}>
      {done ? (
        <div style={{ textAlign: "center", padding: "8px 4px" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.tint, display: "grid", placeItems: "center", margin: "0 auto 14px", color: C.primary }}><Check size={28} /></div>
          <p style={{ fontSize: 15, color: C.ink, fontWeight: 700, margin: "0 0 6px" }}>تم الإرسال</p>
          <p style={{ fontSize: 13.5, color: C.muted, lineHeight: 1.8, margin: 0 }}>لو البريد مُسجّل في النظام، هيوصلك رابط لإعادة تعيين كلمة السر. الرابط صالح لمدة ساعة.</p>
          <button onClick={onClose} className="ek-btn" style={{ marginTop: 18, padding: "12px 24px", borderRadius: 12, border: "none", background: C.primary, color: "#fff", fontWeight: 700, fontSize: 14.5, cursor: "pointer" }}>تمام</button>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          <p style={{ fontSize: 13.5, color: C.muted, lineHeight: 1.8, margin: 0 }}>اكتب بريدك الإلكتروني المسجّل وهنبعتلك رابط لإعادة تعيين كلمة السر.</p>
          <Field label="البريد الإلكتروني" error={err}>
            <Input value={email} onChange={setEmail} placeholder="example@mail.com" type="email" mono />
          </Field>
          <button onClick={submit} disabled={busy} className="ek-btn" style={{ padding: "13px", borderRadius: 14, border: "none", background: C.primary, color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {busy ? <Loader2 size={18} className="spin" color="#fff" /> : <MessageCircle size={18} />} إرسال رابط الاستعادة
          </button>
        </div>
      )}
    </Modal>
  );
}

function Header({ onBack }) {
  const { me, logout, theme, toggleTheme } = useAuth();
  return (
    <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22, gap: 10, flexWrap: "wrap" }}>
      <Wordmark sub="موزّع معتمد · مركز خدمة" size={24} />
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button onClick={toggleTheme} title={theme === "light" ? "الوضع الليلي" : "الوضع النهاري"} className="ek-btn" style={{ width: 38, height: 38, borderRadius: "50%", border: `1.5px solid ${C.line}`, background: C.surface, color: C.ink, display: "grid", placeItems: "center", cursor: "pointer" }}>
          {theme === "light" ? <Moon size={16} /> : <Sun size={16} color={C.primary} />}
        </button>
        {onBack && (
          <button onClick={onBack} className="ek-btn" style={{ display: "flex", alignItems: "center", gap: 5, padding: "9px 14px", borderRadius: 10, border: `1.5px solid ${C.line}`, background: C.surface, color: C.ink, fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}>
            <ArrowLeft size={16} /> الرئيسية
          </button>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px 6px 6px", borderRadius: 20, background: C.surface, border: `1.5px solid ${C.line}` }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{me?.name}</span>
          <button onClick={logout} title="تسجيل الخروج" className="ek-btn" style={{ width: 30, height: 30, borderRadius: "50%", border: "none", background: C.tint, color: C.primaryDark, display: "grid", placeItems: "center", cursor: "pointer" }}><LogOut size={15} /></button>
        </div>
      </div>
    </header>
  );
}

function Home({ go }) {
  const { canOpen, me } = useAuth();
  const allCards = [
    { id: "warranty", icon: ShieldCheck, title: "شهادة ضمان منتج", desc: "إصدار وتوثيق شهادات الضمان الرقمية للمنتجات الرسمية والمباعة" },
    { id: "intake", icon: PlusCircle, title: "إضافة استلام صيانة", desc: "تسجيل جهاز جديد في مركز الصيانة وفتح تذكرة متابعة فنية" },
    { id: "inquiry", icon: Search, title: "استعلام عن صيانة", desc: "متابعة حالة الأجهزة في المختبر ومعرفة المرحلة التي وصلت إليها" },
    { id: "services", icon: ClipboardList, title: "إدارة الصيانة", desc: "متابعة كل طلبات الصيانة، تحديث المراحل، وإضافة ملاحظات الفنيين" },
    { id: "users", icon: UsersIcon, title: "قائمة المستخدمين", desc: "إدارة الموظفين، الفنيين، وصلاحيات الوصول للنظام" },
    { id: "products", icon: Database, title: "قاعدة البيانات", desc: "الأصناف والأقسام والأرقام المسلسلة لكل المنتجات المسجّلة" },
    { id: "warranties", icon: Award, title: "قائمة الضمانات", desc: "عرض كل شهادات الضمان المُصدَرة وإصدار شهادة جديدة" },
    { id: "feedback", icon: Star, title: "التقييمات", desc: "تقييمات العملاء بالنجوم وملاحظاتهم عن المنتجات والخدمة" },
    { id: "pos", icon: Store, title: "مبيعات لنقطة بيع", desc: "إدارة نقاط البيع وتحويل كميات من الأصناف إليها بأوامر تسليم بالسيريالات" },
  ];
  const cards = allCards.filter((c) => canOpen(c.id));
  const firstName = (me?.name || "").split(" ")[0] || "بك";
  return (
    <div className="ek-fade">
      {/* Hero */}
      <div style={{ background: `linear-gradient(150deg, ${C.heroFrom}, ${C.heroTo})`, borderRadius: 24, padding: "26px 24px", color: "#fff", position: "relative", overflow: "hidden", marginBottom: 22 }}>
        <div style={{ position: "absolute", top: -50, left: -30, width: 220, height: 220, borderRadius: "50%", background: `radial-gradient(circle, ${C.primary}44, transparent 70%)` }} />
        <div style={{ position: "relative" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13.5, fontWeight: 800, marginBottom: 12 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.primary, display: "inline-block" }} />
            أهلاً {firstName} في نظام الإدارة الذكي
          </div>
          <p style={{ fontSize: 14, opacity: 0.74, margin: "0 0 20px", maxWidth: 520, lineHeight: 1.9 }}>قم بإدارة طلبات الصيانة، شهادات الضمان، وبيانات العملاء بكل سهولة ودقة من خلال لوحة التحكم المتكاملة لمركز خدمة إكترا.</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {canOpen("intake") && (
              <button onClick={() => go("intake")} className="ek-btn" style={{ display: "flex", alignItems: "center", gap: 7, padding: "12px 22px", borderRadius: 13, border: "none", background: C.primary, color: "#fff", fontWeight: 800, fontSize: 14.5, cursor: "pointer", boxShadow: `0 8px 22px ${C.primary}55` }}>
                <Plus size={17} /> بدء معاملة جديدة
              </button>
            )}
            {canOpen("inquiry") && (
              <button onClick={() => go("inquiry")} className="ek-btn" style={{ display: "flex", alignItems: "center", gap: 7, padding: "12px 22px", borderRadius: 13, border: "1.5px solid rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.06)", color: "#fff", fontWeight: 700, fontSize: 14.5, cursor: "pointer" }}>
                <Search size={16} /> متابعة الطلبات
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Service cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14 }}>
        {cards.map((c) => (
          <button key={c.id} onClick={() => go(c.id)} className="ek-card" style={{ textAlign: "right", background: C.cardBg, border: `1px solid ${C.line}`, borderRadius: 20, padding: "24px 22px", cursor: "pointer", display: "flex", flexDirection: "column", gap: 14, boxShadow: C.dark ? "none" : "0 4px 18px rgba(20,20,20,0.04)" }}>
            <div style={{ width: 54, height: 54, borderRadius: 16, background: C.tint, display: "grid", placeItems: "center" }}><c.icon size={26} color={C.primary} /></div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6, color: C.ink }}>{c.title}</div>
              <div style={{ fontSize: 13.5, color: C.muted, lineHeight: 1.8 }}>{c.desc}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, color: C.primary, fontWeight: 800, fontSize: 13.5, marginTop: "auto" }}>دخول الخدمة <ChevronLeft size={16} /></div>
          </button>
        ))}
        {!cards.length && <Empty>لا توجد قوائم متاحة لحسابك</Empty>}
      </div>

      {/* Coming soon */}
      <div style={{ marginTop: 14, border: `1.5px dashed ${C.line}`, borderRadius: 20, padding: "22px", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: C.muted }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: C.field, display: "grid", placeItems: "center" }}><Zap size={18} color={C.muted} /></div>
        <span style={{ fontSize: 13.5, fontWeight: 600 }}>المزيد من الخصائص قريباً</span>
      </div>
    </div>
  );
}

/* ===================== شهادة ضمان ===================== */
function Warranty() {
  const { can, me } = useAuth();
  const [step, setStep] = useState(0);
  const [err, setErr] = useState({});
  const [d, setD] = useState({ wa: "", name: "", model: "", serial: "", purchase: "" });
  const [cert, setCert] = useState(null);
  const [saving, setSaving] = useState(false);
  const [apiErr, setApiErr] = useState("");
  const [scan, setScan] = useState(false);
  const set = (k, v) => { setD((s) => ({ ...s, [k]: v })); setErr((e) => ({ ...e, [k]: undefined })); };

  const go = async () => {
    const e = {};
    if (step === 0 && !/^01[0-9]{9}$/.test(d.wa.trim())) e.wa = "رقم واتساب مصري صحيح من 11 رقم";
    if (step === 1) { if (!d.name.trim()) e.name = "اكتب اسم العميل"; if (!d.model) e.model = "اختر الموديل"; if (!d.serial.trim()) e.serial = "الرقم المسلسل مطلوب ولازم يكون مسجّل في القاعدة"; }
    setErr(e); if (Object.keys(e).length) return;
    if (step === 1) {
      const c = { no: code("WC-EC-"), start: d.purchase || new Date().toISOString().slice(0, 10), end: addYear(d.purchase), soldBy: me.pos_name || null, ...d };
      setSaving(true); setApiErr("");
      try {
        await sbRpc("ectra_warranty_issue", { p_token: me.token, p_cert_no: c.no, p_customer_name: d.name, p_whatsapp: d.wa, p_model: d.model, p_serial: nz(d.serial), p_purchase_date: nz(d.purchase), p_start_date: c.start, p_end_date: c.end });
        setCert(c); setStep(2);
      } catch (ex) { setApiErr(ekErrMsg(ex)); }
      finally { setSaving(false); }
      return;
    }
    setStep((s) => s + 1);
  };

  return (
    <Panel side="شهادة ضمان منتج" sideDesc="أصدر شهادة ضمان للمنتج واحفظها وأرسلها للعميل على واتساب." sideIcon={Award}>
      {step < 2 ? (
        <>
          <MiniSteps labels={["رقم العميل", "بيانات المنتج"]} step={step} />
          <div className="ek-fade" key={step} style={{ display: "grid", gap: 16 }}>
            {step === 0 && (<>
              <Field label="رقم واتساب العميل (لإرسال الشهادة)" error={err.wa}><Input value={d.wa} onChange={(v) => set("wa", v)} placeholder="01xxxxxxxxx" inputMode="numeric" mono /></Field>
              <Note>هنرسل شهادة الضمان (ملف PDF) على رقم الواتساب ده بعد إصدارها.</Note>
            </>)}
            {step === 1 && (<>
              <Field label="اسم العميل" error={err.name}><Input value={d.name} onChange={(v) => set("name", v)} placeholder="الاسم بالكامل" /></Field>
              <Field label="الموديل" error={err.model}><ModelPicker value={d.model} onChange={(v) => set("model", v)} /></Field>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                <Field label="الرقم المسلسل (لازم يكون مسجّل)" error={err.serial}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Input value={d.serial} onChange={(v) => set("serial", v)} placeholder="ادخل أو امسح السيريال" mono />
                    <button onClick={() => setScan(true)} className="ek-btn" title="مسح" style={{ ...iconBtnStyle(), color: C.primary, width: 46, flexShrink: 0 }}><Camera size={18} /></button>
                  </div>
                </Field>
                <Field label="تاريخ الشراء"><Input type="date" value={d.purchase} onChange={(v) => set("purchase", v)} /></Field>
              </div>
            </>)}
          </div>
          {apiErr && <ErrBox>{apiErr}</ErrBox>}
          <NavBtns step={step} onBack={() => setStep((s) => s - 1)} onNext={go} lastLabel={saving ? "...جاري الإصدار" : "إصدار الشهادة"} lastIcon={Award} isLast={step === 1} busy={saving} locked={step === 1 && !can("warranty", "issue")} />
        </>
      ) : <CertificateResult cert={cert} />}
      {scan && <ScannerModal onClose={() => setScan(false)} onResult={(v) => { set("serial", v); setScan(false); }} />}
    </Panel>
  );
}
function CertificateResult({ cert }) {
  const { can } = useAuth();
  const [sending, setSending] = useState(false);
  const waText = `شهادة ضمان ECTRA\nالعميل: ${cert.name}\nالمنتج: ${cert.model}\nرقم الشهادة: ${cert.no}\nالضمان حتى: ${cert.end}`;
  const sendPdf = async () => {
    const el = document.getElementById("cert");
    if (!el) return;
    setSending(true);
    try {
      const [h2cMod, jspdfMod] = await Promise.all([
        import(/* @vite-ignore */ "https://esm.sh/html2canvas@1.4.1"),
        import(/* @vite-ignore */ "https://esm.sh/jspdf@2.5.1"),
      ]);
      const html2canvas = h2cMod.default || h2cMod;
      const jsPDF = jspdfMod.jsPDF || (jspdfMod.default && jspdfMod.default.jsPDF) || jspdfMod.default;
      const canvas = await html2canvas(el, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const imgH = (canvas.height * (pageW - 40)) / canvas.width;
      pdf.addImage(imgData, "JPEG", 20, 24, pageW - 40, imgH);
      const blob = pdf.output("blob");
      const file = new File([blob], `ECTRA-${cert.no}.pdf`, { type: "application/pdf" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "شهادة ضمان ECTRA", text: waText });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = file.name; a.click();
        URL.revokeObjectURL(url);
        window.open(`https://wa.me/${cert.wa}?text=${encodeURIComponent(waText)}`, "_blank");
      }
    } catch (e) {
      if (String(e).indexOf("AbortError") === -1) alert("تعذّر إنشاء/مشاركة الـ PDF: " + String(e).slice(0, 140));
    } finally { setSending(false); }
  };
  return (
    <div className="ek-fade" style={{ textAlign: "center" }}>
      <SuccessIcon /><h2 style={{ fontSize: 21, fontWeight: 800, margin: "0 0 4px" }}>تم إصدار شهادة الضمان وحفظها</h2>
      <p style={{ color: C.muted, fontSize: 14, margin: "0 0 20px" }}>راجع الشهادة وأرسلها للعميل على واتساب.</p>
      <div id="cert" style={{ textAlign: "right", border: `2px solid ${C.ink}`, borderRadius: 16, padding: 22, background: "#fff", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -30, left: -30, width: 120, height: 120, borderRadius: "50%", background: C.tint }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: `2px solid ${C.ink}`, paddingBottom: 14, marginBottom: 14, position: "relative" }}>
          <Wordmark sub="موزّع معتمد لمنتجات ECTRA" size={22} />
          <div style={{ textAlign: "left" }}><div style={{ fontSize: 11, color: C.muted }}>رقم الشهادة</div><div style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, color: C.primary, fontSize: 15 }}>{cert.no}</div></div>
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 8, background: C.ink, color: "#fff", fontSize: 11.5, fontWeight: 700, marginBottom: 12 }}><BadgeCheck size={13} color={C.primary} /> منتج أصلي · شهادة ضمان</div>
        <CertRow k="العميل" v={cert.name} /><CertRow k="المنتج" v={cert.model} mono />{cert.serial && <CertRow k="الرقم التسلسلي" v={cert.serial} mono />}
        <CertRow k="تاريخ بداية الضمان" v={cert.start} /><CertRow k="ساري حتى" v={cert.end} highlight />
        {cert.soldBy && (
          <div style={{ marginTop: 14, padding: "12px 14px", borderRadius: 12, background: C.tint, border: "1px solid #F6D7CE", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ fontSize: 13.5 }}><span style={{ color: C.muted }}>تم البيع بواسطة: </span><span style={{ fontWeight: 800, color: C.ink }}>{cert.soldBy}</span></div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 12px", borderRadius: 999, background: "#fff", border: `1.5px solid ${C.primary}`, whiteSpace: "nowrap" }}>
              <ShieldCheck size={18} color={C.primary} />
              <span style={{ lineHeight: 1.1 }}><span style={{ display: "block", fontSize: 12.5, fontWeight: 800, color: C.primaryDark }}>نقطة بيع معتمدة</span><span style={{ display: "block", fontSize: 9, fontWeight: 700, color: C.muted, letterSpacing: 0.4 }}>AUTHORIZED POS</span></span>
            </div>
          </div>
        )}
        <div className="ek-cert-foot">
          <div className="ek-cert-terms" style={{ padding: "10px 14px", background: C.bg, borderRadius: 10, fontSize: 12.5, color: C.muted, lineHeight: 1.7 }}>ضمان لمدة 12 شهر ضد عيوب الصناعة. لا يشمل سوء الاستخدام أو الكسر. الشهادة صالحة بإبراز رقمها لدى مركز الخدمة.</div>
          <div className="ek-cert-stamp">
            <img src={warrantyStamp} alt="ضمان سنة" crossOrigin="anonymous" style={{ width: 92, height: "auto", transform: "rotate(-8deg)", filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.12))" }} />
          </div>
        </div>
      </div>
      {can("warranty", "send") && <button onClick={sendPdf} disabled={sending} className="ek-btn" style={btnPrimary()}>{sending ? <Loader2 size={18} className="spin" color="#fff" /> : <MessageCircle size={18} />} إرسال الشهادة PDF على واتساب</button>}
      {can("warranty", "print") && <button onClick={() => window.print()} className="ek-btn" style={btnGhost()}><Printer size={18} /> طباعة</button>}
    </div>
  );
}

/* ===================== استلام صيانة ===================== */
function Intake() {
  const { can, me } = useAuth();
  const [step, setStep] = useState(0);
  const [err, setErr] = useState({});
  const [done, setDone] = useState(null);
  const [saving, setSaving] = useState(false);
  const [apiErr, setApiErr] = useState("");
  const [d, setD] = useState({ name: "", phone: "", gov: "", model: "", serial: "", purchase: "", inWarranty: "yes", issueType: "", desc: "", hasPhoto: false });
  const set = (k, v) => { setD((s) => ({ ...s, [k]: v })); setErr((e) => ({ ...e, [k]: undefined })); };
  const validate = (s) => {
    const e = {};
    if (s === 0) { if (!d.name.trim()) e.name = "اكتب اسم العميل"; if (!/^01[0-9]{9}$/.test(d.phone.trim())) e.phone = "رقم موبايل مصري صحيح"; if (!d.gov) e.gov = "اختر المحافظة"; }
    if (s === 1) { if (!d.model) e.model = "اختر الموديل"; }
    if (s === 2) { if (!d.issueType) e.issueType = "اختر نوع المشكلة"; if (d.desc.trim().length < 10) e.desc = "اكتب وصف لا يقل عن 10 حروف"; }
    setErr(e); return !Object.keys(e).length;
  };
  const submit = async () => {
    if (!validate(2)) return;
    const c = code("MTC-EK-"); setSaving(true); setApiErr("");
    try {
      await sbRpc("ectra_service_intake", { p_token: me.token, p_code: c, p_customer_name: d.name, p_phone: d.phone, p_governorate: nz(d.gov), p_model: d.model, p_serial: nz(d.serial), p_purchase_date: nz(d.purchase), p_in_warranty: d.inWarranty === "yes", p_issue_type: d.issueType, p_description: d.desc, p_has_photo: d.hasPhoto });
      setDone({ code: c, ...d });
    } catch (ex) { setApiErr("تعذّر حفظ الطلب: " + String(ex).slice(0, 120)); }
    finally { setSaving(false); }
  };

  if (done) return (
    <Panel side="إضافة استلام صيانة" sideDesc="تم تسجيل الطلب في قاعدة البيانات وإرسال إشعار استلام للعميل." sideIcon={PlusCircle}>
      <div className="ek-fade" style={{ textAlign: "center" }}>
        <SuccessIcon /><h2 style={{ fontSize: 21, fontWeight: 800, margin: "0 0 4px" }}>تم استلام المنتج وتسجيل الطلب</h2>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, margin: "8px 0 18px", padding: "7px 14px", borderRadius: 20, background: C.tint, color: C.primaryDark, fontWeight: 700, fontSize: 13 }}><Bell size={15} /> تم إرسال إشعار استلام للعميل</div>
        <div style={{ border: `1.5px dashed ${C.line}`, borderRadius: 16, padding: 18, background: C.bg, textAlign: "right" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 12, borderBottom: `1.5px dashed ${C.line}`, marginBottom: 12 }}>
            <div><div style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>رقم الطلب</div><div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", color: C.primary, letterSpacing: 1 }}>{done.code}</div></div>
            <span style={{ padding: "6px 12px", borderRadius: 20, background: C.ink, color: "#fff", fontSize: 12.5, fontWeight: 700 }}>{STAGES[0]}</span>
          </div>
          <Row k="المنتج" v={done.model} /><Row k="المشكلة" v={done.issueType} /><Row k="الضمان" v={done.inWarranty === "yes" ? "داخل الضمان" : "خارج الضمان"} last />
        </div>
        <Note small>احتفظ برقم الطلب — العميل هيستخدمه في "استعلام عن صيانة" للمتابعة.</Note>
      </div>
    </Panel>
  );

  const pct = ((step + 1) / 3) * 100;
  return (
    <Panel side="إضافة استلام صيانة" sideDesc="سجّل بيانات العميل والمنتج والعطل لاستلام المنتج للصيانة." sideIcon={PlusCircle}>
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          {[{ l: "العميل", i: User }, { l: "المنتج", i: Package }, { l: "العطل", i: Wrench }].map((s, i) => {
            const dn = i < step, ac = i === step;
            return (<div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: 1 }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, display: "grid", placeItems: "center", background: dn ? C.ink : ac ? C.primary : C.field, color: dn || ac ? "#fff" : C.muted, transition: "all .25s", boxShadow: ac ? `0 6px 18px ${C.primary}55` : "none" }}>{dn ? <Check size={18} /> : <s.i size={18} />}</div>
              <span style={{ fontSize: 11.5, fontWeight: ac ? 700 : 500, color: ac ? C.ink : C.muted }}>{s.l}</span>
            </div>);
          })}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ flex: 1, height: 10, background: C.field, borderRadius: 6, overflow: "hidden" }}><div style={{ width: `${pct}%`, height: "100%", borderRadius: 6, background: `linear-gradient(90deg, ${C.ink}, ${C.primary})`, transition: "width .4s ease" }} /></div>
          <BatteryCharging size={15} color={C.primary} /><span style={{ fontSize: 11, fontWeight: 700, color: C.muted, fontFamily: "'IBM Plex Mono', monospace" }}>{Math.round(pct)}%</span>
        </div>
      </div>
      <div className="ek-fade" key={step}>
        {step === 0 && (<div style={{ display: "grid", gap: 16 }}>
          <Field label="اسم العميل" error={err.name}><Input value={d.name} onChange={(v) => set("name", v)} placeholder="الاسم بالكامل" /></Field>
          <Field label="رقم الموبايل" error={err.phone}><Input value={d.phone} onChange={(v) => set("phone", v)} placeholder="01xxxxxxxxx" inputMode="numeric" mono /></Field>
          <Field label="المحافظة" error={err.gov}><Select value={d.gov} onChange={(v) => set("gov", v)} options={GOVS} placeholder="اختر" /></Field>
        </div>)}
        {step === 1 && (<div style={{ display: "grid", gap: 16 }}>
          <Field label="الموديل" error={err.model}><ModelPicker value={d.model} onChange={(v) => set("model", v)} /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            <Field label="الرقم التسلسلي / الفاتورة"><Input value={d.serial} onChange={(v) => set("serial", v)} placeholder="اختياري" mono /></Field>
            <Field label="تاريخ الشراء"><Input type="date" value={d.purchase} onChange={(v) => set("purchase", v)} /></Field>
          </div>
          <Field label="حالة الضمان"><Toggle value={d.inWarranty} onChange={(v) => set("inWarranty", v)} options={[{ v: "yes", l: "داخل الضمان" }, { v: "no", l: "خارج الضمان" }]} /></Field>
        </div>)}
        {step === 2 && (<div style={{ display: "grid", gap: 16 }}>
          <Field label="نوع المشكلة" error={err.issueType}><Chips value={d.issueType} onChange={(v) => set("issueType", v)} options={ISSUES} /></Field>
          <Field label="وصف العطل بالتفصيل" error={err.desc}><textarea value={d.desc} onChange={(e) => set("desc", e.target.value)} rows={4} placeholder="اوصف المشكلة مع المنتج..." style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: `1.5px solid ${err.desc ? C.danger : C.line}`, fontSize: 15, resize: "vertical", lineHeight: 1.7 }} /></Field>
          {can("intake", "photo") && <Field label="إرفاق صورة (اختياري)"><button type="button" className="ek-btn" onClick={() => set("hasPhoto", !d.hasPhoto)} style={{ width: "100%", padding: 14, borderRadius: 12, border: `1.5px dashed ${d.hasPhoto ? C.primary : C.line}`, background: d.hasPhoto ? C.tint : C.bg, color: d.hasPhoto ? C.primaryDark : C.muted, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer", fontWeight: 600 }}>{d.hasPhoto ? <><Check size={18} /> تم إرفاق صورة</> : <><Camera size={18} /> اضغط لإضافة صورة</>}</button></Field>}
        </div>)}
      </div>
      {apiErr && <ErrBox>{apiErr}</ErrBox>}
      <NavBtns step={step} onBack={() => setStep((s) => s - 1)} onNext={() => { if (validate(step)) setStep((s) => s + 1); }} onSubmit={submit} isLast={step === 2} lastLabel={saving ? "...جاري الحفظ" : "تسجيل الطلب"} lastIcon={Check} busy={saving} locked={step === 2 && !can("intake", "submit")} />
    </Panel>
  );
}

/* ===================== استعلام ===================== */
function Inquiry() {
  const { can } = useAuth();
  const [q, setQ] = useState("");
  const [res, setRes] = useState(undefined);
  const [loading, setLoading] = useState(false);
  const search = async () => {
    if (!q.trim()) return; setLoading(true); setRes(undefined);
    try { const rows = await sbRpc("ectra_lookup_service", { p_code: q.trim() }); setRes(rows && rows.length ? rows[0] : null); }
    catch { setRes(null); } finally { setLoading(false); }
  };
  return (
    <Panel side="استعلام عن صيانة" sideDesc="اكتب رقم الطلب لمتابعة مرحلة الصيانة الحالية." sideIcon={Search}>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <Input value={q} onChange={setQ} placeholder="MTC-EK-XXXXX" mono />
        <button onClick={search} disabled={!can("inquiry", "search")} className="ek-btn" style={{ padding: "0 18px", borderRadius: 12, border: "none", background: can("inquiry", "search") ? C.primary : C.field, color: can("inquiry", "search") ? "#fff" : C.muted, fontWeight: 700, fontSize: 14.5, cursor: can("inquiry", "search") ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>{loading ? <Loader2 size={17} className="spin" /> : <Search size={17} />} بحث</button>
      </div>
      <Note small>للتجربة: استخدم رقم <strong>MTC-EK-10001</strong> أو أي رقم سجّلته من شاشة استلام صيانة.</Note>
      {res === null && (<div className="ek-fade" style={{ textAlign: "center", padding: "26px 0", color: C.muted }}><FileText size={34} color={C.line} style={{ marginBottom: 10 }} /><div style={{ fontWeight: 700, color: C.ink }}>لا يوجد طلب بهذا الرقم</div><div style={{ fontSize: 13.5, marginTop: 4 }}>راجع رقم الطلب وحاول تاني.</div></div>)}
      {res && (
        <div className="ek-fade" style={{ marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, padding: "14px 16px", background: C.bg, borderRadius: 14 }}>
            <div><div style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>رقم الطلب</div><div style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, color: C.primary, fontSize: 16 }}>{res.code}</div></div>
            <div style={{ textAlign: "left" }}><div style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>المنتج</div><div style={{ fontWeight: 700, fontSize: 14 }}>{res.model}</div></div>
          </div>
          <div style={{ position: "relative", paddingRight: 8 }}>
            {STAGES.map((s, i) => {
              const dn = i < res.stage, cur = i === res.stage;
              return (<div key={s} style={{ display: "flex", gap: 12, alignItems: "flex-start", paddingBottom: i < STAGES.length - 1 ? 22 : 0, position: "relative" }}>
                {i < STAGES.length - 1 && <div style={{ position: "absolute", top: 26, right: 12, bottom: 0, width: 2, background: dn ? C.ink : C.line }} />}
                <div style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center", background: dn ? C.ink : cur ? C.primary : C.field, color: dn || cur ? "#fff" : C.muted, zIndex: 1, boxShadow: cur ? `0 0 0 4px ${C.primary}33` : "none" }}>{dn ? <Check size={14} /> : <span style={{ fontSize: 11, fontWeight: 700 }}>{i + 1}</span>}</div>
                <div style={{ paddingTop: 2 }}><div style={{ fontWeight: cur ? 800 : 700, fontSize: 14.5, color: dn || cur ? C.ink : C.muted }}>{s}</div>{cur && <div style={{ fontSize: 12.5, color: C.primary, fontWeight: 600, marginTop: 2 }}>المرحلة الحالية</div>}</div>
              </div>);
            })}
          </div>
          {can("inquiry", "contact") && <a href={`https://wa.me/${WA_MTC}?text=${encodeURIComponent("متابعة طلب صيانة رقم: " + res.code)}`} target="_blank" rel="noreferrer" className="ek-btn" style={{ ...btnPrimary(), marginTop: 20 }}><MessageCircle size={18} /> تواصل مع المركز</a>}
        </div>
      )}
    </Panel>
  );
}

/* ===================== إدارة الصيانة ===================== */
function ServicesView() {
  const { can, me } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("active");
  const [sel, setSel] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  const load = async () => {
    setLoading(true); setErr("");
    try { setItems(await sbRpc("ectra_service_list", { p_token: me.token })); }
    catch (ex) { setErr("تعذّر تحميل طلبات الصيانة: " + String(ex).slice(0, 120)); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const LAST = STAGES.length - 1;
  const counts = STAGES.map((_, i) => items.filter((t) => t.stage === i).length);
  const activeCount = items.filter((t) => t.stage < LAST).length;
  const inFilter = (t) => filter === "all" ? true : filter === "active" ? t.stage < LAST : t.stage === filter;
  const term = q.trim().toLowerCase();
  const list = items.filter((t) =>
    inFilter(t) &&
    (!term || [t.code, t.customer_name, t.phone, t.model, t.serial].some((x) => String(x || "").toLowerCase().includes(term)))
  );
  const waPhone = (ph) => "2" + String(ph || "").replace(/\D/g, "");

  const removeTicket = async (id) => {
    try { await sbRpc("ectra_service_delete", { p_token: me.token, p_id: id }); setConfirmId(null); await load(); }
    catch (ex) { alert("خطأ: " + String(ex).slice(0, 150)); }
  };

  return (
    <div className="ek-fade">
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ fontWeight: 800, fontSize: 18, display: "flex", alignItems: "center", gap: 8 }}>
          <ClipboardList size={20} color={C.primary} /> إدارة الصيانة <span style={{ color: C.muted, fontWeight: 700, fontSize: 13 }}>({items.length})</span>
        </div>
        <div style={{ display: "flex", gap: 8, flex: "1 1 260px", maxWidth: 400 }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search size={16} color={C.muted} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)" }} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث برقم الطلب / الاسم / الموبايل"
              style={{ width: "100%", padding: "11px 38px 11px 12px", borderRadius: 12, border: `1.5px solid ${C.line}`, background: C.field, color: C.ink, fontSize: 14 }} />
          </div>
          <button onClick={load} className="ek-btn" title="تحديث" style={{ ...iconBtnStyle(), color: C.ink }}><RefreshCw size={16} /></button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        <StageChip active={filter === "active"} onClick={() => setFilter("active")} label="النشطة" count={activeCount} />
        {STAGES.map((s, i) => <StageChip key={s} active={filter === i} onClick={() => setFilter(i)} label={s} count={counts[i]} />)}
        <StageChip active={filter === "all"} onClick={() => setFilter("all")} label="الكل" count={items.length} />
      </div>

      {err && <ErrBox>{err}</ErrBox>}

      {loading ? <Center><Loader2 size={26} className="spin" color={C.primary} /></Center> : (
        <div style={{ display: "grid", gap: 10 }}>
          {list.map((t) => (
            <div key={t.id} style={{ ...rowCard(), flexDirection: "column", alignItems: "stretch", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, color: C.primary, fontSize: 14.5 }}>{t.code}</span>
                    <StageBadge idx={t.stage} />
                    {!t.in_warranty && <span style={{ fontSize: 10.5, fontWeight: 700, color: C.muted, background: C.field, padding: "2px 8px", borderRadius: 20 }}>خارج الضمان</span>}
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 14.5, marginTop: 6 }}>{t.customer_name} <span style={{ fontWeight: 700, color: C.muted, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12.5 }}>· {t.phone}</span></div>
                  <div style={{ fontSize: 12.5, color: C.muted, marginTop: 2 }}>{t.model}{t.serial ? " · SN " + t.serial : ""} · {t.issue_type || "—"}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{String(t.created_at || "").slice(0, 10)}{t.notes ? " · فيه ملاحظات" : ""}</div>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <a href={`https://wa.me/${waPhone(t.phone)}`} target="_blank" rel="noreferrer" className="ek-btn" title="واتساب العميل" style={{ ...iconBtnStyle(), color: "#1E7B36", textDecoration: "none" }}><MessageCircle size={16} /></a>
                  {(can("services", "update") || true) && <IconBtn onClick={() => setSel(t)} icon={Pencil} />}
                  {can("services", "delete") && (confirmId === t.id
                    ? <button onClick={() => removeTicket(t.id)} className="ek-btn" style={{ ...iconBtnStyle(), width: "auto", padding: "0 12px", background: C.danger, color: "#fff", borderColor: C.danger, fontWeight: 700, fontSize: 12.5 }}>تأكيد</button>
                    : <IconBtn onClick={() => setConfirmId(t.id)} icon={Trash2} danger />)}
                </div>
              </div>
              {can("services", "update") && t.stage < STAGES.length - 1 && (
                <button onClick={() => setSel({ ...t, _advance: true })} className="ek-btn"
                  style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, border: "none", background: C.tint, color: C.primaryDark, fontWeight: 800, fontSize: 12.5, cursor: "pointer" }}>
                  نقل لـ «{STAGES[t.stage + 1]}» <ChevronLeft size={15} />
                </button>
              )}
            </div>
          ))}
          {!list.length && <Empty>لا توجد طلبات{filter === "active" ? " نشطة" : typeof filter === "number" ? " في هذه المرحلة" : " بعد"}</Empty>}
        </div>
      )}

      {sel && <ServiceEditor ticket={sel} token={me.token} canUpdate={can("services", "update")} onClose={() => setSel(null)} onSaved={async () => { setSel(null); await load(); }} />}
    </div>
  );
}

function StageChip({ active, onClick, label, count }) {
  return <button onClick={onClick} className="ek-btn" style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 13px", borderRadius: 20, border: `1.5px solid ${active ? C.primary : C.line}`, background: active ? C.primary : C.surface, color: active ? "#fff" : C.ink, fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>
    {label} <span style={{ fontSize: 11, fontWeight: 800, padding: "1px 7px", borderRadius: 10, background: active ? "rgba(255,255,255,0.25)" : C.field, color: active ? "#fff" : C.muted }}>{count}</span>
  </button>;
}
function StageBadge({ idx }) {
  const done = idx >= STAGES.length - 1;
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, background: done ? "#1E7B36" : C.ink, color: "#fff", fontSize: 11, fontWeight: 700 }}>
    {done ? <Check size={12} color="#fff" /> : <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.primary, display: "inline-block" }} />}
    {STAGES[idx] || "—"}
  </span>;
}
function ServiceEditor({ ticket, token, canUpdate, onClose, onSaved }) {
  const [stage, setStage] = useState(ticket._advance ? Math.min(ticket.stage + 1, STAGES.length - 1) : ticket.stage);
  const [notes, setNotes] = useState(ticket.notes || "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const save = async () => {
    setBusy(true); setErr("");
    try { await sbRpc("ectra_service_update", { p_token: token, p_id: ticket.id, p_stage: stage, p_notes: nz(notes.trim()) }); await onSaved(); }
    catch (ex) { setErr("تعذّر الحفظ: " + String(ex).slice(0, 140)); setBusy(false); }
  };
  return (
    <Modal title={`طلب ${ticket.code}`} onClose={onClose} wide>
      <div style={{ display: "grid", gap: 14 }}>
        <div style={{ background: C.bg, borderRadius: 14, padding: "12px 16px" }}>
          <Row k="العميل" v={ticket.customer_name} />
          <Row k="الموبايل" v={ticket.phone} />
          {ticket.governorate && <Row k="المحافظة" v={ticket.governorate} />}
          <Row k="المنتج" v={ticket.model} />
          {ticket.serial && <Row k="الرقم التسلسلي" v={ticket.serial} />}
          <Row k="نوع العطل" v={ticket.issue_type || "—"} />
          <Row k="الضمان" v={ticket.in_warranty ? "داخل الضمان" : "خارج الضمان"} />
          <Row k="تاريخ الاستلام" v={String(ticket.created_at || "").slice(0, 10)} last />
        </div>
        {ticket.description && <div><div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>وصف العطل</div><div style={{ fontSize: 13.5, color: C.inkSoft, lineHeight: 1.8, background: C.field, borderRadius: 12, padding: "10px 14px" }}>{ticket.description}</div></div>}

        <div>
          <div style={{ fontSize: 13.5, fontWeight: 800, marginBottom: 8 }}>المرحلة الحالية</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {STAGES.map((s, i) => {
              const on = stage === i;
              return <button key={s} type="button" disabled={!canUpdate} onClick={() => setStage(i)} className="ek-btn"
                style={{ flex: "1 1 calc(50% - 6px)", minWidth: 132, padding: "11px 10px", borderRadius: 12, border: `1.5px solid ${on ? C.primary : C.line}`, background: on ? C.primary : C.surface, color: on ? "#fff" : C.ink, fontWeight: 700, fontSize: 13, cursor: canUpdate ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                <span style={{ width: 20, height: 20, borderRadius: "50%", display: "grid", placeItems: "center", background: on ? "rgba(255,255,255,0.25)" : C.field, color: on ? "#fff" : C.muted, fontSize: 11, fontWeight: 800 }}>{i + 1}</span>{s}
              </button>;
            })}
          </div>
        </div>

        <Field label="ملاحظات الفني (داخلية)"><textarea value={notes} onChange={(e) => setNotes(e.target.value)} disabled={!canUpdate} rows={4} placeholder="ملاحظات عن الفحص / الإصلاح / قطع الغيار المطلوبة..." style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: `1.5px solid ${C.line}`, background: C.field, color: C.ink, fontSize: 14.5, resize: "vertical", lineHeight: 1.8 }} /></Field>
        {err && <ErrBox>{err}</ErrBox>}
      </div>
      {canUpdate
        ? <ModalActions onCancel={onClose} onSave={save} busy={busy} />
        : <div style={{ marginTop: 18, textAlign: "center", fontSize: 13, color: C.muted }}>عرض فقط — لا تملك صلاحية التعديل</div>}
    </Modal>
  );
}

/* ===================== أدوات مشتركة لقاعدة البيانات ===================== */
function ekErrMsg(ex) {
  const m = String(ex || "");
  if (m.includes("barcode_exists")) return "الباركود مستخدم مع صنف آخر";
  if (m.includes("name_exists")) return "الاسم موجود بالفعل";
  if (m.includes("name_required")) return "الاسم مطلوب";
  if (m.includes("serial_not_registered")) return "السيريال غير مسجّل في قاعدة البيانات — لا يمكن إصدار ضمان له";
  if (m.includes("not_your_warranty")) return "لا يمكنك حذف ضمان لم تُصدره نقطة بيعك";
  if (m.includes("serial_belongs_other_pos")) return "هذا السيريال مُسلَّم لنقطة بيع أخرى — لا يمكنك إصدار ضمان له";
  if (m.includes("serial_not_yours")) return "هذا السيريال غير مُسلَّم لنقطة بيعك — لا يمكنك إصدار ضمان له";
  if (m.includes("serial_delivered_to_pos")) return "هذا السيريال تم تسليمه لنقطة بيع — لا يمكن إصدار ضمان له";
  if (m.includes("serial_has_warranty")) { const mt = m.match(/serial_has_warranty:([A-Za-z0-9\-]+)/); return mt ? `هذا المنتج له شهادة ضمان بالفعل (${mt[1]}) — لا يمكن إصدار شهادة أخرى لنفس السيريال` : "هذا المنتج له شهادة ضمان بالفعل — لا يمكن إصدار شهادة أخرى لنفس السيريال"; }
  if (m.includes("item_not_found")) return "الصنف غير موجود";
  if (m.includes("username_exists")) return "اسم المستخدم مستخدم بالفعل";
  if (m.includes("email_exists")) return "البريد الإلكتروني مستخدم بالفعل";
  if (m.includes("username_required")) return "اسم المستخدم مطلوب";
  if (m.includes("password_required")) return "كلمة السر مطلوبة";
  if (m.includes("pos_has_orders")) return "لا يمكن حذف نقطة البيع لوجود أوامر تسليم مرتبطة بها";
  if (m.includes("pos_required")) return "اختر نقطة البيع";
  if (m.includes("no_items") || m.includes("no_serials")) return "أضف صنف وسيريالات على الأقل";
  { const a = m.match(/serial_already_delivered:([^"\\]+)/); if (a) return `السيريال (${a[1].trim()}) تم تسليمه بالفعل في أمر آخر`; }
  { const b = m.match(/serial_not_found:([^"\\]+)/); if (b) return `السيريال (${b[1].trim()}) غير مسجّل لهذا الصنف`; }
  if (m.includes("unauthorized")) return "لا تملك صلاحية لهذا الإجراء";
  return "حدث خطأ: " + m.slice(0, 120);
}
const ekSelectStyle = { width: "100%", padding: "12px 14px", borderRadius: 12, border: `1.5px solid ${C.line}`, background: C.field, color: C.ink, fontSize: 15, fontFamily: "inherit" };

/* ماسح باركود — كاميرا الموبايل + سكانر USB (كيبورد) + إدخال يدوي */
function ScannerModal({ onClose, onResult }) {
  const [err, setErr] = useState("");
  const [manual, setManual] = useState("");
  const regionId = "ek-qr-region";
  const scannerRef = useRef(null);
  useEffect(() => {
    let stopped = false; let html5Qr = null;
    (async () => {
      try {
        const mod = await import("html5-qrcode");
        const { Html5Qrcode } = mod;
        html5Qr = new Html5Qrcode(regionId, { verbose: false });
        scannerRef.current = html5Qr;
        await html5Qr.start({ facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 160 }, useBarCodeDetectorIfSupported: true, aspectRatio: 1.4 },
          (decoded) => { if (stopped) return; stopped = true; try { html5Qr.stop().catch(() => {}); } catch {} onResult(String(decoded).trim()); }, () => {});
      } catch (e) { setErr("تعذّر تشغيل الكاميرا. اسمح بالوصول للكاميرا، أو استخدم سكانر الباركود أو الإدخال اليدوي."); }
    })();
    return () => { stopped = true; const s = scannerRef.current; if (s) { try { s.stop().then(() => s.clear()).catch(() => {}); } catch {} } };
  }, [onResult]);
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(20,20,20,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 18 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", width: "100%", maxWidth: 420, borderRadius: 22, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.35)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: `1px solid ${C.line}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, fontSize: 15 }}><Camera size={18} color={C.primary} /> مسح الباركود</div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", border: "none", background: C.bg, cursor: "pointer", display: "grid", placeItems: "center" }}><X size={16} /></button>
        </div>
        <div style={{ padding: 16 }}>
          <div id={regionId} style={{ width: "100%", borderRadius: 14, overflow: "hidden", background: "#000", minHeight: 200 }} />
          {err && <div style={{ marginTop: 12, padding: "10px 12px", background: "#FDECEC", color: C.danger, borderRadius: 10, fontSize: 12.5, fontWeight: 600, lineHeight: 1.6 }}>{err}</div>}
          <div style={{ fontSize: 12, color: C.muted, textAlign: "center", marginTop: 10 }}>وجّه الكاميرا للباركود — أو استخدم سكانر الباركود مباشرةً</div>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <Input value={manual} onChange={setManual} placeholder="أو أدخل الرقم يدوياً" mono />
            <button onClick={() => manual.trim() && onResult(manual.trim())} className="ek-btn" style={{ padding: "0 16px", borderRadius: 12, border: "none", background: C.ink, color: "#fff", fontWeight: 700, fontSize: 14, whiteSpace: "nowrap" }}>تأكيد</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===================== قاعدة البيانات: الأصناف ===================== */
function CatalogView() {
  const { can, me } = useAuth();
  const [items, setItems] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [secFilter, setSecFilter] = useState("all");
  const [editor, setEditor] = useState(null);
  const [unitsFor, setUnitsFor] = useState(null);
  const [showSections, setShowSections] = useState(false);

  const load = async () => {
    setLoading(true); setErr("");
    try {
      const [it, sc] = await Promise.all([
        sbRpc("ectra_item_list", { p_token: me.token }),
        sbRpc("ectra_section_list", { p_token: me.token }),
      ]);
      setItems(it || []); setSections(sc || []);
    } catch (ex) { setErr(ekErrMsg(ex)); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const term = q.trim().toLowerCase();
  const list = items.filter((i) =>
    (secFilter === "all" || i.section_id === secFilter) &&
    (!term || [i.name, i.barcode, i.model].some((x) => String(x || "").toLowerCase().includes(term)))
  );
  const totalUnits = items.reduce((s, i) => s + Number(i.units || 0), 0);

  const removeItem = async (i) => {
    if (!window.confirm(`حذف الصنف «${i.name}» هيمسح كمان ${Number(i.units || 0)} سيريال. متأكد؟`)) return;
    try { await sbRpc("ectra_item_delete", { p_token: me.token, p_id: i.id }); await load(); }
    catch (ex) { alert(ekErrMsg(ex)); }
  };

  return (
    <div className="ek-fade">
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ fontWeight: 800, fontSize: 18, display: "flex", alignItems: "center", gap: 8 }}>
          <Database size={20} color={C.primary} /> قاعدة البيانات
          <span style={{ color: C.muted, fontWeight: 700, fontSize: 13 }}>({items.length} صنف · {totalUnits} وحدة)</span>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <SmallBtn onClick={() => setShowSections(true)} icon={Layers} ghost>الأقسام</SmallBtn>
          {can("products", "add") && <SmallBtn onClick={() => setEditor({ name: "", barcode: "", section_id: sections[0]?.id || null })} icon={Plus}>إضافة صنف</SmallBtn>}
        </div>
      </div>

      <div style={{ position: "relative", marginBottom: 12 }}>
        <Search size={16} color={C.muted} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)" }} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث باسم الصنف أو الباركود" style={{ width: "100%", padding: "11px 38px 11px 12px", borderRadius: 12, border: `1.5px solid ${C.line}`, background: C.field, color: C.ink, fontSize: 14 }} />
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        <StageChip active={secFilter === "all"} onClick={() => setSecFilter("all")} label="الكل" count={items.length} />
        {sections.map((s) => <StageChip key={s.id} active={secFilter === s.id} onClick={() => setSecFilter(s.id)} label={s.name} count={Number(s.items || 0)} />)}
      </div>

      {err && <ErrBox>{err}</ErrBox>}
      {loading ? <Center><Loader2 size={26} className="spin" color={C.primary} /></Center> : (
        <div style={{ display: "grid", gap: 10 }}>
          {list.map((i) => (
            <div key={i.id} style={{ ...rowCard() }}>
              <div onClick={() => setUnitsFor(i)} style={{ minWidth: 0, flex: 1, cursor: "pointer" }}>
                <div style={{ fontWeight: 800, fontSize: 15 }}>{i.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                  {i.model && <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: C.ink, fontWeight: 600 }}>{i.model}</span>}
                  {i.barcode && <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11.5, color: C.muted }}>باركود: {i.barcode}</span>}
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.primary, background: C.tint, padding: "2px 9px", borderRadius: 20 }}>{Number(i.units || 0)} وحدة</span>
                  {i.section_name && <span style={{ fontSize: 11, color: C.muted }}>{i.section_name}</span>}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button onClick={() => setUnitsFor(i)} className="ek-btn" title="السيريالات" style={{ ...iconBtnStyle(), color: C.ink }}><ListPlus size={16} /></button>
                {can("products", "edit") && <IconBtn onClick={() => setEditor(i)} icon={Pencil} />}
                {can("products", "delete") && <IconBtn onClick={() => removeItem(i)} icon={Trash2} danger />}
              </div>
            </div>
          ))}
          {!list.length && <Empty>لا توجد أصناف</Empty>}
        </div>
      )}

      {editor && <ItemEditor item={editor} sections={sections} token={me.token} onClose={() => setEditor(null)} onSaved={async () => { setEditor(null); await load(); }} />}
      {unitsFor && <UnitsModal item={unitsFor} token={me.token} canEdit={can("products", "add")} canDelete={can("products", "delete")} onClose={() => setUnitsFor(null)} onChanged={load} />}
      {showSections && <SectionsModal sections={sections} token={me.token} canEdit={can("products", "add")} canDelete={can("products", "delete")} onClose={() => setShowSections(false)} onChanged={load} />}
    </div>
  );
}

function ItemEditor({ item, sections, token, onClose, onSaved }) {
  const [name, setName] = useState(item.name || "");
  const [barcode, setBarcode] = useState(item.barcode || "");
  const [model, setModel] = useState(item.model || "");
  const [sectionId, setSectionId] = useState(item.section_id || (sections[0]?.id || ""));
  const [scan, setScan] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const save = async () => {
    if (!name.trim()) { setErr("اكتب اسم الصنف"); return; }
    setBusy(true); setErr("");
    try { await sbRpc("ectra_item_save", { p_token: token, p_id: item.id || null, p_section_id: sectionId || null, p_name: name.trim(), p_model: nz(model.trim()), p_barcode: nz(barcode.trim()) }); await onSaved(); }
    catch (ex) { setErr(ekErrMsg(ex)); setBusy(false); }
  };
  return (
    <Modal title={item.id ? "تعديل صنف" : "صنف جديد"} onClose={onClose}>
      <div style={{ display: "grid", gap: 14 }}>
        <Field label="اسم الصنف"><Input value={name} onChange={setName} placeholder="مثال: Earbuds Echo — أسود" /></Field>
        <Field label="رقم الموديل"><Input value={model} onChange={setModel} placeholder="مثال: ETW-230B" mono /></Field>
        <Field label="الباركود">
          <div style={{ display: "flex", gap: 8 }}>
            <Input value={barcode} onChange={setBarcode} placeholder="الباركود الحقيقي — يدوي أو بالماسح/الكاميرا" mono />
            <button onClick={() => setScan(true)} className="ek-btn" title="مسح" style={{ ...iconBtnStyle(), color: C.primary, width: 46, flexShrink: 0 }}><Camera size={18} /></button>
          </div>
        </Field>
        <Field label="القسم">
          <select value={sectionId || ""} onChange={(e) => setSectionId(e.target.value)} style={ekSelectStyle}>
            <option value="">— بدون قسم —</option>
            {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </Field>
        {err && <ErrBox>{err}</ErrBox>}
      </div>
      <ModalActions onCancel={onClose} onSave={save} busy={busy} />
      {scan && <ScannerModal onClose={() => setScan(false)} onResult={(v) => { setBarcode(v); setScan(false); }} />}
    </Modal>
  );
}

function UnitsModal({ item, token, canEdit, canDelete, onClose, onChanged }) {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [bulk, setBulk] = useState("");
  const [scan, setScan] = useState(false);
  const [gen, setGen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try { setUnits(await sbRpc("ectra_unit_list", { p_token: token, p_item_id: item.id }) || []); }
    catch (ex) { setMsg(ekErrMsg(ex)); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const addSerials = async (arr) => {
    const serials = (arr || []).map((s) => String(s).trim()).filter(Boolean);
    if (!serials.length) return;
    setBusy(true); setMsg("");
    try {
      const r = await sbRpc("ectra_unit_add_bulk", { p_token: token, p_item_id: item.id, p_serials: serials });
      const res = Array.isArray(r) ? r[0] : r;
      setMsg(`تمت إضافة ${res?.added || 0} سيريال` + (res?.skipped ? ` · تجاهلنا ${res.skipped} (مكرر/موجود)` : ""));
      setBulk(""); await load(); await onChanged?.();
    } catch (ex) { setMsg(ekErrMsg(ex)); } finally { setBusy(false); }
  };

  const onImport = async (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    try {
      const data = await f.arrayBuffer();
      const wb = XLSX.read(data); const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
      const serials = rows.flat().map((x) => String(x ?? "").trim()).filter(Boolean)
        .filter((s) => !/^(serial|سيريال|الرقم المسلسل|رقم مسلسل|كود)$/i.test(s));
      await addSerials(serials);
    } catch (ex) { setMsg("تعذّر قراءة الملف: " + String(ex).slice(0, 100)); }
    finally { if (fileRef.current) fileRef.current.value = ""; }
  };

  const del = async (id) => { try { await sbRpc("ectra_unit_delete", { p_token: token, p_id: id }); await load(); await onChanged?.(); } catch (ex) { alert(ekErrMsg(ex)); } };

  const term = q.trim().toLowerCase();
  const list = units.filter((u) => !term || String(u.serial).toLowerCase().includes(term));

  return (
    <Modal title={`سيريالات: ${item.name}`} onClose={onClose} wide>
      <div style={{ display: "grid", gap: 14 }}>
        {canEdit && (
          <div style={{ background: C.bg, borderRadius: 14, padding: 14, display: "grid", gap: 10 }}>
            <div style={{ fontSize: 13.5, fontWeight: 800 }}>إضافة سيريالات</div>
            <textarea value={bulk} onChange={(e) => setBulk(e.target.value)} rows={3} placeholder="الصق السيريالات (كل سطر = سيريال)، أو استخدم الماسح/الاستيراد" style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${C.line}`, background: "#fff", color: C.ink, fontSize: 13.5, fontFamily: "'IBM Plex Mono', monospace", resize: "vertical" }} />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <SmallBtn onClick={() => addSerials(bulk.split(/[\n,;\t]+/))} icon={Plus} busy={busy}>إضافة</SmallBtn>
              <SmallBtn onClick={() => setScan(true)} icon={Camera} ghost>مسح/كاميرا</SmallBtn>
              <SmallBtn onClick={() => fileRef.current?.click()} icon={Upload} ghost>استيراد Excel</SmallBtn>
              <SmallBtn onClick={() => setGen(true)} icon={Hash} ghost>مولّد السيريالات</SmallBtn>
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={onImport} style={{ display: "none" }} />
            </div>
            {msg && <Note small>{msg}</Note>}
          </div>
        )}
        <div style={{ position: "relative" }}>
          <Search size={15} color={C.muted} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث في السيريالات" style={{ width: "100%", padding: "10px 36px 10px 12px", borderRadius: 10, border: `1.5px solid ${C.line}`, background: C.field, color: C.ink, fontSize: 13.5 }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div style={{ fontSize: 12.5, color: C.muted }}>{units.length} وحدة</div>
          {units.length > 0 && <SmallBtn onClick={() => setPrintOpen(true)} icon={Printer} ghost>طباعة</SmallBtn>}
        </div>
        {loading ? <Center><Loader2 size={22} className="spin" color={C.primary} /></Center> : (
          <div style={{ display: "grid", gap: 6, maxHeight: "40vh", overflow: "auto" }}>
            {list.map((u) => (
              <div key={u.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "9px 12px", background: C.field, borderRadius: 10 }}>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: C.ink }}>{u.serial}</span>
                {canDelete && <button onClick={() => del(u.id)} className="ek-btn" style={{ ...iconBtnStyle(), width: 34, height: 34, color: C.danger, borderColor: "#F5C6C6" }}><Trash2 size={14} /></button>}
              </div>
            ))}
            {!list.length && <Empty>لا توجد سيريالات</Empty>}
          </div>
        )}
      </div>
      {scan && <ScannerModal onClose={() => setScan(false)} onResult={(v) => { setScan(false); addSerials([v]); }} />}
      {gen && <SerialGenModal onClose={() => setGen(false)} onGenerate={(arr) => { setGen(false); addSerials(arr); }} />}
      {printOpen && <PrintModal item={item} serials={units} onClose={() => setPrintOpen(false)} />}
    </Modal>
  );
}

function ekGenSerials(seed, count) {
  const n = Math.max(0, Math.min(parseInt(count, 10) || 0, 5000));
  if (!n) return [];
  seed = String(seed || "").trim();
  if (!seed) { const w = String(n).length; return Array.from({ length: n }, (_, i) => String(i + 1).padStart(w, "0")); }
  const m = seed.match(/^(.*?)(\d+)(\D*)$/);
  if (!m) return Array.from({ length: n }, (_, i) => seed + String(i + 1));
  const prefix = m[1], numStr = m[2], suffix = m[3], width = numStr.length, start = parseInt(numStr, 10);
  return Array.from({ length: n }, (_, i) => { const s = String(start + i); return prefix + (s.length < width ? s.padStart(width, "0") : s) + suffix; });
}

function SerialGenModal({ onClose, onGenerate }) {
  const [count, setCount] = useState("");
  const [seed, setSeed] = useState("");
  const [preview, setPreview] = useState(null);
  const [err, setErr] = useState("");
  const make = () => {
    const n = parseInt(count, 10);
    if (!n || n < 1) { setErr("أدخل كمية صحيحة"); setPreview(null); return; }
    if (n > 5000) { setErr("الحد الأقصى 5000 سيريال في المرة"); setPreview(null); return; }
    setErr(""); setPreview(ekGenSerials(seed.trim(), n));
  };
  return (
    <Modal title="مولّد السيريالات" onClose={onClose}>
      <div style={{ display: "grid", gap: 14 }}>
        <Note small>للأصناف اللي سيريالاتها متسلسلة: أدخل الكمية والسيريال الأول (الدليل) — والباقي يتولّد بالزيادة تلقائياً مع الحفاظ على نفس التنسيق والأصفار. لو سِبت الدليل فاضي هيتولّد أرقام متسلسلة بسيطة.</Note>
        <Field label="الكمية المراد توليدها"><Input value={count} onChange={setCount} placeholder="مثال: 100" type="number" inputMode="numeric" /></Field>
        <Field label="السيريال الأول (الدليل) — اختياري"><Input value={seed} onChange={setSeed} placeholder="مثال: ECH-C22521B00001" mono /></Field>
        {err && <ErrBox>{err}</ErrBox>}
        <SmallBtn onClick={make} icon={Hash} ghost>توليد المعاينة</SmallBtn>
        {preview && (
          <div style={{ background: C.bg, borderRadius: 12, padding: 12 }}>
            <div style={{ fontSize: 12.5, fontWeight: 800, marginBottom: 8 }}>معاينة ({preview.length} سيريال)</div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: C.muted, display: "grid", gap: 3, maxHeight: 150, overflow: "auto" }}>
              {preview.slice(0, 6).map((s, i) => <div key={i}>{s}</div>)}
              {preview.length > 6 && <><div>…</div><div>{preview[preview.length - 1]}</div></>}
            </div>
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
        <button onClick={onClose} className="ek-btn" style={{ flex: 1, padding: 12, borderRadius: 12, border: `1.5px solid ${C.line}`, background: C.surface, color: C.ink, fontWeight: 700, cursor: "pointer" }}>إلغاء</button>
        <button onClick={() => preview && preview.length && onGenerate(preview)} disabled={!preview || !preview.length} className="ek-btn" style={{ flex: 1, padding: 12, borderRadius: 12, border: "none", background: preview && preview.length ? C.primary : C.line, color: "#fff", fontWeight: 800, cursor: preview && preview.length ? "pointer" : "default" }}>إضافة الكل {preview ? `(${preview.length})` : ""}</button>
      </div>
    </Modal>
  );
}

function ekEsc(s) { return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
function ekPrintSerials(item, serials, opts) {
  const { barcode = true, mode = "label", w = 50, h = 30 } = opts || {};
  const win = window.open("", "_blank");
  if (!win) { alert("اسمح بالنوافذ المنبثقة (Pop-ups) للطباعة"); return; }
  const name = ekEsc(item.name || "");
  const labels = serials.map((s) => {
    const e = ekEsc(s);
    return `<div class="lbl">${barcode ? `<svg class="bc" data-code="${e}"></svg>` : ""}<div class="txt">${e}</div>${name ? `<div class="name">${name}</div>` : ""}</div>`;
  }).join("");
  let pageCss, lblCss, body;
  if (mode === "label") {
    pageCss = `@page{ size:${w}mm ${h}mm; margin:0; }`;
    lblCss = `.lbl{ width:${w}mm; height:${h}mm; page-break-after:always; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:1.5mm; overflow:hidden; }
.lbl:last-child{ page-break-after:auto; }
.bc{ width:94%; max-height:${(h * 0.5).toFixed(1)}mm; }
.txt{ font-size:9pt; font-weight:700; font-family:monospace; letter-spacing:.3px; margin-top:.5mm; word-break:break-all; text-align:center; }
.name{ font-size:6pt; color:#444; font-family:sans-serif; margin-top:.3mm; text-align:center; }`;
    body = labels;
  } else {
    pageCss = `@page{ margin:8mm; }`;
    lblCss = `.grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:4mm; padding:4mm; }
.lbl{ border:1px solid #ccc; border-radius:6px; padding:8px 6px; text-align:center; break-inside:avoid; page-break-inside:avoid; display:flex; flex-direction:column; align-items:center; }
.bc{ width:100%; height:44px; }
.txt{ font-size:12px; font-weight:700; margin-top:3px; font-family:monospace; word-break:break-all; }
.name{ font-size:9px; color:#666; margin-top:2px; font-family:sans-serif; }`;
    body = `<div class="grid">${labels}</div>`;
  }
  const html = `<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>طباعة سيريالات</title>
<style>*{box-sizing:border-box;} html,body{margin:0;padding:0;} ${pageCss} ${lblCss}</style>
${barcode ? '<script src="https://cdnjs.cloudflare.com/ajax/libs/jsbarcode/3.11.6/JsBarcode.all.min.js"><\/script>' : ""}
</head><body>${body}
<script>
function go(){
  ${barcode ? "try{document.querySelectorAll('.bc').forEach(function(el){JsBarcode(el, el.getAttribute('data-code'), {format:'CODE128', height:" + (mode === "label" ? 38 : 40) + ", width:1.3, margin:0, displayValue:false});});}catch(e){}" : ""}
  setTimeout(function(){ window.focus(); window.print(); }, ${barcode ? 500 : 200});
}
if(document.readyState==='complete') go(); else window.addEventListener('load', go);
<\/script></body></html>`;
  win.document.open(); win.document.write(html); win.document.close();
}

function ekPrintDelivery(meta, lines) {
  const win = window.open("", "_blank");
  if (!win) { alert("اسمح بالنوافذ المنبثقة (Pop-ups) للطباعة"); return; }
  const rows = (lines || []).map((l, i) => {
    const serials = (l.serials || []).map((s) => `<span class="sn">${ekEsc(s)}</span>`).join("");
    return `<div class="item"><div class="ihead"><span class="inum">${i + 1}</span><span class="iname">${ekEsc(l.item_name)}</span><span class="iqty">الكمية: ${(l.serials || []).length}</span></div><div class="serials">${serials}</div></div>`;
  }).join("");
  const html = `<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>أمر تسليم بضاعة</title>
<style>
*{box-sizing:border-box;font-family:'Tahoma','Arial',sans-serif;}
@page{ size:A4; margin:14mm; }
body{ margin:0; color:#16181D; }
.top{ display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #16181D; padding-bottom:12px; margin-bottom:16px; }
.brand{ font-family:'Archivo',Arial,sans-serif; font-weight:900; font-size:26px; letter-spacing:1px; }
.brand .d{ color:#FF5A3C; }
.subb{ font-size:11px; color:#666; font-weight:700; margin-top:2px; }
.title{ text-align:left; }
.title h1{ margin:0; font-size:19px; }
.title .no{ font-size:11px; color:#666; margin-top:3px; font-family:monospace; }
.meta{ display:grid; grid-template-columns:1fr 1fr; gap:6px 18px; background:#F7F8FA; border:1px solid #E4E7EC; border-radius:10px; padding:12px 14px; margin-bottom:16px; font-size:13px; }
.meta b{ color:#16181D; } .meta span{ color:#555; }
.note{ font-size:12.5px; color:#555; margin-bottom:14px; }
.item{ border:1px solid #E4E7EC; border-radius:10px; padding:10px 12px; margin-bottom:10px; break-inside:avoid; }
.ihead{ display:flex; align-items:center; gap:10px; margin-bottom:8px; }
.inum{ width:22px; height:22px; border-radius:6px; background:#16181D; color:#fff; display:inline-flex; align-items:center; justify-content:center; font-size:12px; font-weight:800; }
.iname{ font-weight:800; font-size:14.5px; flex:1; }
.iqty{ font-size:12px; color:#FF5A3C; font-weight:800; }
.serials{ display:flex; flex-wrap:wrap; gap:6px; }
.sn{ font-family:monospace; font-size:11.5px; font-weight:700; background:#F4F5F7; border:1px solid #E4E7EC; border-radius:6px; padding:4px 8px; }
.total{ text-align:left; font-weight:800; font-size:14px; margin:8px 2px 22px; }
.sign{ display:flex; justify-content:space-between; margin-top:34px; gap:40px; }
.sign div{ flex:1; text-align:center; border-top:1.5px solid #999; padding-top:8px; font-size:12.5px; color:#555; }
</style></head><body>
<div class="top">
  <div><div class="brand">ECTRA<span class="d">.</span></div><div class="subb">مركز خدمة · MTC GROUP</div></div>
  <div class="title"><h1>أمر تسليم بضاعة</h1><div class="no">${ekEsc(meta.order_no || "")}</div></div>
</div>
<div class="meta">
  <div><b>نقطة البيع:</b> <span>${ekEsc(meta.pos_name || "")}</span></div>
  <div><b>التاريخ:</b> <span>${ekEsc(meta.date || "")}</span></div>
  <div><b>عدد الأصناف:</b> <span>${meta.items_count}</span></div>
  <div><b>إجمالي القطع:</b> <span>${meta.total_qty}</span></div>
  ${meta.created_by ? `<div><b>المُصدِر:</b> <span>${ekEsc(meta.created_by)}</span></div>` : ""}
</div>
${meta.note ? `<div class="note"><b>ملاحظات:</b> ${ekEsc(meta.note)}</div>` : ""}
${rows}
<div class="total">الإجمالي: ${meta.total_qty} قطعة</div>
<div class="sign"><div>توقيع المُسلِّم</div><div>توقيع المُستلِم (نقطة البيع)</div></div>
<script>function go(){ setTimeout(function(){ window.focus(); window.print(); }, 200); } if(document.readyState==='complete') go(); else window.addEventListener('load', go);<\/script>
</body></html>`;
  win.document.open(); win.document.write(html); win.document.close();
}

function PrintModal({ item, serials, onClose }) {
  const sorted = [...serials].map((u) => u.serial).sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }));
  const [from, setFrom] = useState(sorted[0] || "");
  const [to, setTo] = useState(sorted[sorted.length - 1] || "");
  const [withBarcode, setWithBarcode] = useState(true);
  const [mode, setMode] = useState("label");
  const [w, setW] = useState("50");
  const [h, setH] = useState("30");
  const bounds = () => { let i = sorted.indexOf(from), j = sorted.indexOf(to); if (i < 0) i = 0; if (j < 0) j = sorted.length - 1; if (i > j) { const t = i; i = j; j = t; } return [i, j]; };
  const [bi, bj] = bounds();
  const rangeCount = bj - bi + 1;
  const doPrint = () => { const arr = sorted.slice(bi, bj + 1); if (arr.length) ekPrintSerials(item, arr, { barcode: withBarcode, mode, w: parseFloat(w) || 50, h: parseFloat(h) || 30 }); };
  return (
    <Modal title="طباعة السيريالات" onClose={onClose}>
      <div style={{ display: "grid", gap: 14 }}>
        <Field label="نوع الطباعة">
          <select value={mode} onChange={(e) => setMode(e.target.value)} style={ekSelectStyle}>
            <option value="label">ملصق لكل سيريال (طابعة ليبل)</option>
            <option value="sheet">ورق A4 — شبكة ملصقات</option>
          </select>
        </Field>
        {mode === "label" && (
          <div style={{ display: "flex", gap: 10 }}>
            <Field label="عرض الملصق (مم)"><Input value={w} onChange={setW} type="number" inputMode="decimal" /></Field>
            <Field label="ارتفاع الملصق (مم)"><Input value={h} onChange={setH} type="number" inputMode="decimal" /></Field>
          </div>
        )}
        <div style={{ display: "flex", gap: 10 }}>
          <Field label="من سيريال"><select value={from} onChange={(e) => setFrom(e.target.value)} style={ekSelectStyle}>{sorted.map((s) => <option key={s} value={s}>{s}</option>)}</select></Field>
          <Field label="إلى سيريال"><select value={to} onChange={(e) => setTo(e.target.value)} style={ekSelectStyle}>{sorted.map((s) => <option key={s} value={s}>{s}</option>)}</select></Field>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
          <input type="checkbox" checked={withBarcode} onChange={(e) => setWithBarcode(e.target.checked)} /> طباعة بباركود قابل للمسح
        </label>
        <Note small>للطابعة BIXOLON SLP-D220 اختر «ملصق لكل سيريال» وحدّد مقاس الملصق المركّب فعلياً (مثلاً 50×30 أو 40×30 مم). كل سيريال يخرج على ملصق مستقل.</Note>
        <div style={{ fontSize: 12.5, color: C.muted }}>سيتم طباعة <b style={{ color: C.primary }}>{rangeCount}</b> سيريال</div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
        <button onClick={onClose} className="ek-btn" style={{ flex: 1, padding: 12, borderRadius: 12, border: `1.5px solid ${C.line}`, background: C.surface, color: C.ink, fontWeight: 700, cursor: "pointer" }}>إلغاء</button>
        <button onClick={doPrint} className="ek-btn" style={{ flex: 1, padding: 12, borderRadius: 12, border: "none", background: C.primary, color: "#fff", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Printer size={16} /> طباعة</button>
      </div>
    </Modal>
  );
}

function SectionsModal({ sections, token, canEdit, canDelete, onClose, onChanged }) {
  const [list, setList] = useState(sections);
  const [name, setName] = useState("");
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const reload = async () => { try { setList(await sbRpc("ectra_section_list", { p_token: token }) || []); await onChanged?.(); } catch {} };
  const add = async () => { if (!name.trim()) return; setBusy(true); setMsg(""); try { await sbRpc("ectra_section_save", { p_token: token, p_id: null, p_name: name.trim() }); setName(""); await reload(); } catch (ex) { setMsg(ekErrMsg(ex)); } finally { setBusy(false); } };
  const saveEdit = async (id) => { if (!editName.trim()) return; try { await sbRpc("ectra_section_save", { p_token: token, p_id: id, p_name: editName.trim() }); setEditId(null); await reload(); } catch (ex) { setMsg(ekErrMsg(ex)); } };
  const del = async (s) => { if (!window.confirm(`حذف قسم «${s.name}»؟ الأصناف بداخله مش هتتمسح بس هتفضل بدون قسم.`)) return; try { await sbRpc("ectra_section_delete", { p_token: token, p_id: s.id }); await reload(); } catch (ex) { alert(ekErrMsg(ex)); } };
  return (
    <Modal title="الأقسام" onClose={onClose}>
      <div style={{ display: "grid", gap: 12 }}>
        {canEdit && (
          <div style={{ display: "flex", gap: 8 }}>
            <Input value={name} onChange={setName} placeholder="اسم قسم جديد" />
            <SmallBtn onClick={add} icon={Plus} busy={busy}>إضافة</SmallBtn>
          </div>
        )}
        {msg && <ErrBox>{msg}</ErrBox>}
        <div style={{ display: "grid", gap: 6 }}>
          {list.map((s) => (
            <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "10px 12px", background: C.field, borderRadius: 10 }}>
              {editId === s.id ? (
                <input value={editName} onChange={(e) => setEditName(e.target.value)} style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: `1.5px solid ${C.line}`, background: "#fff", color: C.ink, fontSize: 14 }} />
              ) : (
                <div><span style={{ fontWeight: 700, fontSize: 14 }}>{s.name}</span><span style={{ fontSize: 11.5, color: C.muted }}> · {Number(s.items || 0)} صنف</span></div>
              )}
              <div style={{ display: "flex", gap: 6 }}>
                {editId === s.id
                  ? <><button onClick={() => saveEdit(s.id)} className="ek-btn" style={{ ...iconBtnStyle(), width: 34, height: 34, color: "#1E7B36" }}><Check size={15} /></button><button onClick={() => setEditId(null)} className="ek-btn" style={{ ...iconBtnStyle(), width: 34, height: 34 }}><X size={15} /></button></>
                  : <>{canEdit && <button onClick={() => { setEditId(s.id); setEditName(s.name); }} className="ek-btn" style={{ ...iconBtnStyle(), width: 34, height: 34 }}><Pencil size={14} /></button>}
                    {canDelete && <button onClick={() => del(s)} className="ek-btn" style={{ ...iconBtnStyle(), width: 34, height: 34, color: C.danger, borderColor: "#F5C6C6" }}><Trash2 size={14} /></button>}</>}
              </div>
            </div>
          ))}
          {!list.length && <Empty>لا توجد أقسام</Empty>}
        </div>
      </div>
    </Modal>
  );
}

/* ===================== قائمة الضمانات ===================== */
const WARR_PER_PAGE = 20;
function WarrantiesView({ onIssue }) {
  const { me, can } = useAuth();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [qDeb, setQDeb] = useState("");
  const [edit, setEdit] = useState(null);

  // بحث على مستوى القاعدة (مع تأخير بسيط) + رجوع لأول صفحة
  useEffect(() => { const t = setTimeout(() => { setQDeb(q.trim()); setPage(0); }, 350); return () => clearTimeout(t); }, [q]);

  const load = async () => {
    setLoading(true); setErr("");
    try {
      const data = await sbRpc("ectra_warranty_page", { p_token: me.token, p_limit: WARR_PER_PAGE, p_offset: page * WARR_PER_PAGE, p_search: qDeb || null }) || [];
      const arr = Array.isArray(data) ? data : [];
      if (!arr.length && page > 0) { setPage((p) => p - 1); return; } // صفحة بقت فاضية بعد حذف
      setItems(arr);
      setTotal(arr.length ? Number(arr[0].total) : 0);
    } catch (ex) { setErr(ekErrMsg(ex)); setItems([]); setTotal(0); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [page, qDeb]);

  const del = async (w) => { if (!window.confirm(`حذف شهادة الضمان ${w.cert_no}؟ لا يمكن التراجع.`)) return; try { await sbRpc("ectra_warranty_delete", { p_token: me.token, p_cert_no: w.cert_no }); await load(); } catch (ex) { alert(ekErrMsg(ex)); } };
  const today = new Date().toISOString().slice(0, 10);
  const pages = Math.max(1, Math.ceil(total / WARR_PER_PAGE));
  const list = items;
  return (
    <div className="ek-fade">
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ fontWeight: 800, fontSize: 18, display: "flex", alignItems: "center", gap: 8 }}><Award size={20} color={C.primary} /> قائمة الضمانات <span style={{ color: C.muted, fontWeight: 700, fontSize: 13 }}>({total})</span></div>
        {onIssue && <SmallBtn onClick={onIssue} icon={Plus}>إصدار ضمان</SmallBtn>}
      </div>
      <div style={{ position: "relative", marginBottom: 14 }}>
        <Search size={16} color={C.muted} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)" }} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث برقم الشهادة / العميل / السيريال" style={{ width: "100%", padding: "11px 38px 11px 12px", borderRadius: 12, border: `1.5px solid ${C.line}`, background: C.field, color: C.ink, fontSize: 14 }} />
      </div>
      {err && <ErrBox>{err}</ErrBox>}
      {loading ? <Center><Loader2 size={26} className="spin" color={C.primary} /></Center> : (
        <div style={{ display: "grid", gap: 10 }}>
          {list.map((w, idx) => {
            const active = w.end_date && w.end_date >= today;
            return (
              <div key={w.cert_no || idx} style={{ ...rowCard() }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, color: C.primary, fontSize: 14 }}>{w.cert_no}</span>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: "#fff", background: active ? "#1E7B36" : C.muted, padding: "2px 9px", borderRadius: 20 }}>{active ? "ساري" : "منتهي"}</span>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 14.5, marginTop: 5 }}>{w.customer_name}{w.whatsapp ? <span style={{ fontWeight: 700, color: C.muted, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12.5 }}> · {w.whatsapp}</span> : null}</div>
                  <div style={{ fontSize: 12.5, color: C.muted, marginTop: 2 }}>{w.model} · SN {w.serial}</div>
                  {w.sold_by && <div style={{ fontSize: 11.5, marginTop: 3, display: "inline-flex", alignItems: "center", gap: 4, color: C.primaryDark, fontWeight: 700 }}><ShieldCheck size={12} /> نقطة بيع: {w.sold_by}</div>}
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2, fontFamily: "'IBM Plex Mono', monospace", direction: "ltr", textAlign: "right" }}>{w.start_date} → {w.end_date}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                  {w.whatsapp && <a href={`https://wa.me/2${String(w.whatsapp).replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="ek-btn" title="واتساب" style={{ ...iconBtnStyle(), color: "#1E7B36", textDecoration: "none" }}><MessageCircle size={16} /></a>}
                  {can("warranties", "edit") && <IconBtn onClick={() => setEdit(w)} icon={Pencil} title="تعديل" />}
                  {can("warranties", "delete") && <IconBtn onClick={() => del(w)} icon={Trash2} danger title="حذف" />}
                </div>
              </div>
            );
          })}
          {!list.length && <Empty>{qDeb ? "لا توجد نتائج مطابقة للبحث" : "لا توجد ضمانات مُصدَرة"}</Empty>}
        </div>
      )}
      {!loading && pages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 16 }}>
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="ek-btn" style={warrPager(page === 0)}>السابق</button>
          <span style={{ fontSize: 13, color: C.muted, fontWeight: 700 }}>{page + 1} / {pages}</span>
          <button onClick={() => setPage((p) => Math.min(pages - 1, p + 1))} disabled={page >= pages - 1} className="ek-btn" style={warrPager(page >= pages - 1)}>التالي</button>
        </div>
      )}
      {edit && <EditWarrantyModal warranty={edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); load(); }} />}
    </div>
  );
}
const warrPager = (disabled) => ({ padding: "9px 16px", borderRadius: 10, border: `1.5px solid ${C.line}`, background: C.surface, color: disabled ? C.muted : C.ink, fontWeight: 700, fontSize: 13.5, cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.5 : 1 });

function EditWarrantyModal({ warranty, onClose, onSaved }) {
  const { me } = useAuth();
  const [d, setD] = useState({
    name: warranty.customer_name || "",
    wa: warranty.whatsapp || "",
    model: warranty.model || "",
    serial: warranty.serial || "",
    purchase: warranty.purchase_date || "",
    start: warranty.start_date || "",
    end: warranty.end_date || "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const set = (k, v) => setD((s) => ({ ...s, [k]: v }));
  const save = async () => {
    if (!d.name.trim()) { setErr("اكتب اسم العميل"); return; }
    if (!d.model) { setErr("اختر الموديل"); return; }
    setSaving(true); setErr("");
    try {
      await sbRpc("ectra_warranty_update", {
        p_token: me.token, p_cert_no: warranty.cert_no,
        p_customer_name: d.name.trim(), p_whatsapp: nz(d.wa.trim()), p_model: d.model,
        p_serial: nz(d.serial.trim()), p_purchase_date: nz(d.purchase), p_start_date: nz(d.start), p_end_date: nz(d.end),
      });
      onSaved();
    } catch (ex) { setErr(ekErrMsg(ex)); }
    finally { setSaving(false); }
  };
  return (
    <Modal title={`تعديل الضمان · ${warranty.cert_no}`} onClose={onClose} wide>
      <div style={{ display: "grid", gap: 14 }}>
        <Field label="اسم العميل"><Input value={d.name} onChange={(v) => set("name", v)} placeholder="الاسم بالكامل" /></Field>
        <Field label="رقم واتساب"><Input value={d.wa} onChange={(v) => set("wa", v)} placeholder="01xxxxxxxxx" inputMode="numeric" mono /></Field>
        <Field label="الموديل"><ModelPicker value={d.model} onChange={(v) => set("model", v)} /></Field>
        <Field label="الرقم المسلسل (لازم يكون مسجّل)"><Input value={d.serial} onChange={(v) => set("serial", v)} placeholder="السيريال" mono /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
          <Field label="تاريخ الشراء"><Input type="date" value={d.purchase} onChange={(v) => set("purchase", v)} /></Field>
          <Field label="بداية الضمان"><Input type="date" value={d.start} onChange={(v) => set("start", v)} /></Field>
          <Field label="ساري حتى"><Input type="date" value={d.end} onChange={(v) => set("end", v)} /></Field>
        </div>
        {err && <ErrBox>{err}</ErrBox>}
        <div style={{ display: "grid", gap: 8, marginTop: 4 }}>
          <button onClick={save} disabled={saving} className="ek-btn" style={{ ...btnPrimary(), marginTop: 0, width: "100%" }}>{saving ? <Loader2 size={18} className="spin" color="#fff" /> : <Check size={18} />} حفظ التعديلات</button>
          <button onClick={onClose} className="ek-btn" style={{ ...btnGhost(), marginTop: 0 }}>إلغاء</button>
        </div>
      </div>
    </Modal>
  );
}


/* ===================== التقييمات ===================== */
function FeedbackView() {
  const { can, me } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [filter, setFilter] = useState(0);
  const load = async () => { setLoading(true); setErr(""); try { setItems(await sbRpc("ectra_feedback_list", { p_token: me.token }) || []); } catch (ex) { setErr(ekErrMsg(ex)); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const count = items.length;
  const avg = count ? items.reduce((s, f) => s + Number(f.rating || 0), 0) / count : 0;
  const list = items.filter((f) => filter === 0 || Number(f.rating) === filter);
  const del = async (id) => { if (!window.confirm("حذف هذا التقييم؟")) return; try { await sbRpc("ectra_feedback_delete", { p_token: me.token, p_id: id }); await load(); } catch (ex) { alert(ekErrMsg(ex)); } };
  const togglePublic = async (id, next) => { try { await sbRpc("ectra_feedback_set_public", { p_token: me.token, p_id: id, p_public: next }); setItems((arr) => arr.map((x) => x.id === id ? { ...x, is_public: next } : x)); } catch (ex) { alert(ekErrMsg(ex)); } };
  const Stars = ({ n, size = 15 }) => <span style={{ display: "inline-flex", gap: 1 }}>{[1, 2, 3, 4, 5].map((i) => <Star key={i} size={size} fill={i <= n ? C.primary : "none"} color={i <= n ? C.primary : C.line} />)}</span>;
  return (
    <div className="ek-fade">
      <div style={{ fontWeight: 800, fontSize: 18, display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <MessageSquare size={20} color={C.primary} /> التقييمات <span style={{ color: C.muted, fontWeight: 700, fontSize: 13 }}>({count})</span>
      </div>
      {err && <ErrBox>{err}</ErrBox>}
      {loading ? <Center><Loader2 size={26} className="spin" color={C.primary} /></Center> : (
        <>
          <div style={{ ...rowCard(), flexDirection: "column", alignItems: "stretch", gap: 12, marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 900, fontSize: 38, color: C.primary, lineHeight: 1 }}>{avg.toFixed(1)}</div>
                <div style={{ marginTop: 4 }}><Stars n={Math.round(avg)} /></div>
                <div style={{ fontSize: 11.5, color: C.muted, marginTop: 4 }}>{count} تقييم</div>
              </div>
              <div style={{ flex: 1, minWidth: 180, display: "grid", gap: 5 }}>
                {[5, 4, 3, 2, 1].map((n) => {
                  const c = items.filter((f) => Number(f.rating) === n).length;
                  return (
                    <div key={n} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 12, color: C.muted, width: 10 }}>{n}</span>
                      <Star size={12} fill={C.primary} color={C.primary} />
                      <div style={{ flex: 1, height: 8, background: C.field, borderRadius: 20, overflow: "hidden" }}><div style={{ width: (count ? c / count * 100 : 0) + "%", height: "100%", background: C.primary }} /></div>
                      <span style={{ fontSize: 11.5, color: C.muted, width: 24, textAlign: "left" }}>{c}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            <StageChip active={filter === 0} onClick={() => setFilter(0)} label="الكل" count={count} />
            {[5, 4, 3, 2, 1].map((n) => <StageChip key={n} active={filter === n} onClick={() => setFilter(n)} label={n + " نجوم"} count={items.filter((f) => Number(f.rating) === n).length} />)}
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {list.map((f) => {
              const hidden = f.is_public === false;
              return (
              <div key={f.id} style={{ ...rowCard(), flexDirection: "column", alignItems: "stretch", gap: 6, opacity: hidden ? 0.6 : 1, borderStyle: hidden ? "dashed" : "solid" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Stars n={Number(f.rating)} />
                    <span style={{ fontWeight: 800, fontSize: 14.5 }}>{f.customer_name}</span>
                    {hidden && <span style={{ fontSize: 10.5, fontWeight: 800, color: C.muted, background: C.field, borderRadius: 6, padding: "2px 7px" }}>مخفي عن العملاء</span>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, color: C.muted }}>{String(f.created_at || "").slice(0, 10)}</span>
                    {can("feedback", "delete") && <IconBtn onClick={() => togglePublic(f.id, hidden)} icon={hidden ? EyeOff : Eye} title={hidden ? "إظهار للعملاء" : "إخفاء عن العملاء"} />}
                    {can("feedback", "delete") && <IconBtn onClick={() => del(f.id)} icon={Trash2} danger title="حذف" />}
                  </div>
                </div>
                <div style={{ fontSize: 13.5, color: C.inkSoft, lineHeight: 1.8 }}>{f.message}</div>
                {f.reference && <div style={{ fontSize: 11.5, color: C.muted, fontFamily: "'IBM Plex Mono', monospace" }}>مرجع: {f.reference}</div>}
              </div>
              );
            })}
            {!list.length && <Empty>لا توجد تقييمات</Empty>}
          </div>
        </>
      )}
    </div>
  );
}

/* ===================== قائمة المستخدمين ===================== */
function UsersView() {
  const { can, me } = useAuth();
  const allowUsers = can("users", "manageUsers");
  const allowRoles = can("users", "manageRoles");
  const [tab, setTab] = useState(allowUsers ? "users" : "roles");
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const load = async () => {
    setLoading(true); setErr("");
    try {
      const [u, r] = await Promise.all([
        sbRpc("ectra_admin_list_users", { p_token: me.token }),
        sbRpc("ectra_admin_list_roles", { p_token: me.token }),
      ]);
      setUsers(u); setRoles(r);
    } catch (ex) { setErr("تعذّر تحميل البيانات: " + String(ex).slice(0, 120)); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  return (
    <div className="ek-fade">
      <div style={{ display: "flex", gap: 8, marginBottom: 16, background: C.surface, padding: 6, borderRadius: 14, border: `1px solid ${C.line}` }}>
        {allowUsers && <TabBtn active={tab === "users"} onClick={() => setTab("users")} icon={UsersIcon}>المستخدمين</TabBtn>}
        {allowRoles && <TabBtn active={tab === "roles"} onClick={() => setTab("roles")} icon={ShieldCheck}>صلاحيات المستخدمين</TabBtn>}
      </div>
      {err && <ErrBox>{err}</ErrBox>}
      {!allowUsers && !allowRoles ? <Card><Empty>لا تملك صلاحية على هذه القائمة</Empty></Card> :
        loading ? <Center><Loader2 size={26} className="spin" color={C.primary} /></Center> :
        (tab === "users" && allowUsers) ? <UsersTab users={users} roles={roles} reload={load} token={me.token} /> : <RolesTab roles={roles} reload={load} token={me.token} />}
    </div>
  );
}

function UsersTab({ users, roles, reload, token }) {
  const [edit, setEdit] = useState(null); // {id?, name, username, phone, role_id, active}
  const [busy, setBusy] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const roleName = (id) => roles.find((r) => r.id === id)?.name || "—";
  const blank = { name: "", username: "", phone: "", email: "", role_id: roles[0]?.id || "", active: true, password: "" };

  const save = async () => {
    if (!edit.name.trim() || !edit.username.trim()) return;
    if (!edit.id && !edit.password) { alert("اكتب كلمة سر للمستخدم الجديد"); return; }
    setBusy(true);
    try {
      await sbRpc("ectra_admin_save_user", { p_token: token, p_id: edit.id || null, p_name: edit.name, p_username: edit.username, p_phone: nz(edit.phone), p_email: nz((edit.email || "").trim()), p_role_id: edit.role_id || null, p_active: edit.active, p_password: edit.password || null });
      setEdit(null); await reload();
    } catch (ex) { alert("خطأ: " + String(ex).slice(0, 150)); } finally { setBusy(false); }
  };
  const del = async (id) => { try { await sbRpc("ectra_admin_delete_user", { p_token: token, p_id: id }); setConfirmId(null); await reload(); } catch (ex) { alert("خطأ: " + String(ex).slice(0, 150)); } };

  return (
    <Card>
      <SectionHead title="المستخدمين" count={users.length} onAdd={() => setEdit({ ...blank })} addLabel="مستخدم جديد" />
      <div style={{ display: "grid", gap: 10 }}>
        {users.map((u) => (
          <div key={u.id} style={rowCard()}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 11, background: C.tint, display: "grid", placeItems: "center", color: C.primary, fontWeight: 800 }}>{u.name?.[0] || "?"}</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15 }}>{u.name} {!u.active && <span style={{ fontSize: 11, color: C.danger, fontWeight: 700 }}>(موقوف)</span>}</div>
                <div style={{ fontSize: 12.5, color: C.muted, fontFamily: "'IBM Plex Mono', monospace" }}>@{u.username}</div>
                <div style={{ fontSize: 12, color: C.primary, fontWeight: 700, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}><KeyRound size={12} /> {roleName(u.role_id)}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <IconBtn onClick={() => setEdit({ id: u.id, name: u.name, username: u.username, phone: u.phone || "", email: u.email || "", role_id: u.role_id || "", active: u.active, password: "" })} icon={Pencil} />
              {confirmId === u.id
                ? <button onClick={() => del(u.id)} className="ek-btn" style={{ ...iconBtnStyle(), width: "auto", padding: "0 12px", background: C.danger, color: "#fff", borderColor: C.danger, fontWeight: 700, fontSize: 12.5 }}>تأكيد</button>
                : <IconBtn onClick={() => setConfirmId(u.id)} icon={Trash2} danger />}
            </div>
          </div>
        ))}
        {!users.length && <Empty>لا يوجد مستخدمين بعد</Empty>}
      </div>

      {edit && (
        <Modal title={edit.id ? "تعديل مستخدم" : "مستخدم جديد"} onClose={() => setEdit(null)}>
          <div style={{ display: "grid", gap: 14 }}>
            <Field label="الاسم"><Input value={edit.name} onChange={(v) => setEdit({ ...edit, name: v })} placeholder="اسم المستخدم بالكامل" /></Field>
            <Field label="اسم الدخول (username)"><Input value={edit.username} onChange={(v) => setEdit({ ...edit, username: v })} placeholder="username" mono /></Field>
            <Field label="رقم الموبايل"><Input value={edit.phone} onChange={(v) => setEdit({ ...edit, phone: v })} placeholder="اختياري" inputMode="numeric" mono /></Field>
            <Field label="البريد الإلكتروني (لاستعادة كلمة السر)"><Input value={edit.email} onChange={(v) => setEdit({ ...edit, email: v })} placeholder="example@mail.com" type="email" mono /></Field>
            <Field label="الصلاحية (منح صلاحيات)"><Select value={edit.role_id} onChange={(v) => setEdit({ ...edit, role_id: v })} options={roles.map((r) => r.name)} valueMap={roles.reduce((a, r) => ((a[r.name] = r.id), a), {})} idValue={edit.role_id} idToName={roles.reduce((a, r) => ((a[r.id] = r.name), a), {})} placeholder="بدون صلاحية" /></Field>
            <Field label={edit.id ? "كلمة السر (اتركها فارغة لعدم التغيير)" : "كلمة السر"}>
              <input type="password" value={edit.password} onChange={(e) => setEdit({ ...edit, password: e.target.value })} placeholder="••••••" style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: `1.5px solid ${C.line}`, fontSize: 15, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 2 }} />
            </Field>
            <Field label="الحالة"><Toggle value={edit.active ? "1" : "0"} onChange={(v) => setEdit({ ...edit, active: v === "1" })} options={[{ v: "1", l: "نشط" }, { v: "0", l: "موقوف" }]} /></Field>
          </div>
          <ModalActions onCancel={() => setEdit(null)} onSave={save} busy={busy} />
        </Modal>
      )}
    </Card>
  );
}

function RolesTab({ roles, reload, token }) {
  const [edit, setEdit] = useState(null); // {id?, name, permissions}
  const [busy, setBusy] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  const save = async () => {
    if (!edit.name.trim()) return; setBusy(true);
    try {
      await sbRpc("ectra_admin_save_role", { p_token: token, p_id: edit.id || null, p_name: edit.name, p_permissions: edit.permissions });
      setEdit(null); await reload();
    } catch (ex) { alert("خطأ: " + String(ex).slice(0, 150)); } finally { setBusy(false); }
  };
  const del = async (id) => { try { await sbRpc("ectra_admin_delete_role", { p_token: token, p_id: id }); setConfirmId(null); await reload(); } catch (ex) { alert("خطأ: " + String(ex).slice(0, 150)); } };
  const countOpen = (p) => MENU_CATALOG.filter((m) => p?.[m.key]?.open).length;

  return (
    <Card>
      <SectionHead title="صلاحيات المستخدمين" count={roles.length} onAdd={() => setEdit({ name: "", permissions: blankPerms() })} addLabel="صلاحية جديدة" />
      <div style={{ display: "grid", gap: 10 }}>
        {roles.map((r) => (
          <div key={r.id} style={rowCard()}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 11, background: C.ink, display: "grid", placeItems: "center" }}><ShieldCheck size={20} color={C.primary} /></div>
              <div><div style={{ fontWeight: 800, fontSize: 15 }}>{r.name}</div><div style={{ fontSize: 12.5, color: C.muted }}>قوائم مفعّلة: {countOpen(r.permissions)} / {MENU_CATALOG.length}</div></div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <IconBtn onClick={() => setEdit({ id: r.id, name: r.name, permissions: mergePerms(r.permissions) })} icon={Pencil} />
              {confirmId === r.id
                ? <button onClick={() => del(r.id)} className="ek-btn" style={{ ...iconBtnStyle(), width: "auto", padding: "0 12px", background: C.danger, color: "#fff", borderColor: C.danger, fontWeight: 700, fontSize: 12.5 }}>تأكيد</button>
                : <IconBtn onClick={() => setConfirmId(r.id)} icon={Trash2} danger />}
            </div>
          </div>
        ))}
        {!roles.length && <Empty>لا توجد صلاحيات بعد</Empty>}
      </div>

      {edit && (
        <Modal title={edit.id ? "تعديل صلاحية" : "صلاحية جديدة"} onClose={() => setEdit(null)} wide>
          <Field label="اسم الصلاحية"><Input value={edit.name} onChange={(v) => setEdit({ ...edit, name: v })} placeholder="مثال: موظف استقبال" /></Field>
          <div style={{ marginTop: 16, fontSize: 13.5, fontWeight: 800, marginBottom: 8 }}>القوائم والأزرار المسموح بها</div>
          <PermissionEditor perms={edit.permissions} setPerms={(p) => setEdit({ ...edit, permissions: p })} />
          <ModalActions onCancel={() => setEdit(null)} onSave={save} busy={busy} />
        </Modal>
      )}
    </Card>
  );
}

function PermissionEditor({ perms, setPerms }) {
  const toggleMenu = (mk) => { const p = { ...perms, [mk]: { ...perms[mk], open: !perms[mk].open } }; setPerms(p); };
  const toggleBtn = (mk, bk) => { const p = { ...perms, [mk]: { ...perms[mk], buttons: { ...perms[mk].buttons, [bk]: !perms[mk].buttons[bk] } } }; setPerms(p); };
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {MENU_CATALOG.map((m) => {
        const open = perms[m.key]?.open;
        return (
          <div key={m.key} style={{ border: `1.5px solid ${open ? C.primary : C.line}`, borderRadius: 14, overflow: "hidden", background: open ? C.tint : "#fff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px" }}>
              <div style={{ fontWeight: 800, fontSize: 14 }}>{m.label}</div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}><span style={{ fontSize: 12, fontWeight: 700, color: open ? C.primaryDark : C.muted }}>فتح القائمة</span><Switch on={open} onClick={() => toggleMenu(m.key)} /></label>
            </div>
            {open && (
              <div style={{ borderTop: `1px solid ${C.line}`, background: C.surface, padding: "10px 14px", display: "grid", gap: 8 }}>
                {m.buttons.map((b) => (
                  <label key={b.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                    <span style={{ fontSize: 13, color: C.ink, display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 5, height: 5, borderRadius: "50%", background: perms[m.key].buttons[b.key] ? C.primary : C.line }} /> {b.label}</span>
                    <Switch small on={perms[m.key].buttons[b.key]} onClick={() => toggleBtn(m.key, b.key)} />
                  </label>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
function mergePerms(p) { const base = blankPerms(); MENU_CATALOG.forEach((m) => { if (p?.[m.key]) { base[m.key].open = !!p[m.key].open; m.buttons.forEach((b) => { base[m.key].buttons[b.key] = !!p[m.key].buttons?.[b.key]; }); } }); return base; }

/* ===================== مكوّنات مشتركة ===================== */
const btnPrimary = () => ({ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 16, padding: "13px", borderRadius: 12, background: C.primary, color: "#fff", fontWeight: 700, fontSize: 15, textDecoration: "none", boxShadow: `0 8px 22px ${C.primary}55`, border: "none", cursor: "pointer" });
const btnGhost = () => ({ width: "100%", marginTop: 10, padding: "12px", borderRadius: 12, border: `1.5px solid ${C.line}`, background: C.surface, color: C.ink, fontWeight: 700, fontSize: 14.5, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, textDecoration: "none" });
const rowCard = () => ({ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", borderRadius: 14, border: `1px solid ${C.line}`, background: C.surface });
const iconBtnStyle = () => ({ width: 36, height: 36, borderRadius: 10, display: "grid", placeItems: "center", border: `1.5px solid ${C.line}`, background: C.surface, cursor: "pointer" });

function SuccessIcon() { return <div style={{ width: 64, height: 64, borderRadius: "50%", background: C.ink, display: "grid", placeItems: "center", margin: "0 auto 14px" }}><Check size={32} color="#fff" /></div>; }
function Center({ children }) { return <div style={{ display: "grid", placeItems: "center", padding: 40 }}>{children}</div>; }
function Empty({ children }) { return <div style={{ textAlign: "center", padding: "24px 0", color: C.muted, fontSize: 13.5 }}>{children}</div>; }
function ErrBox({ children }) { return <div style={{ marginTop: 14, padding: "11px 14px", background: "#FDECEC", color: C.danger, borderRadius: 10, fontSize: 13, fontWeight: 600 }}>{children}</div>; }
function Card({ children }) { return <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 20, padding: "20px 18px", boxShadow: "0 12px 40px rgba(20,20,20,0.05)" }}>{children}</div>; }

function TabBtn({ active, onClick, icon: I, children }) {
  return <button onClick={onClick} className="ek-btn" style={{ flex: 1, padding: "11px", borderRadius: 10, border: "none", background: active ? C.ink : "transparent", color: active ? "#fff" : C.muted, fontWeight: 800, fontSize: 13.5, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}><I size={16} color={active ? C.primary : C.muted} /> {children}</button>;
}
function SectionHead({ title, count, onAdd, addLabel }) {
  return <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
    <div style={{ fontWeight: 800, fontSize: 16 }}>{title} <span style={{ color: C.muted, fontWeight: 700, fontSize: 13 }}>({count})</span></div>
    <button onClick={onAdd} className="ek-btn" style={{ display: "flex", alignItems: "center", gap: 5, padding: "9px 14px", borderRadius: 10, border: "none", background: C.primary, color: "#fff", fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}><Plus size={16} /> {addLabel}</button>
  </div>;
}
function IconBtn({ onClick, icon: I, danger, title }) { return <button onClick={onClick} title={title} className="ek-btn" style={{ ...iconBtnStyle(), color: danger ? C.danger : C.ink, borderColor: danger ? "#F5C6C6" : C.line }}><I size={16} /></button>; }
function Switch({ on, onClick, small }) {
  const w = small ? 38 : 44, h = small ? 22 : 26, k = small ? 16 : 20;
  return <span onClick={onClick} style={{ width: w, height: h, borderRadius: h, background: on ? C.primary : "#D8D5D0", position: "relative", cursor: "pointer", transition: "background .2s", display: "inline-block", flexShrink: 0 }}><span style={{ position: "absolute", top: 3, right: on ? 3 : w - k - 3, width: k, height: k, borderRadius: "50%", background: "#fff", transition: "right .2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} /></span>;
}
/* ============================ مبيعات لنقطة بيع ============================ */
function PosTabBtn({ active, onClick, icon: I, label }) {
  return (
    <button onClick={onClick} className="ek-btn" style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 16px", borderRadius: 12, border: `1.5px solid ${active ? C.primary : C.line}`, background: active ? C.primary : C.surface, color: active ? "#fff" : C.ink, fontWeight: 800, fontSize: 14, cursor: "pointer" }}>
      <I size={17} /> {label}
    </button>
  );
}

function PosView() {
  const [tab, setTab] = useState("pos");
  return (
    <div className="ek-fade">
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <PosTabBtn active={tab === "pos"} onClick={() => setTab("pos")} icon={Store} label="نقاط البيع" />
        <PosTabBtn active={tab === "delivery"} onClick={() => setTab("delivery")} icon={Truck} label="أوامر تسليم البضاعة" />
      </div>
      {tab === "pos" ? <PosManage /> : <DeliveryManage />}
    </div>
  );
}

/* ----------- نقاط البيع (جديد / تعديل / مسح) ----------- */
function PosManage() {
  const { me } = useAuth();
  const token = me.token;
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  const load = async () => { setLoading(true); try { setList(await sbRpc("ectra_pos_list", { p_token: token }) || []); } catch (ex) { alert(ekErrMsg(ex)); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const del = async (id) => { try { await sbRpc("ectra_pos_delete", { p_token: token, p_id: id }); setConfirmId(null); await load(); } catch (ex) { alert(ekErrMsg(ex)); } };

  return (
    <Card>
      <SectionHead title="نقاط البيع" count={list.length} onAdd={() => setEdit({ name: "", manager_name: "", phone: "", email: "", username: "", password: "", confirm: "" })} addLabel="نقطة بيع جديدة" />
      {loading ? <Center><Loader2 size={26} className="spin" color={C.primary} /></Center> : (
        <div style={{ display: "grid", gap: 10 }}>
          {list.map((p) => (
            <div key={p.id} style={rowCard()}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                <div style={{ width: 42, height: 42, borderRadius: 11, background: C.tint, display: "grid", placeItems: "center", color: C.primary }}><Store size={20} /></div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>{p.name}</div>
                  <div style={{ fontSize: 12.5, color: C.muted, marginTop: 2, display: "flex", flexWrap: "wrap", gap: "0 12px" }}>
                    {p.manager_name && <span>المسؤول: {p.manager_name}</span>}
                    {p.phone && <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{p.phone}</span>}
                    {p.username && <span style={{ color: C.primary, fontWeight: 700 }}>@{p.username}</span>}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <IconBtn onClick={() => setEdit({ id: p.id, name: p.name || "", manager_name: p.manager_name || "", phone: p.phone || "", email: p.email || "", username: p.username || "", password: "", confirm: "" })} icon={Pencil} />
                {confirmId === p.id
                  ? <button onClick={() => del(p.id)} className="ek-btn" style={{ ...iconBtnStyle(), width: "auto", padding: "0 12px", background: C.danger, color: "#fff", borderColor: C.danger, fontWeight: 700, fontSize: 12.5 }}>تأكيد</button>
                  : <IconBtn onClick={() => setConfirmId(p.id)} icon={Trash2} danger />}
              </div>
            </div>
          ))}
          {!list.length && <Empty>لا توجد نقاط بيع بعد</Empty>}
        </div>
      )}
      {edit && <PosEditor token={token} edit={edit} setEdit={setEdit} onSaved={async () => { setEdit(null); await load(); }} />}
    </Card>
  );
}

function PosEditor({ token, edit, setEdit, onSaved }) {
  const [busy, setBusy] = useState(false);
  const pwStyle = { width: "100%", padding: "12px 14px", borderRadius: 12, border: `1.5px solid ${C.line}`, fontSize: 15, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 2 };
  const save = async () => {
    if (!edit.name.trim()) { alert("اكتب اسم نقطة البيع"); return; }
    if (!edit.id && !edit.username.trim()) { alert("اكتب اسم المستخدم"); return; }
    if (!edit.id && !edit.password) { alert("اكتب كلمة السر"); return; }
    if ((edit.password || "") !== (edit.confirm || "")) { alert("كلمتا السر غير متطابقتين"); return; }
    setBusy(true);
    try {
      await sbRpc("ectra_pos_save", { p_token: token, p_id: edit.id || null, p_name: edit.name.trim(), p_manager_name: nz(edit.manager_name.trim()), p_phone: nz(edit.phone.trim()), p_email: nz(edit.email.trim()), p_username: nz(edit.username.trim()), p_password: edit.password || null });
      await onSaved();
    } catch (ex) { alert(ekErrMsg(ex)); } finally { setBusy(false); }
  };
  return (
    <Modal title={edit.id ? "تعديل نقطة بيع" : "نقطة بيع جديدة"} onClose={() => setEdit(null)}>
      <div style={{ display: "grid", gap: 14 }}>
        <Field label="اسم نقطة البيع"><Input value={edit.name} onChange={(v) => setEdit({ ...edit, name: v })} placeholder="مثال: معرض المنصورة" /></Field>
        <Field label="اسم المسؤول"><Input value={edit.manager_name} onChange={(v) => setEdit({ ...edit, manager_name: v })} placeholder="اسم الشخص المسؤول" /></Field>
        <Field label="رقم التليفون"><Input value={edit.phone} onChange={(v) => setEdit({ ...edit, phone: v })} placeholder="اختياري" inputMode="numeric" mono /></Field>
        <Field label="البريد الإلكتروني"><Input value={edit.email} onChange={(v) => setEdit({ ...edit, email: v })} placeholder="example@mail.com" type="email" mono /></Field>
        <div style={{ height: 1, background: C.line, margin: "2px 0" }} />
        <div style={{ fontSize: 13, color: C.muted, fontWeight: 700, marginBottom: -4 }}>بيانات الدخول للنظام</div>
        <Field label="اسم المستخدم (username)"><Input value={edit.username} onChange={(v) => setEdit({ ...edit, username: v })} placeholder="username" mono /></Field>
        <Field label={edit.id ? "كلمة السر (اتركها فارغة لعدم التغيير)" : "كلمة السر"}>
          <input type="password" value={edit.password} onChange={(e) => setEdit({ ...edit, password: e.target.value })} placeholder="••••••" style={pwStyle} />
        </Field>
        <Field label="تأكيد كلمة السر">
          <input type="password" value={edit.confirm} onChange={(e) => setEdit({ ...edit, confirm: e.target.value })} placeholder="••••••" style={pwStyle} />
        </Field>
      </div>
      <ModalActions onCancel={() => setEdit(null)} onSave={save} busy={busy} />
    </Modal>
  );
}

/* ----------- أوامر تسليم البضاعة (جديد / تعديل / مسح) ----------- */
function DeliveryManage() {
  const { me } = useAuth();
  const token = me.token;
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  const load = async () => { setLoading(true); try { setList(await sbRpc("ectra_delivery_list", { p_token: token }) || []); } catch (ex) { alert(ekErrMsg(ex)); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const del = async (id) => { try { await sbRpc("ectra_delivery_delete", { p_token: token, p_id: id }); setConfirmId(null); await load(); } catch (ex) { alert(ekErrMsg(ex)); } };
  const fmtDate = (s) => { try { return new Date(s).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" }); } catch { return ""; } };
  const printOrder = async (o) => {
    try {
      const d = await sbRpc("ectra_delivery_get", { p_token: token, p_id: o.id });
      ekPrintDelivery({
        order_no: "#" + String(o.id).slice(0, 8).toUpperCase(),
        pos_name: o.pos_name, date: fmtDate(o.created_at),
        items_count: Number(o.items_count), total_qty: Number(o.total_qty),
        created_by: o.created_by_name, note: o.note,
      }, (d && d.lines) || []);
    } catch (ex) { alert(ekErrMsg(ex)); }
  };

  return (
    <Card>
      <SectionHead title="أوامر التسليم" count={list.length} onAdd={() => setEdit({ _new: true })} addLabel="أمر تسليم جديد" />
      {loading ? <Center><Loader2 size={26} className="spin" color={C.primary} /></Center> : (
        <div style={{ display: "grid", gap: 10 }}>
          {list.map((o) => (
            <div key={o.id} style={rowCard()}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                <div style={{ width: 42, height: 42, borderRadius: 11, background: C.tint, display: "grid", placeItems: "center", color: C.primary }}><Truck size={20} /></div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>{o.pos_name}</div>
                  <div style={{ fontSize: 12.5, color: C.muted, marginTop: 2, display: "flex", flexWrap: "wrap", gap: "0 12px" }}>
                    <span>{Number(o.items_count)} صنف</span>
                    <span style={{ color: C.primary, fontWeight: 700 }}>{Number(o.total_qty)} قطعة</span>
                    <span>{fmtDate(o.created_at)}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <IconBtn onClick={() => printOrder(o)} icon={Printer} title="طباعة أمر التسليم" />
                <IconBtn onClick={() => setEdit({ id: o.id })} icon={Pencil} />
                {confirmId === o.id
                  ? <button onClick={() => del(o.id)} className="ek-btn" style={{ ...iconBtnStyle(), width: "auto", padding: "0 12px", background: C.danger, color: "#fff", borderColor: C.danger, fontWeight: 700, fontSize: 12.5 }}>تأكيد</button>
                  : <IconBtn onClick={() => setConfirmId(o.id)} icon={Trash2} danger />}
              </div>
            </div>
          ))}
          {!list.length && <Empty>لا توجد أوامر تسليم بعد</Empty>}
        </div>
      )}
      {edit && <DeliveryEditor token={token} orderId={edit.id || null} onClose={() => setEdit(null)} onSaved={async () => { setEdit(null); await load(); }} />}
    </Card>
  );
}

function DeliveryEditor({ token, orderId, onClose, onSaved }) {
  const [posId, setPosId] = useState("");
  const [note, setNote] = useState("");
  const [lines, setLines] = useState([]); // {item_id, item_name, available, qty, serials:[]}
  const [posOpts, setPosOpts] = useState([]);
  const [itemOpts, setItemOpts] = useState([]);
  const [pickItem, setPickItem] = useState(false);
  const [itemQuery, setItemQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [pos, items] = await Promise.all([
          sbRpc("ectra_pos_list", { p_token: token }),
          sbRpc("ectra_delivery_item_options", { p_token: token }),
        ]);
        setPosOpts(pos || []);
        setItemOpts(items || []);
        if (orderId) {
          const o = await sbRpc("ectra_delivery_get", { p_token: token, p_id: orderId });
          setPosId(o.pos_id || "");
          setNote(o.note || "");
          setLines((o.lines || []).map((l) => ({ item_id: l.item_id, item_name: l.item_name, available: null, qty: (l.serials || []).length, serials: l.serials || [] })));
        }
      } catch (ex) { alert(ekErrMsg(ex)); } finally { setLoading(false); }
    })();
  }, []);

  const addItem = (it) => {
    if (lines.some((l) => l.item_id === it.id)) { setPickItem(false); return; }
    setLines([...lines, { item_id: it.id, item_name: it.name, available: Number(it.available), qty: 1, serials: [] }]);
    setPickItem(false); setItemQuery("");
  };
  const updateLine = (idx, patch) => setLines(lines.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  const removeLine = (idx) => setLines(lines.filter((_, i) => i !== idx));

  const save = async () => {
    if (!posId) { alert("اختر نقطة البيع"); return; }
    if (!lines.length) { alert("أضف صنف واحد على الأقل"); return; }
    for (const l of lines) {
      if (!l.serials.length) { alert(`أدخل سيريالات الصنف «${l.item_name}»`); return; }
      if (l.serials.length !== l.qty) { alert(`عدد السيريالات للصنف «${l.item_name}» (${l.serials.length}) لا يساوي الكمية المطلوبة (${l.qty})`); return; }
    }
    setBusy(true);
    try {
      await sbRpc("ectra_delivery_save", { p_token: token, p_id: orderId, p_pos_id: posId, p_note: nz(note.trim()), p_lines: lines.map((l) => ({ item_id: l.item_id, serials: l.serials })) });
      await onSaved();
    } catch (ex) { alert(ekErrMsg(ex)); } finally { setBusy(false); }
  };

  const filteredItems = itemOpts.filter((i) => !itemQuery.trim() || (i.name || "").toLowerCase().includes(itemQuery.trim().toLowerCase()));

  return (
    <Modal title={orderId ? "تعديل أمر تسليم" : "أمر تسليم جديد"} onClose={onClose} wide>
      {loading ? <Center><Loader2 size={26} className="spin" color={C.primary} /></Center> : (
        <div style={{ display: "grid", gap: 16 }}>
          <Field label="نقطة البيع">
            <select value={posId} onChange={(e) => setPosId(e.target.value)} style={ekSelectStyle}>
              <option value="">— اختر نقطة البيع —</option>
              {posOpts.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: C.ink }}>الأصناف</span>
              <button onClick={() => setPickItem(true)} className="ek-btn" style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 12px", borderRadius: 10, border: "none", background: C.primary, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}><Plus size={15} /> إضافة صنف</button>
            </div>
            {!lines.length && <Empty>لم تتم إضافة أصناف بعد</Empty>}
            <div style={{ display: "grid", gap: 14 }}>
              {lines.map((l, idx) => (
                <DeliveryLine key={l.item_id} token={token} line={l} onChange={(patch) => updateLine(idx, patch)} onRemove={() => removeLine(idx)} />
              ))}
            </div>
          </div>

          <Field label="ملاحظات (اختياري)"><Input value={note} onChange={setNote} placeholder="ملاحظة على أمر التسليم" /></Field>
        </div>
      )}
      <ModalActions onCancel={onClose} onSave={save} busy={busy} />

      {pickItem && (
        <Modal title="اختر صنف" onClose={() => setPickItem(false)}>
          <Input value={itemQuery} onChange={setItemQuery} placeholder="ابحث بالاسم أو جزء منه" />
          <div style={{ display: "grid", gap: 8, marginTop: 12, maxHeight: 320, overflowY: "auto" }}>
            {filteredItems.map((it) => {
              const used = lines.some((l) => l.item_id === it.id);
              return (
                <button key={it.id} onClick={() => !used && addItem(it)} disabled={used} className="ek-btn" style={{ textAlign: "right", padding: "12px 14px", borderRadius: 12, border: `1.5px solid ${C.line}`, background: used ? C.field : C.surface, cursor: used ? "default" : "pointer", opacity: used ? 0.55 : 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 14.5 }}>{it.name}</div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{it.model ? `موديل: ${it.model} · ` : ""}متاح: {Number(it.available)} {used ? "· مُضاف" : ""}</div>
                </button>
              );
            })}
            {!filteredItems.length && <Empty>لا توجد أصناف مطابقة</Empty>}
          </div>
        </Modal>
      )}
    </Modal>
  );
}

function DeliveryLine({ token, line, onChange, onRemove }) {
  const [term, setTerm] = useState("");
  const [sugs, setSugs] = useState([]);
  const [scan, setScan] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      const q = term.trim();
      if (q.length < 2) { setSugs([]); return; }
      setSearching(true);
      try {
        const r = await sbRpc("ectra_delivery_unit_search", { p_token: token, p_item_id: line.item_id, p_term: q }) || [];
        setSugs(r.filter((x) => !line.serials.includes(x.serial)).slice(0, 8));
      } catch { setSugs([]); } finally { setSearching(false); }
    }, 280);
    return () => clearTimeout(t);
  }, [term, line.serials]);

  const addSerial = async (s) => {
    const v = String(s || "").trim();
    if (!v) return;
    if (line.serials.some((x) => x.toUpperCase() === v.toUpperCase())) { setTerm(""); setSugs([]); return; }
    // تحقق أن السيريال متاح لهذا الصنف
    try {
      const r = await sbRpc("ectra_delivery_unit_search", { p_token: token, p_item_id: line.item_id, p_term: v }) || [];
      const hit = r.find((x) => x.serial.toUpperCase() === v.toUpperCase());
      if (!hit) { alert("السيريال غير متاح أو غير مسجّل لهذا الصنف"); return; }
      const serials = [...line.serials, hit.serial];
      onChange({ serials, qty: Math.max(line.qty, serials.length) });
      setTerm(""); setSugs([]);
    } catch (ex) { alert(ekErrMsg(ex)); }
  };
  const removeSerial = (s) => onChange({ serials: line.serials.filter((x) => x !== s) });
  const setQty = (n) => { const q = Math.max(1, Math.min(9999, n || 0)); onChange({ qty: Math.max(q, line.serials.length) }); };

  return (
    <div style={{ border: `1.5px solid ${C.line}`, borderRadius: 16, padding: 14, background: C.surface }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontWeight: 800, fontSize: 14.5 }}>{line.item_name}{line.available != null && <span style={{ fontSize: 11.5, color: C.muted, fontWeight: 600 }}> · متاح {line.available}</span>}</div>
        <button onClick={onRemove} title="حذف الصنف" style={{ width: 30, height: 30, borderRadius: 8, border: `1.5px solid #F5C6C6`, background: C.surface, color: C.danger, cursor: "pointer", display: "grid", placeItems: "center" }}><X size={15} /></button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: C.muted }}>الكمية</span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button onClick={() => setQty(line.qty - 1)} className="ek-btn" style={qtyBtn}><Minus size={15} /></button>
          <input value={line.qty} onChange={(e) => setQty(parseInt(e.target.value.replace(/\D/g, "")) || 0)} inputMode="numeric" style={{ width: 56, textAlign: "center", padding: "9px 6px", borderRadius: 10, border: `1.5px solid ${C.line}`, fontSize: 15, fontWeight: 800, fontFamily: "'IBM Plex Mono', monospace" }} />
          <button onClick={() => setQty(line.qty + 1)} className="ek-btn" style={qtyBtn}><Plus size={15} /></button>
        </div>
        <span style={{ fontSize: 12.5, color: line.serials.length === line.qty ? "#16A34A" : C.muted, fontWeight: 700, marginInlineStart: "auto" }}>تم إدخال {line.serials.length} من {line.qty}</span>
      </div>

      <div style={{ display: "flex", gap: 8, position: "relative" }}>
        <input value={term} onChange={(e) => setTerm(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSerial(term); } }} placeholder="امسح الباركود أو اكتب جزء من السيريال" style={{ flex: 1, padding: "11px 13px", borderRadius: 11, border: `1.5px solid ${C.line}`, fontSize: 14, fontFamily: "'IBM Plex Mono', monospace" }} />
        <button onClick={() => setScan(true)} className="ek-btn" title="مسح بالكاميرا" style={{ ...iconBtnStyle(), width: 44, color: C.primary }}><ScanLine size={18} /></button>
      </div>

      {(searching || sugs.length > 0) && (
        <div style={{ marginTop: 8, border: `1px solid ${C.line}`, borderRadius: 12, overflow: "hidden" }}>
          {searching && <div style={{ padding: "8px 12px", fontSize: 12.5, color: C.muted }}>جارٍ البحث…</div>}
          {sugs.map((s) => (
            <button key={s.unit_id} onClick={() => addSerial(s.serial)} className="ek-btn" style={{ display: "block", width: "100%", textAlign: "right", padding: "10px 13px", border: "none", borderBottom: `1px solid ${C.line}`, background: C.surface, cursor: "pointer", fontSize: 13.5, fontFamily: "'IBM Plex Mono', monospace" }}>{s.serial}</button>
          ))}
        </div>
      )}

      {line.serials.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 12 }}>
          {line.serials.map((s) => (
            <span key={s} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 9, background: C.tint, color: C.ink, fontSize: 12.5, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace" }}>
              {s}<button onClick={() => removeSerial(s)} style={{ border: "none", background: "transparent", cursor: "pointer", color: C.danger, display: "grid", placeItems: "center", padding: 0 }}><X size={13} /></button>
            </span>
          ))}
        </div>
      )}

      {scan && <ScannerModal onClose={() => setScan(false)} onResult={(v) => { setScan(false); addSerial(v); }} />}
    </div>
  );
}
const qtyBtn = { width: 36, height: 36, borderRadius: 10, border: `1.5px solid ${C.line}`, background: C.surface, cursor: "pointer", display: "grid", placeItems: "center", color: C.ink };


function Modal({ title, onClose, children, wide }) {
  return createPortal(
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(20,20,20,0.5)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "calc(env(safe-area-inset-top, 0px) + 16px) 14px calc(env(safe-area-inset-bottom, 0px) + 16px)", zIndex: 1000, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
      <div onClick={(e) => e.stopPropagation()} className="ek-fade" style={{ background: C.surface, borderRadius: 20, padding: "20px 18px", width: "100%", maxWidth: wide ? 520 : 420, margin: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}><div style={{ fontWeight: 800, fontSize: 17 }}>{title}</div><button onClick={onClose} style={{ ...iconBtnStyle() }}><X size={16} /></button></div>
        {children}
      </div>
    </div>,
    document.body
  );
}
function ModalActions({ onCancel, onSave, busy }) {
  return <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
    <button onClick={onCancel} className="ek-btn" style={{ flex: 1, padding: "12px", borderRadius: 12, border: `1.5px solid ${C.line}`, background: C.surface, color: C.ink, fontWeight: 700, cursor: "pointer" }}>إلغاء</button>
    <button onClick={onSave} disabled={busy} className="ek-btn" style={{ flex: 1, padding: "12px", borderRadius: 12, border: "none", background: C.ink, color: "#fff", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>{busy ? <Loader2 size={16} className="spin" color={C.primary} /> : <Check size={16} color={C.primary} />} حفظ</button>
  </div>;
}

function Panel({ side, sideDesc, sideIcon: Icon, children }) {
  return (
    <div className="ek-fade" style={{ display: "flex", flexWrap: "wrap", gap: 18, alignItems: "stretch" }}>
      <aside style={{ flex: "1 1 280px", minWidth: 260, borderRadius: 22, padding: "26px 22px", background: `linear-gradient(155deg, ${C.ink}, ${C.inkSoft})`, color: "#fff", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", bottom: -50, right: -30, width: 180, height: 180, borderRadius: "50%", background: `radial-gradient(circle, ${C.primary}44, transparent 70%)` }} />
        <div style={{ position: "relative" }}>
          <div style={{ width: 46, height: 46, borderRadius: 13, background: "rgba(255,90,60,0.16)", display: "grid", placeItems: "center", marginBottom: 16 }}><Icon size={24} color={C.primary} /></div>
          <h2 style={{ fontSize: 21, fontWeight: 800, margin: "0 0 8px" }}>{side}</h2>
          <p style={{ fontSize: 14, opacity: 0.7, lineHeight: 1.8, margin: 0 }}>{sideDesc}</p>
        </div>
      </aside>
      <main style={{ flex: "2 1 440px", minWidth: 300, background: C.surface, borderRadius: 22, padding: "24px 20px", border: `1px solid ${C.line}`, boxShadow: "0 12px 40px rgba(20,20,20,0.06)" }}>{children}</main>
    </div>
  );
}
function ModelPicker({ value, onChange }) {
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <ModelGroup icon={BatteryCharging} title="الشواحن" items={CHARGERS} value={value} onChange={onChange} />
      <ModelGroup icon={Headphones} title="الصوتيات" items={AUDIO} value={value} onChange={onChange} />
    </div>
  );
}
function ModelGroup({ icon: I, title, items, value, onChange }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 700, color: C.muted, marginBottom: 8 }}><I size={15} color={C.primary} /> {title}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8 }}>
        {items.map((o) => {
          const on = value === o;
          return (
            <button
              key={o}
              type="button"
              onClick={() => onChange(o)}
              aria-pressed={on}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                minHeight: 48, padding: "10px 12px", borderRadius: 12,
                border: `1.5px solid ${on ? C.primary : C.line}`,
                background: on ? C.primary : C.surface, color: on ? "#fff" : C.ink,
                fontWeight: 700, fontSize: 13, cursor: "pointer",
                fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.25,
                textAlign: "center", transition: "border-color .15s, background .15s, color .15s",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              {on && <Check size={15} style={{ flexShrink: 0 }} />} {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}
function MiniSteps({ labels, step }) {
  return <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>{labels.map((l, i) => (<div key={l} style={{ flex: 1 }}><div style={{ height: 6, borderRadius: 4, background: i <= step ? C.primary : C.field, transition: "background .3s" }} /><span style={{ fontSize: 11.5, fontWeight: i === step ? 700 : 500, color: i === step ? C.ink : C.muted, marginTop: 6, display: "block" }}>{l}</span></div>))}</div>;
}
function NavBtns({ step, onBack, onNext, onSubmit, isLast, lastLabel, lastIcon: LI, busy, locked }) {
  return <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
    {step > 0 && <button onClick={onBack} className="ek-btn" style={{ padding: "13px 18px", borderRadius: 12, border: `1.5px solid ${C.line}`, background: C.surface, color: C.ink, fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}><ChevronRight size={18} /> السابق</button>}
    {!isLast ? <button onClick={onNext} className="ek-btn" style={{ flex: 1, padding: "13px 18px", borderRadius: 12, border: "none", background: C.primary, color: "#fff", fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, cursor: "pointer", boxShadow: `0 8px 22px ${C.primary}55` }}>التالي <ChevronLeft size={18} /></button>
      : locked ? <div style={{ flex: 1, padding: "13px 18px", borderRadius: 12, background: C.field, color: C.muted, fontWeight: 700, fontSize: 14.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Lock size={16} /> لا تملك صلاحية تنفيذ هذا الإجراء</div>
      : <button onClick={onSubmit || onNext} disabled={busy} className="ek-btn" style={{ flex: 1, padding: "13px 18px", borderRadius: 12, border: "none", background: C.ink, color: "#fff", fontWeight: 800, fontSize: 15.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer", boxShadow: "0 8px 22px rgba(20,20,20,0.3)" }}>{busy ? <Loader2 size={18} className="spin" color={C.primary} /> : LI && <LI size={18} color={C.primary} />} {lastLabel}</button>}
  </div>;
}
function Field({ label, error, children }) { return <label style={{ display: "block" }}><span style={{ display: "block", fontSize: 13.5, fontWeight: 700, marginBottom: 7, color: C.ink }}>{label}</span>{children}{error && <span style={{ display: "block", fontSize: 12, color: C.danger, marginTop: 6, fontWeight: 600 }}>{error}</span>}</label>; }
function Input({ value, onChange, placeholder, type = "text", inputMode, mono }) { return <input type={type} value={value} inputMode={inputMode} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: `1.5px solid ${C.line}`, background: C.field, color: C.ink, fontSize: 15, fontFamily: mono ? "'IBM Plex Mono', monospace" : "inherit", letterSpacing: mono ? 1 : 0 }} />; }
function Select({ value, onChange, options, placeholder, valueMap, idValue, idToName }) {
  // لو valueMap موجود: القيم نصية تتحوّل لـ id
  const display = idValue !== undefined && idToName ? (idToName[idValue] || "") : value;
  return <select value={display} onChange={(e) => onChange(valueMap ? (valueMap[e.target.value] || "") : e.target.value)} style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: `1.5px solid ${C.line}`, fontSize: 15, background: C.field, color: display ? C.ink : C.muted, appearance: "none", cursor: "pointer" }}>
    {placeholder && <option value="">{placeholder}</option>}
    {options.map((o) => <option key={o} value={o}>{o}</option>)}
  </select>;
}
function Chips({ value, onChange, options }) { return <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{options.map((o) => { const on = value === o; return <button key={o} type="button" onClick={() => onChange(o)} style={{ padding: "9px 14px", borderRadius: 20, border: `1.5px solid ${on ? C.primary : C.line}`, background: on ? C.primary : C.surface, color: on ? "#fff" : C.muted, fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}>{o}</button>; })}</div>; }
function Toggle({ value, onChange, options }) { return <div style={{ display: "flex", gap: 6, background: C.field, padding: 4, borderRadius: 12 }}>{options.map((o) => { const on = value === o.v; return <button key={o.v} type="button" onClick={() => onChange(o.v)} style={{ flex: 1, padding: 10, borderRadius: 9, border: "none", background: on ? C.surface : "transparent", color: on ? C.ink : C.muted, fontWeight: 700, fontSize: 13.5, cursor: "pointer", boxShadow: on ? "0 2px 8px rgba(20,20,20,0.1)" : "none", transition: "all .15s" }}>{o.l}</button>; })}</div>; }
function Note({ children, small }) { return <div style={{ padding: "11px 14px", background: C.bg, borderRadius: 10, fontSize: small ? 12.5 : 13.5, color: C.muted, lineHeight: 1.7, marginTop: small ? 12 : 0 }}>{children}</div>; }
function Row({ k, v, last }) { return <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: last ? "none" : `1px solid ${C.line}` }}><span style={{ fontSize: 13, color: C.muted, fontWeight: 600 }}>{k}</span><span style={{ fontSize: 13.5, color: C.ink, fontWeight: 700, maxWidth: "60%", textAlign: "left" }}>{v}</span></div>; }

/* ===================== قاعدة البيانات (المنتجات) ===================== */
function ProductsView() {
  const { can, me } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [edit, setEdit] = useState(null);
  const [busy, setBusy] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [importing, setImporting] = useState(false);
  const [msg, setMsg] = useState("");
  const fileRef = React.useRef(null);
  const SECTIONS = ["شواحن", "صوتيات", "أخرى"];
  const blank = { section: "شواحن", model: "", serial: "", code: "" };
  const blankBatch = { section: "شواحن", model: "", code: "", serials: "" };
  const [batch, setBatch] = useState(null);
  const [batchBusy, setBatchBusy] = useState(false);
  const [batchMsg, setBatchMsg] = useState("");

  const load = async () => {
    setLoading(true); setErr("");
    try { setItems(await sbSelect("ectra_products", "select=*&order=created_at.desc")); }
    catch (ex) { setErr("تعذّر التحميل: " + String(ex).slice(0, 120)); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!edit.model.trim()) { alert("اكتب رقم الموديل"); return; }
    setBusy(true);
    try {
      await sbRpc("ectra_product_save", { p_token: me.token, p_id: edit.id || null, p_section: nz(edit.section), p_model: edit.model, p_serial: nz(edit.serial), p_code: nz(edit.code) });
      setEdit(null); await load();
    } catch (ex) { alert("خطأ: " + String(ex).slice(0, 150)); } finally { setBusy(false); }
  };
  const del = async (id) => { try { await sbRpc("ectra_product_delete", { p_token: me.token, p_id: id }); setConfirmId(null); await load(); } catch (ex) { alert("خطأ: " + String(ex).slice(0, 150)); } };

  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();

    // الشيت الرئيسي: المنتجات
    const ws = XLSX.utils.aoa_to_sheet([
      ["القسم", "رقم الموديل", "الرقم المسلسل", "كود"],
      ["شواحن", "Fast Charger 25W", "SN0001", "EK-25W-001"],
      ["صوتيات", "Earbuds Echo", "SN0002", "EK-ECHO-001"],
    ]);
    ws["!cols"] = [{ wch: 12 }, { wch: 24 }, { wch: 20 }, { wch: 18 }];
    // قائمة منسدلة للقسم (عمود A، من الصف 2 لحد 1000) + جعل عمود السيريال نص
    ws["!dataValidation"] = [
      { sqref: "A2:A1000", type: "list", formula1: '"شواحن,صوتيات,أخرى"', allowBlank: true },
    ];
    for (let r = 2; r <= 1000; r++) {
      const ref = "C" + r;
      if (!ws[ref]) ws[ref] = { t: "s", v: "" };
      ws[ref].z = "@"; // تنسيق نصّي يمنع تحويل الأصفار البادئة لأرقام
    }
    XLSX.utils.book_append_sheet(wb, ws, "products");

    // شيت التعليمات
    const tips = XLSX.utils.aoa_to_sheet([
      ["تعليمات تعبئة قالب منتجات ECTRA"],
      [""],
      ["العمود", "إلزامي؟", "الشرح"],
      ["القسم", "اختياري", "اختر من القائمة: شواحن / صوتيات / أخرى"],
      ["رقم الموديل", "إلزامي", "اسم/رقم الموديل كما هو معروف (مثال: Fast Charger 25W)"],
      ["الرقم المسلسل", "اختياري", "السيريال نمبر للقطعة — يُكتب كنص للحفاظ على الأصفار البادئة"],
      ["كود", "اختياري", "كود المنتج الداخلي إن وُجد"],
      [""],
      ["ملاحظات هامة:"],
      ["- لا تغيّر أسماء أعمدة الصف الأول."],
      ["- كل صف = قطعة واحدة بسيريال مستقل."],
      ["- السيريالات المكررة (الموجودة مسبقاً أو متكررة داخل الملف) يتم تجاهلها تلقائياً عند الاستيراد."],
      ["- لإدخال عدد كبير من السيريالات لنفس الموديل بسرعة، استخدم زر «إدخال جماعي» داخل النظام."],
    ]);
    tips["!cols"] = [{ wch: 16 }, { wch: 10 }, { wch: 64 }];
    XLSX.utils.book_append_sheet(wb, tips, "تعليمات");

    XLSX.writeFile(wb, "ectra_products_template.xlsx");
  };

  const onFile = async (e) => {
    const file = e.target.files && e.target.files[0]; if (!file) return;
    setImporting(true); setMsg("");
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      // اختَر شيت المنتجات تحديداً لو موجود، وإلا أول شيت
      const sheetName = wb.SheetNames.find((n) => n === "products") || wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
      const mapped = rows.map((r) => ({
        section: r["القسم"] != null ? r["القسم"] : (r.section || ""),
        model: (r["رقم الموديل"] != null ? r["رقم الموديل"] : (r["الموديل"] != null ? r["الموديل"] : (r.model || ""))),
        serial: (r["الرقم المسلسل"] != null ? r["الرقم المسلسل"] : (r["السيريال"] != null ? r["السيريال"] : (r.serial || ""))),
        code: r["كود"] != null ? r["كود"] : (r.code || ""),
      })).map((x) => ({ section: nz(String(x.section).trim()), model: String(x.model).trim(), serial: nz(String(x.serial).trim()), code: nz(String(x.code).trim()) }))
        .filter((x) => x.model);
      if (!mapped.length) { setMsg("الملف فاضي أو الأعمدة مش متطابقة مع القالب."); return; }

      // منع التكرار: داخل الملف نفسه + مقابل السيريالات الموجودة في قاعدة البيانات
      const existing = new Set(items.map((p) => (p.serial || "").trim()).filter(Boolean));
      const seen = new Set();
      let dupInFile = 0, dupInDb = 0;
      const clean = mapped.filter((x) => {
        if (!x.serial) return true; // الصفوف بدون سيريال تمر بدون فحص تكرار
        if (existing.has(x.serial)) { dupInDb++; return false; }
        if (seen.has(x.serial)) { dupInFile++; return false; }
        seen.add(x.serial); return true;
      });

      if (!clean.length) { setMsg(`كل السيريالات في الملف مكررة (${dupInDb} موجود مسبقاً، ${dupInFile} مكرر داخل الملف) — لم يُضَف شيء.`); return; }
      const inserted = await sbRpc("ectra_products_bulk_insert", { p_token: me.token, p_rows: clean });
      const skipped = dupInFile + dupInDb;
      setMsg(`تم استيراد ${Array.isArray(inserted) ? clean.length : inserted} منتج بنجاح${skipped ? ` — وتم تجاهل ${skipped} سيريال مكرر (${dupInDb} موجود مسبقاً، ${dupInFile} مكرر داخل الملف)` : ""}.`);
      await load();
    } catch (ex) { setMsg("فشل الاستيراد: " + String(ex).slice(0, 120)); }
    finally { setImporting(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  // إدخال جماعي: سيريالات متعددة (سطر بسطر / بالباركود) لنفس الموديل دفعة واحدة
  const saveBatch = async () => {
    if (!batch.model.trim()) { setBatchMsg("اكتب رقم الموديل أولاً."); return; }
    // كل سطر = سيريال؛ نقبل أيضاً الفصل بفواصل أو tab (مفيد للصق من إكسل/سكانر)
    const raw = batch.serials.split(/[\n\r,\t]+/).map((s) => s.trim()).filter(Boolean);
    if (!raw.length) { setBatchMsg("الصق أو امسح سيريال واحد على الأقل."); return; }

    const existing = new Set(items.map((p) => (p.serial || "").trim()).filter(Boolean));
    const seen = new Set();
    let dupInList = 0, dupInDb = 0;
    const serials = raw.filter((s) => {
      if (existing.has(s)) { dupInDb++; return false; }
      if (seen.has(s)) { dupInList++; return false; }
      seen.add(s); return true;
    });

    if (!serials.length) { setBatchMsg(`كل السيريالات مكررة (${dupInDb} موجود مسبقاً، ${dupInList} مكرر في القائمة) — لم يُضَف شيء.`); return; }

    setBatchBusy(true); setBatchMsg("");
    try {
      const payload = serials.map((s) => ({ section: nz(batch.section), model: batch.model.trim(), serial: s, code: nz(batch.code.trim()) }));
      await sbRpc("ectra_products_bulk_insert", { p_token: me.token, p_rows: payload });
      const skipped = dupInList + dupInDb;
      setBatch(null); setBatchMsg("");
      setMsg(`تم إضافة ${serials.length} قطعة للموديل «${batch.model.trim()}»${skipped ? ` — وتم تجاهل ${skipped} سيريال مكرر` : ""}.`);
      await load();
    } catch (ex) { setBatchMsg("خطأ: " + String(ex).slice(0, 150)); }
    finally { setBatchBusy(false); }
  };

  return (
    <Panel side="قاعدة البيانات" sideDesc="أضف منتجات ECTRA المشمولة بضمان MTC GROUP يدوياً أو استوردها من ملف Excel." sideIcon={Database}>
      <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={onFile} style={{ display: "none" }} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontWeight: 800, fontSize: 16 }}>المنتجات <span style={{ color: C.muted, fontWeight: 700, fontSize: 13 }}>({items.length})</span></div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {can("products", "template") && <SmallBtn onClick={downloadTemplate} icon={Download} ghost>تنزيل القالب</SmallBtn>}
          {can("products", "import") && <SmallBtn onClick={() => fileRef.current && fileRef.current.click()} icon={Upload} ghost busy={importing}>استيراد Excel</SmallBtn>}
          {can("products", "add") && <SmallBtn onClick={() => { setBatch({ ...blankBatch }); setBatchMsg(""); }} icon={ScanLine} ghost>إدخال جماعي</SmallBtn>}
          {can("products", "add") && <SmallBtn onClick={() => setEdit({ ...blank })} icon={Plus}>إضافة منتج</SmallBtn>}
        </div>
      </div>
      {msg && <div style={{ marginBottom: 12, padding: "10px 14px", background: C.tint, color: C.primaryDark, borderRadius: 10, fontSize: 13, fontWeight: 600 }}>{msg}</div>}
      {err && <ErrBox>{err}</ErrBox>}
      {loading ? <Center><Loader2 size={26} className="spin" color={C.primary} /></Center> : (
        <div style={{ display: "grid", gap: 10 }}>
          {items.map((p) => (
            <div key={p.id} style={rowCard()}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 800, fontSize: 14.5 }}>{p.model}</span>
                  {p.section && <span style={{ fontSize: 11, fontWeight: 700, color: C.primaryDark, background: C.tint, padding: "2px 8px", borderRadius: 20 }}>{p.section}</span>}
                </div>
                <div style={{ fontSize: 12, color: C.muted, fontFamily: "'IBM Plex Mono', monospace", marginTop: 3 }}>{p.serial ? "SN: " + p.serial : ""}{p.serial && p.code ? " · " : ""}{p.code ? "كود: " + p.code : ""}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>أُضيف: {String(p.created_at || "").slice(0, 10)}</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {can("products", "edit") && <IconBtn onClick={() => setEdit({ id: p.id, section: p.section || "شواحن", model: p.model || "", serial: p.serial || "", code: p.code || "" })} icon={Pencil} />}
                {can("products", "delete") && (confirmId === p.id
                  ? <button onClick={() => del(p.id)} className="ek-btn" style={{ ...iconBtnStyle(), width: "auto", padding: "0 12px", background: C.danger, color: "#fff", borderColor: C.danger, fontWeight: 700, fontSize: 12.5 }}>تأكيد</button>
                  : <IconBtn onClick={() => setConfirmId(p.id)} icon={Trash2} danger />)}
              </div>
            </div>
          ))}
          {!items.length && <Empty>لا توجد منتجات بعد — أضف منتج أو استورد ملف Excel</Empty>}
        </div>
      )}

      {edit && (
        <Modal title={edit.id ? "تعديل منتج" : "إضافة منتج"} onClose={() => setEdit(null)}>
          <div style={{ display: "grid", gap: 14 }}>
            <Field label="القسم"><Select value={edit.section} onChange={(v) => setEdit({ ...edit, section: v })} options={SECTIONS} /></Field>
            <Field label="رقم الموديل"><Input value={edit.model} onChange={(v) => setEdit({ ...edit, model: v })} placeholder="مثال: Fast Charger 25W" /></Field>
            <Field label="الرقم المسلسل"><Input value={edit.serial} onChange={(v) => setEdit({ ...edit, serial: v })} placeholder="Serial number" mono /></Field>
            <Field label="كود"><Input value={edit.code} onChange={(v) => setEdit({ ...edit, code: v })} placeholder="كود المنتج" mono /></Field>
            <Note small>تاريخ الإدخال بيتسجّل تلقائياً وقت الحفظ في قاعدة البيانات.</Note>
          </div>
          <ModalActions onCancel={() => setEdit(null)} onSave={save} busy={busy} />
        </Modal>
      )}

      {batch && (() => {
        const count = batch.serials.split(/[\n\r,\t]+/).map((s) => s.trim()).filter(Boolean).length;
        return (
          <Modal title="إدخال جماعي للسيريالات" onClose={() => setBatch(null)}>
            <div style={{ display: "grid", gap: 14 }}>
              <Note small>اختر القسم والموديل والكود مرة واحدة، ثم الصق السيريالات أو امسحها بالباركود — كل سيريال في سطر مستقل. السيريالات المكررة يتم تجاهلها تلقائياً.</Note>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="القسم"><Select value={batch.section} onChange={(v) => setBatch({ ...batch, section: v })} options={SECTIONS} /></Field>
                <Field label="كود (اختياري)"><Input value={batch.code} onChange={(v) => setBatch({ ...batch, code: v })} placeholder="كود مشترك" mono /></Field>
              </div>
              <Field label="رقم الموديل"><Input value={batch.model} onChange={(v) => setBatch({ ...batch, model: v })} placeholder="مثال: Fast Charger 25W" /></Field>
              <Field label={`السيريالات (${count})`}>
                <textarea
                  value={batch.serials}
                  onChange={(e) => { setBatch({ ...batch, serials: e.target.value }); setBatchMsg(""); }}
                  rows={7}
                  autoFocus
                  placeholder={"امسح بالباركود أو الصق سيريال في كل سطر...\nSN0001\nSN0002\nSN0003"}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: `1.5px solid ${C.line}`, fontSize: 14, resize: "vertical", lineHeight: 1.9, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 0.5 }}
                />
              </Field>
              {batchMsg && <div style={{ padding: "10px 14px", background: "#FDECEC", color: C.danger, borderRadius: 10, fontSize: 13, fontWeight: 600 }}>{batchMsg}</div>}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={() => setBatch(null)} className="ek-btn" style={{ flex: 1, padding: "12px", borderRadius: 12, border: `1.5px solid ${C.line}`, background: C.surface, color: C.ink, fontWeight: 700, cursor: "pointer" }}>إلغاء</button>
              <button onClick={saveBatch} disabled={batchBusy || !count} className="ek-btn" style={{ flex: 2, padding: "12px", borderRadius: 12, border: "none", background: count ? C.ink : C.field, color: count ? "#fff" : C.muted, fontWeight: 800, cursor: count ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                {batchBusy ? <Loader2 size={16} className="spin" color={C.primary} /> : <ListPlus size={16} color={count ? C.primary : C.muted} />} إضافة {count ? count + " قطعة" : ""}
              </button>
            </div>
          </Modal>
        );
      })()}
    </Panel>
  );
}

function SmallBtn({ onClick, icon: I, children, ghost, busy }) {
  return <button onClick={onClick} disabled={busy} className="ek-btn" style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 13px", borderRadius: 10, border: ghost ? `1.5px solid ${C.line}` : "none", background: ghost ? "#fff" : C.primary, color: ghost ? C.ink : "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{busy ? <Loader2 size={15} className="spin" color={ghost ? C.primary : "#fff"} /> : <I size={15} />} {children}</button>;
}

function CertRow({ k, v, mono, highlight }) { return <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0" }}><span style={{ fontSize: 13, color: C.muted, fontWeight: 600 }}>{k}</span><span style={{ fontSize: 14, fontWeight: 700, color: highlight ? C.primary : C.ink, fontFamily: mono ? "'IBM Plex Mono', monospace" : "inherit" }}>{v}</span></div>; }
