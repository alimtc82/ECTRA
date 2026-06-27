import React, { useState, useRef, useEffect } from "react";
import {
  ArrowRight, ShieldCheck, Search, Wrench, MessageSquare, Loader2, Check,
  FileText, Star, BadgeCheck, Send, X, ScanLine, Camera, AlertTriangle, Clock,
} from "lucide-react";

/* مركز خدمة عملاء MTC GROUP لمنتجات شركة LRT / ECTRA — صفحة عامة (بدون تسجيل دخول) */

import mtcLogo from "./assets/mtc-logo.png";

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
async function sbRpc(fn, args) {
  const r = await fetch(`${SB_URL}/rest/v1/rpc/${fn}`, { method: "POST", headers: H, body: JSON.stringify(args) });
  if (!r.ok) throw new Error(await r.text());
  const t = await r.text();
  return t ? JSON.parse(t) : null;
}

const C = {
  ink: "#141414", inkSoft: "#2E2E2E", bg: "#F3F2F0", surface: "#FFFFFF",
  primary: "#FF5A3C", primaryDark: "#E2452A", tint: "#FFF1ED",
  line: "#E7E5E1", muted: "#6B6B6B", danger: "#E5484D",
};
const STAGES = ["تم الاستلام", "قيد الفحص", "تحت الإصلاح", "جاهز للتسليم", "تم التسليم"];

function Wordmark({ light, size = 22 }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 2, fontFamily: "'Archivo', sans-serif", fontWeight: 900, fontSize: size, letterSpacing: "0.04em", color: light ? "#fff" : C.ink, lineHeight: 1 }}>
      ECTRA<span style={{ color: C.primary }}>.</span>
    </div>
  );
}

