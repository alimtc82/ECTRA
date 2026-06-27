import React, { useRef, useState } from "react";
import { Zap, Headphones, BadgeCheck, ShieldCheck, Award, ArrowLeft, ChevronLeft, CheckCircle2, X, MapPin, Globe, AtSign } from "lucide-react";
import hero from "./assets/hero.jpg";
import c22 from "./assets/c22.jpg";
import c25 from "./assets/c25.jpg";
import c35 from "./assets/c35.jpg";
import pbDual from "./assets/pb_dual.jpg";
import pbLux20 from "./assets/pb_lux20.jpg";
import pbLux10 from "./assets/pb_lux10.jpg";
import anc from "./assets/anc.jpg";
import echoBlack from "./assets/echo_black.jpg";
import echoWhite from "./assets/echo_white.jpg";
import mtcLogo from "./assets/mtc-logo.png";

const C = { ink: "#141414", inkSoft: "#2E2E2E", bg: "#F3F2F0", surface: "#FFFFFF", primary: "#FF5A3C", primaryDark: "#E2452A", tint: "#FFF1ED", line: "#E7E5E1", muted: "#6B6B6B" };

const CHARGERS = [
  {
    img: c22, name: "Fast Charger 22.5W", tag: "QC + PD",
    specs: { "القدرة القصوى": "22.5W", "المنافذ": "USB-A (QC) + Type-C (PD)", "خرج USB-A (QC)": "5V-3A · 9V-2A · 12V-1.5A", "خرج Type-C (PD)": "5V-3A · 9V-2A · 12V-1.5A", "تقنيات الشحن": "Quick Charge + Power Delivery", "المعيار الكهربائي": "AC 100-240V · 50/60Hz", "الحماية": "ضد الحرارة الزائدة والتيار الزائد" },
    highlights: ["شحن سريع متعدد البروتوكولات", "منفذان في آن واحد", "حجم صغير ومناسب للسفر"],
  },
  {
    img: c25, name: "Fast Charger 25W", tag: "PD · PPS",
    specs: { "القدرة القصوى": "25W", "المنفذ": "Type-C (PD)", "خرج Type-C": "5V-3A · 9V-2.77A · 12V-2.08A", "تقنيات الشحن": "Power Delivery 3.0 · PPS", "متوافق مع": "Samsung Super Fast Charging", "المعيار الكهربائي": "AC 100-240V · 50/60Hz", "الحماية": "ضد الحرارة الزائدة والتيار الزائد" },
    highlights: ["مثالي لأجهزة Samsung", "دعم PPS لشحن أذكى", "تصميم مدمج"],
  },
  {
    img: c35, name: "Fast Charger 35W", tag: "PD · PPS",
    specs: { "القدرة القصوى": "35W", "المنفذ": "Type-C (PD)", "خرج Type-C": "5V-3A · 9V-3A · 12V-2.91A · 15V-2.33A", "تقنيات الشحن": "Power Delivery 3.0 · PPS", "مناسب لـ": "الهواتف والأجهزة اللوحية", "المعيار الكهربائي": "AC 100-240V · 50/60Hz", "الحماية": "ضد الحرارة الزائدة والتيار الزائد" },
    highlights: ["أعلى قدرة في الفئة", "يشحن الأجهزة اللوحية", "دعم PPS"],
  },
];
const CATALOG = [
  {
    img: pbDual, name: "Dual Power Bank 20000", tag: "20,000mAh · 22.5W",
    specs: { "السعة": "20000mAh (77Wh)", "الأبعاد": "117.5 × 71 × 28.5 مم", "الوزن": "326g", "الدخل": "Type-C: 5V-3A · 9V-2A · 12V-1.5A (18W MAX)", "الخرج (USB-A)": "10V-2.25A · 5V-3A · 9V-2A · 12V-1.5A (22.5W MAX)", "الخرج (Type-C)": "10V-2.25A · 5V-3A · 9V-2.22A · 12V-1.67A (22.5W MAX)", "مادة الهيكل": "PC+ABS مقاوم للهب" },
    highlights: ["شحن 4 أجهزة في آن واحد", "كابلات USB-C و Lightning مدمجة", "شاشة بطارية رقمية", "آمن للطيران (أقل من 100Wh)"],
  },
  {
    img: pbLux20, name: "Lux Power Bank 20000", tag: "20,000mAh · PU Leather",
    specs: { "السعة": "20000mAh (74Wh)", "الأبعاد": "139.5 × 70 × 29 مم", "الوزن": "412g", "الدخل": "Type-C: 5V-3A · 9V-2A · 12V-1.5A (18W MAX)", "الخرج (USB-A)": "10V-2.25A · 5V-3A · 9V-2A · 12V-1.5A (22.5W MAX)", "الخرج (Type-C)": "5V-3A · 9V-2.22A · 12V-1.67A", "مادة الهيكل": "PC+ABS مقاوم للهب · مغطى بجلد PU" },
    highlights: ["تصميم فاخر بجلد PU", "منفذان USB-C و USB-A", "شاشة LED للطاقة", "توافق واسع Android و Apple"],
  },
  {
    img: pbLux10, name: "Lux Power Bank 10000", tag: "10,000mAh · Ultra-Slim",
    specs: { "السعة": "10000mAh (37Wh)", "الأبعاد": "139.5 × 70 × 16.9 مم", "الوزن": "225g", "الدخل": "Type-C: 5V-3A · 9V-2A · 12V-1.5A (18W MAX)", "الخرج (USB-A)": "10V-2.25A · 5V-3A · 9V-2A · 12V-1.5A (22.5W MAX)", "الخرج (Type-C)": "5V-3A · 9V-2.22A · 12V-1.67A", "مادة الهيكل": "PC+ABS مقاوم للهب · مغطى بجلد PU" },
    highlights: ["تصميم نحيف جداً", "فئة رجال الأعمال", "شاشة LED للطاقة", "آمن للطيران"],
  },
  {
    img: echoBlack, name: "Earbuds Echo — Black", tag: "BT 6.0 · 30h",
    specs: { "الدرايفر": "13مم مزدوج المغناطيس", "عزل الضوضاء": "ENC للمكالمات", "إصدار البلوتوث": "BT 6.0", "كودك الصوت": "AAC / SBC", "نطاق البلوتوث": "10-15 متر", "سعة البطارية": "35mAh (السماعة) · 320mAh (العلبة)", "عمر البطارية": "7 ساعات (السماعة) · 30 ساعة (مع العلبة)", "وقت الشحن": "أقل من ساعة (السماعة) · ساعتان (العلبة)", "منفذ الشحن": "USB Type-C", "الوزن": "4g (السماعة) · 29g (العلبة)" },
    highlights: ["تشغيل 30 ساعة", "درايفر باس 13مم", "بلوتوث 6.0 ثابت", "زمن استجابة منخفض للألعاب"],
  },
  {
    img: echoWhite, name: "Earbuds Echo — White", tag: "BT 6.0 · 30h",
    specs: { "الدرايفر": "13مم مزدوج المغناطيس", "عزل الضوضاء": "ENC للمكالمات", "إصدار البلوتوث": "BT 6.0", "كودك الصوت": "AAC / SBC", "نطاق البلوتوث": "10-15 متر", "سعة البطارية": "35mAh (السماعة) · 320mAh (العلبة)", "عمر البطارية": "7 ساعات (السماعة) · 30 ساعة (مع العلبة)", "وقت الشحن": "أقل من ساعة (السماعة) · ساعتان (العلبة)", "منفذ الشحن": "USB Type-C", "الوزن": "4g (السماعة) · 29g (العلبة)" },
    highlights: ["تشغيل 30 ساعة", "درايفر باس 13مم", "بلوتوث 6.0 ثابت", "زمن استجابة منخفض للألعاب"],
  },
  {
    img: anc, name: "Earbuds Free ANC", tag: "ANC · 60h",
    specs: { "الدرايفر": "10مم مزدوج المغناطيس", "عزل الضوضاء": "ENC للمكالمات + ANC", "إصدار البلوتوث": "BT 5.3", "كودك الصوت": "AAC / SBC", "نطاق البلوتوث": "10-15 متر", "سعة البطارية": "40mAh (السماعة) · 800mAh (العلبة)", "عمر البطارية": "7 ساعات (السماعة) · 60 ساعة (مع العلبة)", "وقت الشحن": "أقل من ساعة (السماعة) · ساعتان (العلبة)", "منفذ الشحن": "USB Type-C", "الوزن": "3.8g (السماعة) · 43g (العلبة)", "مقاومة الماء": "IPX4" },
    highlights: ["تشغيل 60 ساعة", "إلغاء ضوضاء ANC + وضع الشفافية", "أوضاع EQ متعددة", "اتصال بجهازين + مقاومة ماء IPX4"],
  },
];
const FEATURES = [
  { icon: Zap, t: "شحن فائق السرعة", s: "شواحن حتى 35W بتقنيات PD و QC و PPS." },
  { icon: Headphones, t: "نقاء صوت مذهل", s: "سماعات بصوت غامر وعزل ضوضاء ENC و ANC." },
  { icon: BadgeCheck, t: "أصالة مضمونة", s: "منتجات ECTRA أصلية 100% مع شهادة تحقق." },
  { icon: ShieldCheck, t: "ضمان مزدوج", s: "بضمان MTC GROUP نفسها والوكيل المصري LRT." },
];