export default function SupportCenter({ onBack }) {
  const [tab, setTab] = useState("warranty");
  return (
    <div dir="rtl" style={{ background: C.bg, minHeight: "100vh", color: C.ink, fontFamily: "Tajawal, system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@800;900&family=Tajawal:wght@400;500;700;800&family=IBM+Plex+Mono:wght@500;600&display=swap');
        * { box-sizing: border-box; }
        input, select, textarea { font-family: inherit; }
        input:focus, select:focus, textarea:focus { outline: none; border-color: ${C.primary} !important; box-shadow: 0 0 0 3px rgba(255,90,60,0.18); }
        .sc-fade { animation: scFade .35s ease both; }
        @keyframes scFade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .sc-btn { transition: transform .12s ease, box-shadow .2s ease, background .2s, border-color .2s; cursor: pointer; }
        .sc-btn:active { transform: scale(.985); }
        .spin { animation: sp 1s linear infinite; } @keyframes sp { to { transform: rotate(360deg); } }
      `}</style>

      <header style={{ position: "sticky", top: 0, zIndex: 20, background: "rgba(243,242,240,0.9)", backdropFilter: "blur(10px)", borderBottom: `1px solid ${C.line}` }}>
        <div style={{ maxWidth: 920, margin: "0 auto", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src={mtcLogo} alt="MTC GROUP" style={{ height: 34, width: "auto", display: "block" }} />
            <div style={{ width: 1, height: 26, background: C.line }} />
            <Wordmark size={20} />
          </div>
          <button onClick={onBack} className="sc-btn" style={{ display: "flex", alignItems: "center", gap: 5, padding: "9px 14px", borderRadius: 10, border: `1.5px solid ${C.line}`, background: "#fff", color: C.ink, fontWeight: 700, fontSize: 13.5 }}>
            <ArrowRight size={16} /> الرئيسية
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 920, margin: "0 auto", padding: "26px 18px 50px" }}>
        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 20, background: C.tint, color: C.primaryDark, fontSize: 12, fontWeight: 800, letterSpacing: "0.03em" }}>
            <BadgeCheck size={14} /> خدمة عملاء معتمدة
          </span>
          <h1 style={{ fontSize: "clamp(22px,4vw,30px)", fontWeight: 800, margin: "14px 0 6px" }}>مركز خدمة عملاء MTC GROUP</h1>
          <p style={{ fontSize: 14.5, color: C.muted, margin: 0 }}>لمنتجات شركة LRT / ECTRA</p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, background: "#EAE8E4", padding: 5, borderRadius: 14, marginBottom: 22 }}>
          <TabBtn active={tab === "warranty"} onClick={() => setTab("warranty")} icon={ShieldCheck}>استعلام عن منتج</TabBtn>
          <TabBtn active={tab === "service"} onClick={() => setTab("service")} icon={Wrench}>استعلام عن صيانة</TabBtn>
          <TabBtn active={tab === "feedback"} onClick={() => setTab("feedback")} icon={MessageSquare}>تقييم وملاحظات</TabBtn>
        </div>

        <div className="sc-fade" key={tab}>
          {tab === "warranty" && <WarrantyLookup />}
          {tab === "service" && <ServiceLookup />}
          {tab === "feedback" && <FeedbackTab />}
        </div>

        <p style={{ textAlign: "center", color: C.muted, fontSize: 12.5, marginTop: 30 }}>مركز خدمة عملاء MTC GROUP — موزّع معتمد لمنتجات ECTRA · بنها</p>
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, icon: I, children }) {
  return (
    <button onClick={onClick} className="sc-btn" style={{ flex: 1, padding: "11px 6px", borderRadius: 10, border: "none", background: active ? C.ink : "transparent", color: active ? "#fff" : C.muted, fontWeight: 800, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
      <I size={15} color={active ? C.primary : C.muted} /> {children}
    </button>
  );
}

function Card({ children }) {
  return <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 22, padding: "24px 20px", boxShadow: "0 12px 40px rgba(20,20,20,0.06)" }}>{children}</div>;
}
function Field({ label, error, children }) {
  return <label style={{ display: "block" }}><span style={{ display: "block", fontSize: 13.5, fontWeight: 700, marginBottom: 7, color: C.ink }}>{label}</span>{children}{error && <span style={{ display: "block", fontSize: 12, color: C.danger, marginTop: 6, fontWeight: 600 }}>{error}</span>}</label>;
}
function Input({ value, onChange, placeholder, type = "text", inputMode, mono }) {
  return <input type={type} value={value} inputMode={inputMode} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: `1.5px solid ${C.line}`, fontSize: 15, fontFamily: mono ? "'IBM Plex Mono', monospace" : "inherit", letterSpacing: mono ? 1 : 0 }} />;
}
const btnPrimary = { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 16, padding: "13px", borderRadius: 12, background: C.primary, color: "#fff", fontWeight: 700, fontSize: 15, border: "none", cursor: "pointer", width: "100%", boxShadow: `0 8px 22px ${C.primary}55` };
function Row({ k, v, last }) { return <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: last ? "none" : `1px solid ${C.line}` }}><span style={{ fontSize: 13, color: C.muted, fontWeight: 600 }}>{k}</span><span style={{ fontSize: 13.5, color: C.ink, fontWeight: 700, maxWidth: "60%", textAlign: "left" }}>{v}</span></div>; }
function ErrBox({ children }) { return <div style={{ marginTop: 14, padding: "11px 14px", background: "#FDECEC", color: C.danger, borderRadius: 10, fontSize: 13, fontWeight: 600 }}>{children}</div>; }

/* ===================== استعلام عن منتج (أصالة / ضمان بالسيريال) =====================
   منطق على مرحلتين — قاعدة بيانات MTC GROUP فقط:
   1) ابحث في ectra_products (مخزون MTC GROUP) عن الرقم المسلسل.
      - غير موجود => "not_in_db": قد يكون ECTRA أصلي خارج MTC GROUP، أو مقلّد.
   2) لو موجود، ابحث في ectra_warranties عن شهادة ضمان:
      - صادر له شهادة => "warranty_active" أو "warranty_expired" حسب التاريخ.
      - غير صادر له شهادة => "no_warranty": أصلي من ECTRA لم يتم تفعيل الضمان.
*/
function WarrantyLookup() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState(null); // { status, product?, warranty? }
  const [scanOpen, setScanOpen] = useState(false);

  const runSearch = async (term0) => {
    const term = (term0 != null ? term0 : q).trim();
    if (!term) return;
    setLoading(true); setRes(null);
    try {
      const r = await sbRpc("ectra_verify_product", { p_term: term });
      setRes(r && r.status ? r : { status: "not_in_db" });
    } catch {
      setRes({ status: "error" });
    } finally {
      setLoading(false);
    }
  };

  const onScanned = (text) => {
    setScanOpen(false);
    setQ(text);
    runSearch(text);
  };

  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 13, background: C.tint, display: "grid", placeItems: "center" }}><ShieldCheck size={22} color={C.primary} /></div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16 }}>استعلام عن منتج أصلي</div>
          <div style={{ fontSize: 12.5, color: C.muted }}>تحقق من أصالة المنتج وحالة الضمان بالرقم التسلسلي — أو امسح الباركود</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <Input value={q} onChange={setQ} placeholder="الرقم التسلسلي (Serial) أو رقم الشهادة" mono />
        <button onClick={() => runSearch()} className="sc-btn" style={{ padding: "0 18px", borderRadius: 12, border: "none", background: C.primary, color: "#fff", fontWeight: 700, fontSize: 14.5, display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
          {loading ? <Loader2 size={17} className="spin" /> : <Search size={17} />} بحث
        </button>
      </div>

      <button onClick={() => setScanOpen(true)} className="sc-btn" style={{ marginTop: 10, width: "100%", padding: "12px", borderRadius: 12, border: `1.5px solid ${C.line}`, background: "#fff", color: C.ink, fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <ScanLine size={18} color={C.primary} /> مسح الباركود بالكاميرا
      </button>

      {res && res.status !== "error" && <ProductResult res={res} />}
      {res && res.status === "error" && <ErrBox>تعذّر الاتصال بقاعدة البيانات، حاول مرة أخرى.</ErrBox>}

      {scanOpen && <ScannerModal onClose={() => setScanOpen(false)} onResult={onScanned} />}
    </Card>
  );
}


function ProductResult({ res }) {
  const { status, product, warranty } = res;

  // النتيجة 1: غير موجود في قاعدة بيانات MTC GROUP
  if (status === "not_in_db") {
    return (
      <div className="sc-fade" style={{ marginTop: 18, border: `1.5px solid #F3D6A4`, borderRadius: 16, padding: 18, background: "#FFF8EC" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <AlertTriangle size={20} color="#B5780E" />
          <div style={{ fontWeight: 800, fontSize: 15.5, color: "#8A5A00" }}>الرقم غير موجود في قاعدة بيانات MTC GROUP</div>
        </div>
        <div style={{ fontSize: 13.5, color: "#6B5520", lineHeight: 1.85 }}>
          تأكّد من إدخال الرقم المسلسل بشكل صحيح. هذا لا يعني بالضرورة أن المنتج غير أصلي:
          <ul style={{ margin: "10px 0 0", paddingInlineStart: 18 }}>
            <li style={{ marginBottom: 4 }}>قد يكون منتج <b>ECTRA أصلي</b> لكن تم شراؤه من <b>خارج MTC GROUP</b>.</li>
            <li>أو قد يكون <b>منتجاً مقلّداً</b> — <span style={{ color: C.danger, fontWeight: 800 }}>احترس</span>.</li>
          </ul>
        </div>
      </div>
    );
  }

  // النتيجة 2ب: موجود لكن لم يُصدر له شهادة ضمان
  if (status === "no_warranty") {
    return (
      <div className="sc-fade" style={{ marginTop: 18, border: `1.5px dashed ${C.line}`, borderRadius: 16, padding: 18, background: C.bg }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 8, background: C.ink, color: "#fff", fontSize: 11.5, fontWeight: 700, marginBottom: 12 }}>
          <BadgeCheck size={13} color={C.primary} /> منتج أصلي من ECTRA
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 6 }}>لم يتم تفعيل الضمان</div>
        <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.8 }}>المنتج مُسجّل لدى MTC GROUP وأصلي من ECTRA، لكن لم تُصدر له شهادة ضمان بعد. يمكنك تفعيل الضمان من خلال المركز.</div>
        {product && (
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${C.line}` }}>
            <Row k="المنتج" v={product.model} />
            {product.serial && <Row k="الرقم التسلسلي" v={product.serial} last />}
          </div>
        )}
      </div>
    );
  }

  // النتيجة 2أ: موجود وصادر له شهادة ضمان (ساري / منتهي)
  const active = status === "warranty_active";
  return (
    <div className="sc-fade" style={{ marginTop: 18, border: `1.5px solid ${active ? "#BFE3C5" : C.line}`, borderRadius: 16, padding: 18, background: active ? "#F2FBF3" : C.bg }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 8, background: C.ink, color: "#fff", fontSize: 11.5, fontWeight: 700 }}>
          <BadgeCheck size={13} color={C.primary} /> منتج أصلي · صادر له شهادة ضمان
        </div>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 20, background: active ? "#1E7B36" : "#EAE8E4", color: active ? "#fff" : C.muted, fontSize: 12, fontWeight: 800 }}>
          {active ? <Check size={13} /> : <Clock size={13} />}
          {active ? "الضمان ساري" : "الضمان منتهي"}
        </span>
      </div>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: active ? "#1E7B36" : C.danger, marginBottom: 10 }}>
        {active ? `الضمان ساري حتى ${warranty.end_date}` : `انتهى الضمان بتاريخ ${warranty.end_date}`}
      </div>
      <Row k="المنتج" v={warranty.model || (product && product.model)} />
      {warranty.serial && <Row k="الرقم التسلسلي" v={warranty.serial} />}
      <Row k="رقم الشهادة" v={warranty.cert_no} />
      <Row k="بداية الضمان" v={warranty.start_date} />
      <Row k="نهاية الضمان" v={warranty.end_date} last />
    </div>
  );
}

/* ماسح الباركود — يستخدم html5-qrcode (كاميرا الموبايل) ويدعم أيضاً سكانر الباركود ككيبورد */
function ScannerModal({ onClose, onResult }) {
  const [err, setErr] = useState("");
  const [manual, setManual] = useState("");
  const regionId = "sc-qr-region";
  const scannerRef = useRef(null);

  useEffect(() => {
    let stopped = false;
    let html5Qr = null;
    (async () => {
      try {
        const mod = await import("html5-qrcode");
        const { Html5Qrcode } = mod;
        html5Qr = new Html5Qrcode(regionId, { verbose: false });
        scannerRef.current = html5Qr;
        await html5Qr.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 160 }, useBarCodeDetectorIfSupported: true, aspectRatio: 1.4 },
          (decoded) => {
            if (stopped) return;
            stopped = true;
            try { html5Qr.stop().catch(() => {}); } catch {}
            onResult(String(decoded).trim());
          },
          () => {}
        );
      } catch (e) {
        setErr("تعذّر تشغيل الكاميرا. تأكد من السماح بالوصول للكاميرا، أو استخدم سكانر الباركود أو الإدخال اليدوي.");
      }
    })();
    return () => {
      stopped = true;
      const s = scannerRef.current;
      if (s) { try { s.stop().then(() => s.clear()).catch(() => {}); } catch {} }
    };
  }, [onResult]);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(20,20,20,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 18 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", width: "100%", maxWidth: 420, borderRadius: 22, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.35)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: `1px solid ${C.line}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, fontSize: 15 }}>
            <Camera size={18} color={C.primary} /> مسح الباركود
          </div>
          <button onClick={onClose} aria-label="إغلاق" style={{ width: 32, height: 32, borderRadius: "50%", border: "none", background: C.bg, cursor: "pointer", display: "grid", placeItems: "center" }}><X size={16} /></button>
        </div>

        <div style={{ padding: 16 }}>
          <div id={regionId} style={{ width: "100%", borderRadius: 14, overflow: "hidden", background: "#000", minHeight: 200 }} />
          {err && <div style={{ marginTop: 12, padding: "10px 12px", background: "#FDECEC", color: C.danger, borderRadius: 10, fontSize: 12.5, fontWeight: 600, lineHeight: 1.6 }}>{err}</div>}
          <div style={{ fontSize: 12, color: C.muted, textAlign: "center", marginTop: 10 }}>وجّه الكاميرا نحو الباركود — أو استخدم سكانر الباركود مباشرةً</div>

          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <Input value={manual} onChange={setManual} placeholder="أو أدخل الرقم يدوياً" mono />
            <button onClick={() => manual.trim() && onResult(manual.trim())} className="sc-btn" style={{ padding: "0 16px", borderRadius: 12, border: "none", background: C.ink, color: "#fff", fontWeight: 700, fontSize: 14, whiteSpace: "nowrap" }}>تأكيد</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===================== استعلام عن صيانة ===================== */
function ServiceLookup() {
  const [q, setQ] = useState("");
  const [res, setRes] = useState(undefined);
  const [loading, setLoading] = useState(false);
  const search = async () => {
    if (!q.trim()) return; setLoading(true); setRes(undefined);
    try { const rows = await sbRpc("ectra_lookup_service", { p_code: q.trim() }); setRes(rows && rows.length ? rows[0] : null); }
    catch { setRes(null); } finally { setLoading(false); }
  };
  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 13, background: C.tint, display: "grid", placeItems: "center" }}><Wrench size={22} color={C.primary} /></div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16 }}>استعلام عن صيانة</div>
          <div style={{ fontSize: 12.5, color: C.muted }}>اكتب رقم الطلب لمتابعة مرحلة الصيانة الحالية</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <Input value={q} onChange={setQ} placeholder="MTC-EK-XXXXX" mono />
        <button onClick={search} className="sc-btn" style={{ padding: "0 18px", borderRadius: 12, border: "none", background: C.primary, color: "#fff", fontWeight: 700, fontSize: 14.5, display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
          {loading ? <Loader2 size={17} className="spin" /> : <Search size={17} />} بحث
        </button>
      </div>

      {res === null && (
        <div className="sc-fade" style={{ textAlign: "center", padding: "26px 0", color: C.muted }}>
          <FileText size={34} color={C.line} style={{ marginBottom: 10 }} />
          <div style={{ fontWeight: 700, color: C.ink }}>لا يوجد طلب بهذا الرقم</div>
          <div style={{ fontSize: 13.5, marginTop: 4 }}>راجع رقم الطلب وحاول تاني.</div>
        </div>
      )}

      {res && (
        <div className="sc-fade" style={{ marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, padding: "14px 16px", background: C.bg, borderRadius: 14 }}>
            <div><div style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>رقم الطلب</div><div style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, color: C.primary, fontSize: 16 }}>{res.code}</div></div>
            <div style={{ textAlign: "left" }}><div style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>المنتج</div><div style={{ fontWeight: 700, fontSize: 14 }}>{res.model}</div></div>
          </div>
          <div style={{ position: "relative", paddingRight: 8 }}>
            {STAGES.map((s, i) => {
              const dn = i < res.stage, cur = i === res.stage;
              return (
                <div key={s} style={{ display: "flex", gap: 12, alignItems: "flex-start", paddingBottom: i < STAGES.length - 1 ? 22 : 0, position: "relative" }}>
                  {i < STAGES.length - 1 && <div style={{ position: "absolute", top: 26, right: 12, bottom: 0, width: 2, background: dn ? C.ink : C.line }} />}
                  <div style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center", background: dn ? C.ink : cur ? C.primary : "#EAE8E4", color: dn || cur ? "#fff" : C.muted, zIndex: 1, boxShadow: cur ? `0 0 0 4px ${C.primary}33` : "none" }}>{dn ? <Check size={14} /> : <span style={{ fontSize: 11, fontWeight: 700 }}>{i + 1}</span>}</div>
                  <div style={{ paddingTop: 2 }}><div style={{ fontWeight: cur ? 800 : 700, fontSize: 14.5, color: dn || cur ? C.ink : C.muted }}>{s}</div>{cur && <div style={{ fontSize: 12.5, color: C.primary, fontWeight: 600, marginTop: 2 }}>المرحلة الحالية</div>}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}

/* ===================== تقييم وملاحظات ===================== */
function FeedbackForm({ onSubmitted }) {
  const [name, setName] = useState("");
  const [ref, setRef] = useState("");
  const [rating, setRating] = useState(0);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState({});
  const [saving, setSaving] = useState(false);
  const [apiErr, setApiErr] = useState("");
  const [done, setDone] = useState(false);

  const submit = async () => {
    const e = {};
    if (!name.trim()) e.name = "اكتب اسمك أو رقم موبايلك";
    if (!rating) e.rating = "اختر تقييمك بالنجوم";
    if (!msg.trim() || msg.trim().length < 5) e.msg = "اكتب ملاحظتك (5 حروف على الأقل)";
    setErr(e);
    if (Object.keys(e).length) return;
    setSaving(true); setApiErr("");
    try {
      await sbRpc("ectra_feedback_submit", { p_customer_name: name.trim(), p_reference: nz(ref.trim()), p_rating: rating, p_message: msg.trim() });
      setDone(true);
      onSubmitted && onSubmitted();
    } catch (ex) {
      setApiErr("تعذّر إرسال التقييم: " + String(ex).slice(0, 120));
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <Card>
        <div className="sc-fade" style={{ textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: C.ink, display: "grid", placeItems: "center", margin: "0 auto 14px" }}><Check size={32} color="#fff" /></div>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 6px" }}>شكراً لك على ملاحظتك</h2>
          <p style={{ color: C.muted, fontSize: 14, margin: 0 }}>تم استلام تقييمك وسنأخذه في الاعتبار لتحسين خدماتنا.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 13, background: C.tint, display: "grid", placeItems: "center" }}><MessageSquare size={22} color={C.primary} /></div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16 }}>تقييم وملاحظات</div>
          <div style={{ fontSize: 12.5, color: C.muted }}>رأيك يهمنا لتحسين منتجات وخدمات ECTRA</div>
        </div>
      </div>
      <div style={{ display: "grid", gap: 16 }}>
        <Field label="الاسم / رقم الموبايل" error={err.name}><Input value={name} onChange={setName} placeholder="اكتب اسمك أو رقم موبايلك" /></Field>
        <Field label="رقم المنتج أو العملية (اختياري)"><Input value={ref} onChange={setRef} placeholder="رقم تسلسلي / رقم شهادة / رقم طلب صيانة" mono /></Field>
        <Field label="تقييمك" error={err.rating}>
          <div style={{ display: "flex", gap: 6 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)} className="sc-btn" style={{ border: "none", background: "transparent", padding: 4 }}>
                <Star size={30} fill={n <= rating ? C.primary : "none"} color={n <= rating ? C.primary : C.line} />
              </button>
            ))}
          </div>
        </Field>
        <Field label="ملاحظتك" error={err.msg}>
          <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={4} placeholder="اكتب رأيك أو ملاحظتك عن المنتج أو الخدمة..." style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: `1.5px solid ${err.msg ? C.danger : C.line}`, fontSize: 15, resize: "vertical", lineHeight: 1.7 }} />
        </Field>
      </div>
      {apiErr && <ErrBox>{apiErr}</ErrBox>}
      <button onClick={submit} disabled={saving} className="sc-btn" style={btnPrimary}>
        {saving ? <Loader2 size={18} className="spin" color="#fff" /> : <Send size={18} />} إرسال التقييم
      </button>
    </Card>
  );
}