const SECRET_CLICKS = 5;
const SECRET_WINDOW_MS = 1500;

function Wordmark({ light, size = 24, onSecret }) {
  const clicksRef = useRef(0);
  const timerRef = useRef(null);
  const handleClick = () => {
    if (!onSecret) return;
    clicksRef.current += 1;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => { clicksRef.current = 0; }, SECRET_WINDOW_MS);
    if (clicksRef.current >= SECRET_CLICKS) { clicksRef.current = 0; clearTimeout(timerRef.current); onSecret(); }
  };
  return (
    <div onClick={handleClick} style={{ display: "flex", alignItems: "baseline", gap: 2, fontFamily: "'Archivo', sans-serif", fontWeight: 900, fontSize: size, letterSpacing: "-0.01em", color: light ? "#fff" : C.ink, lineHeight: 1, userSelect: "none", cursor: onSecret ? "default" : "inherit" }}>
      ECTRA<span style={{ color: C.primary }}>.</span>
    </div>
  );
}

export default function Landing({ onEnter, onEnterAdmin }) {
  const goSupport = onEnter || (() => {});
  const goAdmin = onEnterAdmin || onEnter || (() => {});
  const [selected, setSelected] = useState(null);
  const [policy, setPolicy] = useState(null);
  const scrollToCatalog = () => { const el = document.getElementById("catalog"); if (el) el.scrollIntoView({ behavior: "smooth" }); };

  const featured = CATALOG.find((p) => p.name.includes("ANC")) || CATALOG[0];
  const others = CATALOG.filter((p) => p !== featured);

  const wrap = { maxWidth: 1180, margin: "0 auto" };
  const pillNeutral = { padding: "4px 11px", background: "#E7E5E1", color: C.ink, fontSize: 10.5, fontWeight: 800, borderRadius: 999 };
  const pillPrimary = { padding: "4px 11px", background: "rgba(255,90,60,0.12)", color: C.primary, fontSize: 10.5, fontWeight: 800, borderRadius: 999 };

  const Pills = ({ tag }) => {
    const parts = tag.split("·").map((s) => s.trim());
    if (parts.length === 1) return <span style={pillPrimary}>{parts[0]}</span>;
    return (<><span style={pillNeutral}>{parts[0]}</span><span style={pillPrimary}>{parts.slice(1).join(" · ")}</span></>);
  };

  return (
    <div dir="rtl" style={{ background: C.bg, color: C.ink, fontFamily: "Tajawal, system-ui, sans-serif", minHeight: "100vh", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@800;900&family=Tajawal:wght@400;500;700;800&family=IBM+Plex+Mono:wght@500;600&display=swap');
        * { box-sizing: border-box; }
        .glass { background: rgba(243,242,240,0.72); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
        .lift { transition: transform .3s cubic-bezier(.34,1.56,.64,1), box-shadow .3s ease, border-color .2s; }
        .lift:hover { transform: translateY(-8px) scale(1.02); box-shadow: 0 20px 40px rgba(0,0,0,0.08); }
        .btn { transition: transform .15s ease, background .2s ease, box-shadow .2s ease; cursor: pointer; }
        .btn:active { transform: scale(.97); }
        @keyframes floaty { 0%,100%{ transform: translateY(0);} 50%{ transform: translateY(-10px);} }
        .floaty { animation: floaty 6s ease-in-out infinite; }
        @keyframes fadeUp { from{ opacity:0; transform: translateY(14px);} to{ opacity:1; transform:none;} }
        .fade { animation: fadeUp .5s ease both; }
        @media (prefers-reduced-motion: reduce){ .lift,.btn,.floaty,.fade{ animation:none !important; transition:none !important; } }
      `}</style>

      {/* Header */}
      <header className="glass" style={{ position: "sticky", top: 0, zIndex: 50, borderBottom: "1px solid rgba(255,255,255,0.5)" }}>
        <div style={{ ...wrap, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Wordmark size={24} onSecret={goAdmin} />
            <span style={{ display: "inline-block", background: "rgba(255,90,60,0.1)", color: C.primary, fontSize: 10, fontWeight: 800, padding: "4px 11px", borderRadius: 999, border: "1px solid rgba(255,90,60,0.2)", letterSpacing: "0.12em", textTransform: "uppercase" }}>Authorized Distributor</span>
          </div>
          <img src={mtcLogo} alt="MTC GROUP" style={{ height: 44, width: "auto", objectFit: "contain", display: "block" }} />
        </div>
      </header>

      {/* Hero */}
      <section style={{ position: "relative", overflow: "hidden", background: `linear-gradient(135deg, ${C.ink}, #1c1c1c 50%, ${C.inkSoft})`, color: "#fff" }}>
        <div style={{ position: "absolute", top: "20%", right: -80, width: 384, height: 384, background: C.primary, opacity: 0.1, filter: "blur(120px)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", bottom: "15%", left: -80, width: 384, height: 384, background: C.primary, opacity: 0.1, filter: "blur(120px)", borderRadius: "50%" }} />
        <div style={{ ...wrap, position: "relative", padding: "72px 20px 80px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 44, alignItems: "center" }}>
          <div className="fade" style={{ zIndex: 2 }}>
            <h1 style={{ fontWeight: 800, fontSize: "clamp(32px, 5vw, 48px)", lineHeight: 1.25, margin: "0 0 18px" }}>
              جودة <span style={{ color: C.primary }}>ECTRA</span> الفائقة..<br />
              بضمان <span style={{ borderBottom: `4px solid ${C.primary}`, paddingBottom: 2 }}>MTC GROUP</span> المعتمد
            </h1>
            <p style={{ fontSize: "clamp(15px, 2.2vw, 18px)", color: "rgba(255,255,255,0.7)", lineHeight: 1.8, margin: "0 0 28px", maxWidth: 540 }}>
              أي منتج ECTRA أصلي تشتريه من MTC GROUP مشمول بضمان MTC GROUP نفسها — بالإضافة لضمان الوكيل المصري LRT. نحن نضمن لك الأصالة، الأداء، وخدمة ما بعد البيع المتميزة.
            </p>
            <button onClick={goSupport} className="btn" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "16px 36px", borderRadius: 18, border: "none", background: C.primary, color: "#fff", fontWeight: 800, fontSize: 16, fontFamily: "inherit", boxShadow: `0 14px 32px ${C.primary}40` }}>
              خدمة العملاء — ادخل من هنا <ArrowLeft size={20} />
            </button>
          </div>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <div className="floaty" style={{ position: "relative", width: "100%", maxWidth: 420, aspectRatio: "1 / 1" }}>
              <img src={hero} alt="منتجات ECTRA من MTC GROUP" style={{ width: "100%", height: "100%", objectFit: "contain", position: "relative", zIndex: 2, borderRadius: 20 }} />
              <div style={{ position: "absolute", inset: 0, border: "1px solid rgba(255,255,255,0.1)", borderRadius: "50%", transform: "scale(1.1)" }} />
              <div style={{ position: "absolute", inset: 0, border: "1px solid rgba(255,255,255,0.06)", borderRadius: "50%", transform: "scale(1.25)" }} />
            </div>
          </div>
        </div>
      </section>

      {/* Endorsement */}
      <section style={{ ...wrap, padding: "0 20px", marginTop: -56, position: "relative", zIndex: 20 }}>
        <div className="glass" style={{ borderRadius: 24, padding: "24px 26px", boxShadow: "0 18px 48px rgba(20,20,20,0.1)", border: "1px solid rgba(255,255,255,0.6)", display: "flex", flexWrap: "wrap", gap: 24, justifyContent: "space-around", alignItems: "center" }}>
          {[{ I: BadgeCheck, t: "100% أصلي", s: "منتجات معتمدة بالكامل" }, { I: ShieldCheck, t: "ضمان MTC", s: "حماية شاملة من مجموعتنا" }, { I: Award, t: "وكيل LRT", s: "تغطية الوكيل المصري الرسمي" }].map((x) => (
            <div key={x.t} style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(255,90,60,0.1)", color: C.primary, display: "grid", placeItems: "center", flexShrink: 0 }}><x.I size={26} /></div>
              <div><div style={{ fontWeight: 800, fontSize: 17 }}>{x.t}</div><div style={{ fontSize: 13, color: C.muted }}>{x.s}</div></div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ ...wrap, padding: "80px 20px 8px" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: C.primary, marginBottom: 16 }} />
          <h2 style={{ fontWeight: 800, fontSize: "clamp(26px, 4vw, 36px)", margin: "0 0 12px" }}>لماذا تختار ECTRA؟</h2>
          <p style={{ color: C.muted, maxWidth: 560, margin: "0 auto", lineHeight: 1.8 }}>نوفر لك التكنولوجيا التي تدوم طويلاً مع أعلى معايير الجودة العالمية.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 22 }}>
          {FEATURES.map((f) => (
            <div key={f.t} className="lift" style={{ background: C.tint, padding: 30, borderRadius: 24 }}>
              <f.icon size={34} color={C.primary} style={{ marginBottom: 18 }} />
              <div style={{ fontWeight: 700, fontSize: 19, marginBottom: 8 }}>{f.t}</div>
              <div style={{ color: C.muted, fontSize: 14, lineHeight: 1.7 }}>{f.s}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Chargers */}
      <section style={{ background: "#f3f3f4", padding: "80px 20px", marginTop: 64 }}>
        <div style={wrap}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12, marginBottom: 44 }}>
            <div>
              <h2 style={{ fontWeight: 800, fontSize: "clamp(24px, 3.5vw, 30px)", margin: "0 0 6px" }}>الشواحن المتطورة</h2>
              <p style={{ color: C.muted, margin: 0 }}>شحن سريع وآمن لكل أجهزتك الذكية</p>
            </div>
            <button onClick={scrollToCatalog} className="btn" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", color: C.primary, fontWeight: 800, fontSize: 14, fontFamily: "inherit" }}>عرض الكل <ChevronLeft size={18} /></button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 28 }}>
            {CHARGERS.map((p) => (
              <button key={p.name} onClick={() => setSelected(p)} className="lift btn" style={{ background: "#fff", borderRadius: 24, padding: 24, border: "1px solid transparent", boxShadow: "0 4px 14px rgba(20,20,20,0.04)", textAlign: "right", font: "inherit", cursor: "pointer" }}>
                <div style={{ aspectRatio: "1 / 1", background: C.bg, borderRadius: 16, marginBottom: 22, display: "flex", alignItems: "center", justifyContent: "center", padding: 28 }}>
                  <img src={p.img} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                </div>
                <div style={{ display: "grid", gap: 12 }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12.5, color: C.muted }}>ECTRA · CHARGER</span>
                  <div style={{ fontWeight: 700, fontSize: 18 }}>{p.name}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}><Pills tag={p.tag} /></div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ background: C.ink, color: "#fff", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: C.primary, opacity: 0.05, filter: "blur(100px)", borderRadius: "50%", transform: "scale(1.5)" }} />
        <div style={{ ...wrap, padding: "64px 20px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 32, textAlign: "center", position: "relative", zIndex: 2 }}>
          {[["98%", "رضا العملاء التام"], ["+100,000", "منتج تم خدمته"], ["15+", "عاماً من الخبرة في السوق المصري"]].map(([n, l]) => (
            <div key={l}>
              <div style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 900, fontSize: "clamp(30px, 4vw, 46px)", color: C.primary, marginBottom: 8 }}>{n}</div>
              <div style={{ color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Audio & Power */}
      <section id="catalog" style={{ ...wrap, padding: "80px 20px" }}>
        <div style={{ marginBottom: 44 }}>
          <h2 style={{ fontWeight: 800, fontSize: "clamp(24px, 3.5vw, 30px)", margin: "0 0 6px" }}>الصوت والطاقة المتنقلة</h2>
          <p style={{ color: C.muted, margin: 0 }}>أينما كنت، الرفيق المثالي لهاتفك</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 28 }}>
          {/* Featured */}
          <button onClick={() => setSelected(featured)} className="lift btn" style={{ background: "#fff", borderRadius: 28, padding: 0, border: "1px solid rgba(0,0,0,0.05)", boxShadow: "0 4px 14px rgba(20,20,20,0.04)", textAlign: "right", font: "inherit", cursor: "pointer", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "center", padding: 32 }}>
              <div style={{ flex: "1 1 200px", display: "grid", gap: 16 }}>
                <span style={{ alignSelf: "flex-start", padding: "5px 14px", background: C.primary, color: "#fff", fontSize: 10.5, fontWeight: 800, borderRadius: 999, letterSpacing: "0.04em" }}>ANC</span>
                <div style={{ fontWeight: 800, fontSize: 26, lineHeight: 1.3 }}>{featured.name}</div>
                <p style={{ color: C.muted, margin: 0, lineHeight: 1.8 }}>إلغاء ضوضاء ANC مع وضع الشفافية، تشغيل حتى 60 ساعة، اتصال بجهازين ومقاومة ماء IPX4.</p>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", color: C.primary, fontSize: 13 }}>ANC · IPX4 · 60H BATTERY</div>
                <span className="btn" style={{ alignSelf: "flex-start", padding: "12px 26px", borderRadius: 12, background: C.ink, color: "#fff", fontWeight: 700, fontSize: 14 }}>اكتشف المزيد</span>
              </div>
              <div style={{ flex: "1 1 180px", aspectRatio: "1 / 1" }}>
                <img src={featured.img} alt={featured.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              </div>
            </div>
          </button>

          {/* Other catalog cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 24 }}>
            {others.map((p) => (
              <button key={p.name} onClick={() => setSelected(p)} className="lift btn" style={{ background: "#fff", borderRadius: 28, padding: 22, border: "1px solid rgba(0,0,0,0.05)", boxShadow: "0 4px 14px rgba(20,20,20,0.04)", textAlign: "right", font: "inherit", cursor: "pointer" }}>
                <div style={{ aspectRatio: "1 / 1", marginBottom: 14 }}>
                  <img src={p.img} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                </div>
                <div style={{ fontWeight: 700, fontSize: 15.5, marginBottom: 6 }}>{p.name}</div>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: C.primary, fontSize: 12 }}>{p.tag}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: C.ink, color: "#fff", paddingTop: 72, paddingBottom: 36 }}>
        <div style={{ ...wrap, padding: "0 20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 40, marginBottom: 56 }}>
            <div style={{ gridColumn: "span 1", minWidth: 240 }}>
              <img src={mtcLogo} alt="MTC GROUP" style={{ height: 48, width: "auto", filter: "brightness(0) invert(1)", marginBottom: 22 }} />
              <p style={{ color: "rgba(255,255,255,0.5)", maxWidth: 360, lineHeight: 1.8, margin: "0 0 22px" }}>نفخر في MTC GROUP بكوننا الموزّع المعتمد لعلامة ECTRA في مصر، ملتزمون بتقديم الأفضل دائماً لعملائنا في بنها وجميع أنحاء الجمهورية.</p>
              <div style={{ display: "flex", gap: 12 }}>
                <a href="https://mtc-group.online" target="_blank" rel="noreferrer" className="btn" style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.05)", display: "grid", placeItems: "center", color: "#fff" }}><Globe size={16} /></a>
                <a href={`https://wa.me/201224822220`} target="_blank" rel="noreferrer" className="btn" style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.05)", display: "grid", placeItems: "center", color: "#fff" }}><AtSign size={16} /></a>
              </div>
            </div>
            <div>
              <h5 style={{ fontWeight: 700, fontSize: 17, margin: "0 0 22px" }}>روابط سريعة</h5>
              <div style={{ display: "grid", gap: 14, color: "rgba(255,255,255,0.5)", fontSize: 14 }}>
                {[["خدمة الضمان", goSupport], ["تتبع الطلب", goSupport], ["سياسة الخصوصية", () => setPolicy("privacy")], ["سياسة الاسترجاع", () => setPolicy("returns")], ["تواصل معنا", goSupport]].map(([t, fn]) => (
                  <button key={t} onClick={fn} className="btn" style={{ background: "none", border: "none", color: "inherit", font: "inherit", textAlign: "right", padding: 0, cursor: "pointer" }}>{t}</button>
                ))}
              </div>
            </div>
            <div>
              <h5 style={{ fontWeight: 700, fontSize: 17, margin: "0 0 22px" }}>المقر الرئيسي</h5>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, lineHeight: 1.8, margin: "0 0 14px" }}>بنها، القليوبية<br />مركز خدمة MTC GROUP المعتمد</p>
              <a href="https://maps.google.com/?q=MTC+GROUP+Benha" target="_blank" rel="noreferrer" className="btn" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: C.primary, fontWeight: 700, textDecoration: "none" }}><MapPin size={18} /> تحديد الموقع على الخريطة</a>
            </div>
          </div>
          <div style={{ paddingTop: 28, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 16, color: "rgba(255,255,255,0.3)", fontSize: 12 }}>
            <p style={{ margin: 0 }}>جميع الحقوق محفوظة لـ MTC GROUP © 2026</p>
            <p style={{ margin: 0, fontFamily: "'Archivo', sans-serif", letterSpacing: "0.12em", textTransform: "uppercase" }}>Certified product within MTC GROUP — Benha</p>
          </div>
        </div>
      </footer>

      {selected && <ProductModal product={selected} onClose={() => setSelected(null)} />}
      {policy && <PolicyModal type={policy} onClose={() => setPolicy(null)} />}
    </div>
  );
}

function ProductModal({ product, onClose }) {
  const C2 = { ink: "#141414", bg: "#F3F2F0", primary: "#FF5A3C", tint: "#FFF1ED", line: "#E7E5E1", muted: "#6B6B6B" };
  const specs = Object.entries(product.specs || {});
  return (
    <div onClick={onClose} className="lp-modal-overlay" style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(20,20,20,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "flex-end", justifyContent: "center", padding: 0 }}>
      <style>{`
        @media (min-width: 640px){ .lp-modal-overlay{ align-items:center !important; padding:20px !important; } .lp-modal{ border-radius:24px !important; max-height:88vh !important; } }
        .lp-modal{ animation: lpUp .28s cubic-bezier(.2,.8,.2,1) both; }
        @keyframes lpUp{ from{ opacity:0; transform:translateY(24px);} to{ opacity:1; transform:none;} }
      `}</style>
      <div onClick={(e) => e.stopPropagation()} className="lp-modal" style={{ background: "#fff", width: "100%", maxWidth: 560, maxHeight: "92vh", borderRadius: "24px 24px 0 0", overflow: "auto", boxShadow: "0 -10px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ position: "relative", background: `linear-gradient(160deg, ${C2.ink}, #2E2E2E)`, padding: "20px 20px 0" }}>
          <button onClick={onClose} aria-label="إغلاق" style={{ position: "absolute", top: 14, left: 14, width: 36, height: 36, borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.15)", color: "#fff", cursor: "pointer", display: "grid", placeItems: "center", zIndex: 2 }}><X size={18} /></button>
          <img src={product.img} alt={product.name} style={{ width: "100%", maxHeight: 220, objectFit: "contain", display: "block", filter: "drop-shadow(0 16px 30px rgba(0,0,0,0.4))" }} />
        </div>
        <div style={{ padding: "20px 20px 28px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 20, background: C2.tint, color: "#E2452A", fontSize: 11.5, fontWeight: 800, marginBottom: 8 }}><BadgeCheck size={13} /> {product.tag}</div>
          <h3 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px", fontFamily: "'IBM Plex Mono', monospace" }}>{product.name}</h3>
          <div style={{ fontSize: 12.5, color: C2.muted, marginBottom: 18 }}>المواصفات التقنية الكاملة · منتج ECTRA أصلي</div>
          {product.highlights && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
              {product.highlights.map((h) => (
                <div key={h} style={{ display: "flex", alignItems: "flex-start", gap: 6, padding: "9px 11px", background: C2.bg, borderRadius: 11, fontSize: 12.5, fontWeight: 700, lineHeight: 1.5 }}>
                  <CheckCircle2 size={15} color={C2.primary} style={{ flexShrink: 0, marginTop: 1 }} /> {h}
                </div>
              ))}
            </div>
          )}
          <div style={{ border: `1px solid ${C2.line}`, borderRadius: 14, overflow: "hidden" }}>
            <div style={{ background: C2.ink, color: "#fff", padding: "10px 14px", fontSize: 12.5, fontWeight: 800, display: "flex", alignItems: "center", gap: 6 }}><Zap size={14} color={C2.primary} /> البيانات الفنية</div>
            {specs.map(([k, v], i) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "11px 14px", borderBottom: i < specs.length - 1 ? `1px solid ${C2.line}` : "none", background: i % 2 ? "#fff" : "#FAFAF9" }}>
                <span style={{ fontSize: 12.5, color: C2.muted, fontWeight: 700, flexShrink: 0 }}>{k}</span>
                <span style={{ fontSize: 12.5, color: C2.ink, fontWeight: 700, textAlign: "left", fontFamily: "'IBM Plex Mono', monospace", direction: "ltr" }}>{v}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11.5, color: C2.muted, textAlign: "center", marginTop: 16, marginBottom: 0 }}>موزّع معتمد · MTC GROUP — بضمان MTC GROUP والوكيل المصري LRT</p>
        </div>
      </div>
    </div>
  );
}

/* ===================== سياسة الخصوصية + سياسة الاسترجاع ===================== */
const POLICIES = {
  privacy: {
    title: "سياسة الخصوصية",
    updated: "آخر تحديث: 2026",
    intro: "نحن في MTC GROUP (الموزّع المعتمد لعلامة ECTRA في مصر — بنها) نحترم خصوصيتك ونلتزم بحماية بياناتك. توضّح هذه السياسة ما نجمعه وكيف نستخدمه.",
    sections: [
      { h: "البيانات التي نجمعها", items: [
        "عند إرسال تقييم أو رأي: نحفظ الاسم (أو رقم الموبايل إن اخترت كتابته)، تقييمك بالنجوم، نص ملاحظتك، ومرجع اختياري.",
        "قد تُعرض تقييمات العملاء علنًا داخل الموقع بعد مراجعتها من الإدارة.",
      ] },
      { h: "ما لا نجمعه", items: [
        "لا نستخدم ملفات تعريف الارتباط (Cookies) ولا أي تخزين على جهازك.",
        "لا نستخدم أدوات تتبّع أو تحليلات (مثل Google Analytics أو Facebook Pixel).",
        "لا نطلب تحديد موقعك الجغرافي، ولا بريدك الإلكتروني، ولا أي بيانات بنكية.",
      ] },
      { h: "عمليات الاستعلام", items: [
        "عند التحقق من منتج بالرقم التسلسلي أو الاستعلام عن صيانة بالكود، تُعالَج بياناتك لحظيًا لعرض النتيجة فقط، ولا نحتفظ بها.",
      ] },
      { h: "كيف نستخدم بياناتك", items: [
        "لعرض آراء العملاء وتحسين جودة المنتجات والخدمة.",
        "لا نبيع بياناتك أو نشاركها لأغراض تسويقية مع أي طرف ثالث.",
        "تُخزَّن البيانات بشكل آمن لدى مزوّد استضافة موثوق (Supabase).",
      ] },
      { h: "حقوقك", items: [
        "يمكنك طلب تعديل أو حذف تقييمك في أي وقت بالتواصل معنا عبر واتساب.",
        "يُرجى تجنّب كتابة أي بيانات حسّاسة داخل نص التقييم.",
      ] },
      { h: "التواصل", items: [
        "لأي استفسار بخصوص الخصوصية: تواصل مع MTC GROUP عبر واتساب أو بزيارة الفرع في بنها.",
      ] },
    ],
  },
  returns: {
    title: "سياسة الاسترجاع والاستبدال",
    updated: "آخر تحديث: 2026 — سياسة مبدئية قابلة للتعديل حسب سياسة الفرع",
    intro: "نحرص في MTC GROUP على رضاك التام. توضّح هذه السياسة شروط استرجاع واستبدال منتجات ECTRA المشتراة من خلالنا.",
    sections: [
      { h: "مدة الاسترجاع/الاستبدال", items: [
        "يحق لك طلب الاسترجاع أو الاستبدال خلال 14 يومًا من تاريخ الشراء.",
      ] },
      { h: "شروط القبول", items: [
        "أن يكون المنتج بحالته الأصلية وكامل العبوة والملحقات.",
        "وجود الفاتورة أو إثبات الشراء.",
        "ألا يكون به أي ضرر ناتج عن سوء الاستخدام.",
      ] },
      { h: "منتجات قد لا تكون قابلة للاسترجاع", items: [
        "المنتجات التي فُتح ختمها لأسباب صحية (مثل سماعات الأذن الداخلية) ما لم يوجد عيب صناعة.",
        "المنتجات المتضرّرة بسبب سوء الاستخدام أو الكسر.",
      ] },
      { h: "استرداد المبلغ", items: [
        "يتم ردّ المبلغ بنفس وسيلة الدفع بعد فحص المنتج والتأكد من استيفائه للشروط.",
      ] },
      { h: "الضمان (منفصل عن الاسترجاع)", items: [
        "عيوب الصناعة تُعالَج من خلال الضمان المعتمد (MTC GROUP + الوكيل المصري LRT)، وليست بالضرورة استرجاعًا للمبلغ.",
      ] },
      { h: "كيفية الطلب", items: [
        "تواصل معنا عبر واتساب أو بزيارة فرع MTC GROUP في بنها مع المنتج وإثبات الشراء.",
      ] },
    ],
  },
};

function PolicyModal({ type, onClose }) {
  const p = POLICIES[type] || POLICIES.privacy;
  return (
    <div onClick={onClose} dir="rtl" style={{ position: "fixed", inset: 0, background: "rgba(20,20,20,0.55)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "calc(env(safe-area-inset-top,0px) + 18px) 14px calc(env(safe-area-inset-bottom,0px) + 18px)", zIndex: 100, overflowY: "auto", fontFamily: "Tajawal, system-ui, sans-serif" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: C.surface, color: C.ink, borderRadius: 22, width: "100%", maxWidth: 560, margin: "auto", display: "flex", flexDirection: "column", maxHeight: "calc(100dvh - 60px)", overflow: "hidden", boxShadow: "0 24px 60px rgba(20,20,20,0.25)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 22px", borderBottom: `1px solid ${C.line}`, flexShrink: 0 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>{p.title}</div>
            <div style={{ fontSize: 11.5, color: C.muted, marginTop: 2 }}>{p.updated}</div>
          </div>
          <button onClick={onClose} aria-label="إغلاق" style={{ width: 36, height: 36, borderRadius: 10, border: `1.5px solid ${C.line}`, background: C.surface, color: C.muted, cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: "18px 22px", overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
          <p style={{ fontSize: 14, color: C.inkSoft, lineHeight: 1.9, margin: "0 0 18px" }}>{p.intro}</p>
          {p.sections.map((sec, i) => (
            <div key={i} style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: C.primaryDark, marginBottom: 8, display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.primary, display: "inline-block" }} />{sec.h}
              </div>
              <ul style={{ margin: 0, paddingInlineStart: 20, display: "grid", gap: 6 }}>
                {sec.items.map((it, j) => <li key={j} style={{ fontSize: 13.5, color: C.inkSoft, lineHeight: 1.8 }}>{it}</li>)}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ padding: "14px 22px", borderTop: `1px solid ${C.line}`, flexShrink: 0 }}>
          <button onClick={onClose} className="btn" style={{ width: "100%", padding: "14px", borderRadius: 14, border: "none", background: C.primary, color: "#fff", fontWeight: 800, fontSize: 15.5, cursor: "pointer", fontFamily: "inherit" }}>موافق</button>
        </div>
      </div>
    </div>
  );
}