/* ===================== تبويب التقييم = فورم + آراء العملاء ===================== */
function FeedbackTab() {
  const [reload, setReload] = useState(0);
  return (
    <div style={{ display: "grid", gap: 22 }}>
      <FeedbackForm onSubmitted={() => setReload((r) => r + 1)} />
      <CustomerReviews reload={reload} />
    </div>
  );
}

const REVIEWS_PER_PAGE = 10;
const pagerBtn = (disabled) => ({ padding: "9px 16px", borderRadius: 10, border: `1.5px solid ${C.line}`, background: "#fff", color: disabled ? C.muted : C.ink, fontWeight: 700, fontSize: 13.5, cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.5 : 1 });

function CustomerReviews({ reload }) {
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  // عند وصول تقييم جديد: ارجع لأول صفحة عشان يظهر فوق
  useEffect(() => { setPage(0); }, [reload]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true); setFailed(false);
      try {
        const data = await sbRpc("ectra_feedback_public", { p_limit: REVIEWS_PER_PAGE, p_offset: page * REVIEWS_PER_PAGE });
        if (!alive) return;
        const arr = Array.isArray(data) ? data : [];
        setRows(arr);
        const t = arr.length ? Number(arr[0].total ?? arr[0].total_count ?? arr.length) : (page === 0 ? 0 : total);
        setTotal(Number.isFinite(t) ? t : arr.length);
      } catch (ex) {
        if (alive) { setFailed(true); setRows([]); }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [page, reload]);

  const pages = Math.max(1, Math.ceil(total / REVIEWS_PER_PAGE));
  const Stars = ({ n }) => <span style={{ display: "inline-flex", gap: 1 }}>{[1, 2, 3, 4, 5].map((i) => <Star key={i} size={14} fill={i <= n ? C.primary : "none"} color={i <= n ? C.primary : C.line} />)}</span>;

  if (failed) return null;                 // لو الدالة مش متاحة: نخفي القسم بدل ما نكسر الصفحة
  if (loading && !rows.length) return (<Card><div style={{ display: "grid", placeItems: "center", padding: 20 }}><Loader2 size={22} className="spin" color={C.primary} /></div></Card>);
  if (!rows.length) return null;           // لسه مفيش آراء منشورة

  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 13, background: C.tint, display: "grid", placeItems: "center" }}><Star size={22} color={C.primary} fill={C.primary} /></div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16 }}>آراء العملاء</div>
          <div style={{ fontSize: 12.5, color: C.muted }}>{total} رأي منشور</div>
        </div>
      </div>
      <div style={{ display: "grid", gap: 10 }}>
        {rows.map((r, i) => (
          <div key={r.id || i} style={{ border: `1px solid ${C.line}`, borderRadius: 14, padding: "12px 14px", background: "#fff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Stars n={Number(r.rating)} />
                <span style={{ fontWeight: 800, fontSize: 14 }}>{r.customer_name}</span>
              </div>
              <span style={{ fontSize: 11, color: C.muted }}>{String(r.created_at || "").slice(0, 10)}</span>
            </div>
            <div style={{ fontSize: 13.5, color: C.inkSoft, lineHeight: 1.8 }}>{r.message}</div>
          </div>
        ))}
      </div>
      {pages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 16 }}>
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="sc-btn" style={pagerBtn(page === 0)}>السابق</button>
          <span style={{ fontSize: 13, color: C.muted, fontWeight: 700 }}>{page + 1} / {pages}</span>
          <button onClick={() => setPage((p) => Math.min(pages - 1, p + 1))} disabled={page >= pages - 1} className="sc-btn" style={pagerBtn(page >= pages - 1)}>التالي</button>
        </div>
      )}
    </Card>
  );
}
