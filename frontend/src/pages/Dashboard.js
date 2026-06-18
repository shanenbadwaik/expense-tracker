import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

// ── Design tokens ──────────────────────────────────────────────
const CAT_META = {
  Food:      { emoji: "🍜", color: "#8FCBA8" },
  Transport: { emoji: "🚇", color: "#6FB6B0" },
  Shopping:  { emoji: "🛍️", color: "#E3BD9E" },
  Bills:     { emoji: "🧾", color: "#9DBBD0" },
  Health:    { emoji: "💊", color: "#B8C99A" },
  Leisure:   { emoji: "🎬", color: "#D9A6C2" },
  Other:     { emoji: "📌", color: "#C7D4CC" },
};

const BUDGET = 40000;

function fmt(n) {
  return Number(n).toLocaleString("en-IN");
}

function rgba(hex, a) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function catMeta(cat) {
  return CAT_META[cat] || { emoji: "📌", color: "#C7D4CC" };
}

function buildTheme(mode) {
  const light = mode === "light";
  return {
    bg:          light ? "#EDF1ED"                   : "#0B1310",
    text:        light ? "#14221C"                   : "#ECF1ED",
    text2:       light ? "#56685D"                   : "#9DB0A5",
    text3:       light ? "#8A998F"                   : "#6B7D73",
    surface:     light ? "#FFFFFF"                   : "rgba(255,255,255,0.05)",
    raised:      light ? "#F6F9F6"                   : "rgba(255,255,255,0.085)",
    border:      light ? "rgba(20,34,28,0.08)"       : "rgba(255,255,255,0.10)",
    line:        light ? "rgba(20,34,28,0.06)"       : "rgba(255,255,255,0.06)",
    chip:        light ? "#F6F9F6"                   : "rgba(255,255,255,0.05)",
    tabbar:      light ? "rgba(237,241,237,0.9)"     : "rgba(11,19,16,0.7)",
    track:       light ? "#E2EDE6"                   : "rgba(0,0,0,0.3)",
    accent:      light ? "#2E8C66"                   : "#8FCBA8",
    accentText:  light ? "#2E8C66"                   : "#8FCBA8",
    accentBg:    light ? "#2E8C66"                   : "#8FCBA8",
    accentFg:    light ? "#fff"                      : "#0B1310",
    railBg:      light ? "rgba(20,34,28,0.03)"       : "rgba(255,255,255,0.02)",
    heroBg:      light
      ? "linear-gradient(150deg,#FFFFFF,#F1F6F2)"
      : "linear-gradient(150deg,rgba(143,203,168,0.16),rgba(255,255,255,0.04))",
    sheetBg:     light
      ? "radial-gradient(120% 40% at 50% 0%,rgba(143,203,168,0.22),transparent 55%),#FFFFFF"
      : "radial-gradient(120% 40% at 50% 0%,rgba(143,203,168,0.12),transparent 55%),#11201A",
    rootBg:      light
      ? "radial-gradient(130% 50% at 50% -8%,rgba(143,203,168,0.18),transparent 58%),#EDF1ED"
      : "radial-gradient(120% 70% at 18% -5%,rgba(21,48,39,0) 0%,#070D0B 60%),radial-gradient(90% 60% at 92% 8%,#11231D 0%,#070D0B 55%),#070D0B",
  };
}

// ── Cairn stacked-bars logo ─────────────────────────────────────
function CairnLogo({ accent, size = 20 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <div style={{ width: size,       height: 4, borderRadius: 99, background: accent }} />
      <div style={{ width: size * .7,  height: 4, borderRadius: 99, background: accent, opacity: .7 }} />
      <div style={{ width: size * .4,  height: 4, borderRadius: 99, background: accent, opacity: .45 }} />
    </div>
  );
}

// ── Transaction card (shared) ────────────────────────────────────
function TxCard({ tx, T }) {
  const meta = catMeta(tx.category);
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 13,
      background: T.surface, border: `1px solid ${T.line}`,
      borderRadius: 18, padding: "12px 14px",
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 13, flexShrink: 0,
        background: rgba(meta.color, 0.16),
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17,
      }}>{meta.emoji}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: T.text }}>
          {tx.description || tx.category}
        </div>
        <div style={{ fontSize: 12, color: T.text2 }}>{tx.category} · {tx.date}</div>
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, fontVariantNumeric: "tabular-nums", flexShrink: 0, color: T.text }}>
        −₹{fmt(tx.amount)}
      </div>
    </div>
  );
}

// ── Empty state ──────────────────────────────────────────────────
function EmptyState({ T, onAdd }) {
  return (
    <div style={{
      textAlign: "center", padding: "48px 20px",
      border: `1px dashed ${T.border}`, borderRadius: 24,
      background: "rgba(255,255,255,0.02)",
    }}>
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: rgba("#8FCBA8", 0.12), display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
        <CairnLogo accent={T.accent} size={18} />
      </div>
      <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, marginBottom: 8, color: T.text }}>Nothing logged yet</div>
      <div style={{ fontSize: 14, color: T.text2, marginBottom: 20 }}>Add your first expense and Cairn will start building your picture of the month.</div>
      {onAdd && (
        <button onClick={onAdd} style={{
          height: 46, padding: "0 24px", border: "none", borderRadius: 99,
          background: T.accentBg, color: T.accentFg,
          fontFamily: "inherit", fontSize: 15, fontWeight: 700, cursor: "pointer",
        }}>Add your first expense</button>
      )}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────
export default function Dashboard() {
  const [tab, setTab]           = useState("home");
  const [expenses, setExpenses] = useState([]);
  const [profile, setProfile]   = useState({});
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount]     = useState("");
  const [category, setCategory] = useState("Food");
  const [description, setDescription] = useState("");
  const [toast, setToast]       = useState(null);
  const [colorMode, setColorMode] = useState(
    () => localStorage.getItem("cairn_theme") || "dark"
  );
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const toastRef = useRef(null);

  const T = buildTheme(colorMode);
  const isDesktop = windowWidth >= 900;

  const token = localStorage.getItem("token");
  const headers = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const fetchExpenses = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/expenses", headers);
      setExpenses(res.data);
    } catch (e) { console.log(e); }
  };

  const fetchProfile = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/profile", headers);
      setProfile(res.data);
    } catch (e) { console.log(e); }
  };

  useEffect(() => { fetchExpenses(); fetchProfile(); }, []);

  const showToast = (msg, kind = "success") => {
    clearTimeout(toastRef.current);
    setToast({ msg, kind });
    toastRef.current = setTimeout(() => setToast(null), 2800);
  };

  const logout = () => { localStorage.removeItem("token"); window.location.href = "/"; };

  const toggleTheme = () => {
    const next = colorMode === "dark" ? "light" : "dark";
    setColorMode(next);
    localStorage.setItem("cairn_theme", next);
  };

  const pressKey = (k) => {
    if (k === "back") { setAmount((a) => a.slice(0, -1)); return; }
    setAmount((a) => {
      if (a.replace(/^0+/, "").length >= 7) return a;
      return (a === "0" ? "" : a) + k;
    });
  };

  const openModal = () => { setAmount(""); setCategory("Food"); setDescription(""); setShowModal(true); };

  const saveExpense = async () => {
    const amt = Number(amount || 0);
    if (!amt) { showToast("Enter an amount first", "error"); return; }
    try {
      await axios.post("http://127.0.0.1:8000/expenses", {
        amount: amt, category,
        description: description || category,
        date: new Date().toISOString().slice(0, 10),
      }, headers);
      setShowModal(false);
      await fetchExpenses();
      showToast(`Expense added · ₹${fmt(amt)} to ${category}`);
    } catch (e) {
      showToast(e.response?.data?.detail || "Could not save", "error");
    }
  };

  // ── Derived values ──────────────────────────────────────────────
  const spent    = expenses.reduce((t, e) => t + Number(e.amount), 0);
  const left     = Math.max(0, BUDGET - spent);
  const spentPct = Math.min(100, Math.round((spent / BUDGET) * 100));
  const recent   = expenses.slice(0, 4);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const thisWeek = expenses
    .filter((e) => new Date(e.date) >= sevenDaysAgo)
    .reduce((t, e) => t + Number(e.amount), 0);

  const totals = {};
  expenses.forEach((e) => { totals[e.category] = (totals[e.category] || 0) + Number(e.amount); });
  const byCat = Object.entries(totals)
    .map(([name, val]) => ({
      name, amount: val,
      color: catMeta(name).color,
      pct: spent ? Math.round((val / spent) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const tabColor = (t) => tab === t ? T.accentText : T.text3;

  const chipStyle = (cat) => {
    const active = category === cat;
    return {
      display: "inline-flex", alignItems: "center", gap: 6,
      height: 42, padding: "0 15px", borderRadius: 99,
      fontSize: 14, whiteSpace: "nowrap", flexShrink: 0, cursor: "pointer",
      fontWeight: active ? 600 : 400,
      background: active ? T.accentBg : T.chip,
      color: active ? T.accentFg : T.text2,
      border: `1px solid ${active ? "transparent" : T.border}`,
      transition: "all .15s ease",
    };
  };

  // ── Tab content ─────────────────────────────────────────────────
  const HomeContent = () => (
    <div>
      {/* Balance card */}
      <div style={{
        position: "relative", borderRadius: 28, padding: 26,
        background: T.heroBg, border: `1px solid ${T.border}`,
        overflow: "hidden", marginBottom: 24,
        boxShadow: colorMode === "light" ? "0 16px 30px -18px rgba(20,34,28,0.2)" : "none",
      }}>
        <div style={{
          position: "absolute", top: -30, right: -20, width: 130, height: 130,
          borderRadius: "50%", background: "radial-gradient(circle,rgba(227,189,158,0.3),transparent 65%)",
          pointerEvents: "none",
        }} />
        <div style={{ fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", color: T.text2, marginBottom: 8 }}>Left to spend</div>
        <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: isDesktop ? 48 : 52, lineHeight: 1, fontVariantNumeric: "tabular-nums", marginBottom: 18 }}>
          ₹{fmt(left)}
        </div>
        <div style={{ height: 8, borderRadius: 99, background: T.track, overflow: "hidden", marginBottom: 8 }}>
          <div style={{ height: "100%", width: `${spentPct}%`, borderRadius: 99, background: `linear-gradient(90deg,${T.accent},#E3BD9E)`, transition: "width .5s ease" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.text2, fontVariantNumeric: "tabular-nums" }}>
          <span>₹{fmt(spent)} spent</span>
          <span>of ₹{fmt(BUDGET)}</span>
        </div>
      </div>

      {/* Recent */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: T.text }}>Recent</span>
        <span onClick={() => setTab("activity")} style={{ fontSize: 13, color: T.accentText, fontWeight: 600, cursor: "pointer" }}>See all</span>
      </div>
      {recent.length === 0
        ? <EmptyState T={T} onAdd={openModal} />
        : <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {recent.map((tx) => <TxCard key={tx.id} tx={tx} T={T} />)}
          </div>
      }
    </div>
  );

  const ActivityContent = () => (
    <div>
      <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 32, marginBottom: 18, color: T.text }}>Activity</div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, height: 46, borderRadius: 99, background: T.surface, border: `1px solid ${T.border}`, padding: "0 16px", marginBottom: 20, color: T.text3, fontSize: 14 }}>
        🔍 Search transactions
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={{ fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", color: T.text3 }}>All transactions</span>
        <span style={{ fontSize: 13, color: T.text2, fontVariantNumeric: "tabular-nums" }}>{expenses.length} items</span>
      </div>
      {expenses.length === 0
        ? <EmptyState T={T} />
        : <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {expenses.map((tx) => <TxCard key={tx.id} tx={tx} T={T} />)}
          </div>
      }
    </div>
  );

  const InsightsContent = () => (
    <div>
      <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 32, marginBottom: 24, color: T.text }}>Insights</div>
      {spent === 0 ? (
        <EmptyState T={T} />
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
            <ResponsiveContainer width={220} height={220}>
              <PieChart>
                <Pie data={byCat} dataKey="amount" nameKey="name" innerRadius={62} outerRadius={100} paddingAngle={0} stroke="none">
                  {byCat.map((c, i) => <Cell key={i} fill={c.color} />)}
                </Pie>
                <Tooltip
                  formatter={(val) => [`₹${fmt(val)}`, ""]}
                  contentStyle={{ background: "#11201A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#ECF1ED", fontSize: 13 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 12, color: T.text2, marginBottom: 4 }}>Total spent</div>
            <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 38, fontVariantNumeric: "tabular-nums", color: T.text }}>₹{fmt(spent)}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {byCat.map((c) => (
              <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 16, background: rgba(c.color, 0.10) }}>
                <div style={{ width: 36, height: 36, borderRadius: 11, background: rgba(c.color, 0.22), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>
                  {catMeta(c.name).emoji}
                </div>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: T.text }}>{c.name}</span>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: T.text }}>₹{fmt(c.amount)}</div>
                  <div style={{ fontSize: 11, color: T.text2, fontVariantNumeric: "tabular-nums" }}>{c.pct}%</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );

  const ProfileContent = () => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{
        width: 80, height: 80, borderRadius: "50%",
        background: "linear-gradient(135deg,#2a5446,#1f4438)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 32, fontWeight: 700, color: "#D8E6DD", marginBottom: 12,
      }}>
        {(profile.username || "A")[0].toUpperCase()}
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: T.text, marginBottom: 4 }}>{profile.username}</div>
      <div style={{ fontSize: 13, color: T.text2, marginBottom: 24 }}>{profile.email}</div>
      <div style={{ display: "flex", gap: 10, width: "100%", maxWidth: 440, marginBottom: 20 }}>
        {[{ value: expenses.length, label: "transactions" }, { value: `₹${fmt(spent)}`, label: "tracked" }].map((s) => (
          <div key={s.label} style={{ flex: 1, borderRadius: 18, background: T.surface, border: `1px solid ${T.border}`, padding: 16, textAlign: "center" }}>
            <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 28, fontVariantNumeric: "tabular-nums", color: T.text }}>{s.value}</div>
            <div style={{ fontSize: 11, color: T.text2 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ width: "100%", maxWidth: 440, borderRadius: 20, background: T.surface, border: `1px solid ${T.border}`, overflow: "hidden" }}>
        {[{ icon: "🪙", label: "Currency", value: "INR ₹ ›" }, { icon: "🎯", label: "Monthly budget", value: `₹${fmt(BUDGET)} ›` }].map((row, i) => (
          <div key={i}>
            {i > 0 && <div style={{ height: 1, background: T.line }} />}
            <div style={{ display: "flex", alignItems: "center", gap: 13, padding: 16 }}>
              <span style={{ fontSize: 16 }}>{row.icon}</span>
              <span style={{ flex: 1, fontSize: 14, color: T.text }}>{row.label}</span>
              <span style={{ fontSize: 13, color: T.text2 }}>{row.value}</span>
            </div>
          </div>
        ))}
        <div style={{ height: 1, background: T.line }} />
        <div style={{ padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 12 }}>
            <span style={{ fontSize: 16 }}>🎨</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, color: T.text, fontWeight: 500 }}>Appearance</div>
              <div style={{ fontSize: 11, color: T.text2, marginTop: 1 }}>
                {colorMode === "dark" ? "Using dark — easier on the eyes at night." : "Using light — great in bright environments."}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", background: colorMode === "dark" ? "rgba(0,0,0,0.3)" : "rgba(20,34,28,0.07)", borderRadius: 99, padding: 4 }}>
            {[{ id: "dark", icon: "🌙", label: "Dark" }, { id: "light", icon: "☀️", label: "Light" }].map(({ id, icon, label }) => {
              const active = colorMode === id;
              return (
                <div
                  key={id}
                  onClick={() => { if (!active) toggleTheme(); }}
                  style={{
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                    gap: 6, padding: "9px 0", borderRadius: 99,
                    background: active ? T.accentBg : "transparent",
                    color: active ? T.accentFg : T.text2,
                    fontSize: 13, fontWeight: active ? 600 : 400,
                    cursor: active ? "default" : "pointer",
                    transition: "all .18s ease",
                  }}
                >
                  <span style={{ fontSize: 14 }}>{icon}</span>
                  {label}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 24, width: "100%", maxWidth: 440 }}>
        <button onClick={logout} style={{ width: "100%", height: 50, border: "1px solid rgba(232,137,124,0.3)", borderRadius: 99, background: "rgba(232,137,124,0.08)", color: "#E8897C", fontFamily: "inherit", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
          Log out
        </button>
      </div>
    </div>
  );

  // ── Nav items ────────────────────────────────────────────────────
  const NAV = [
    { id: "home",     label: "Home",     icon: (c) => <div style={{ width: 16, height: 16, borderRadius: 5, border: `2px solid ${c}` }} /> },
    { id: "activity", label: "Activity", icon: (c) => <div style={{ display: "flex", flexDirection: "column", gap: 3, width: 16 }}>{[0,1,2].map((i) => <span key={i} style={{ height: 2, background: c, borderRadius: 2 }} />)}</div> },
    { id: "insights", label: "Insights", icon: (c) => <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 16 }}>{[8,13,16].map((h, i) => <span key={i} style={{ width: 4, height: h, background: c, borderRadius: 2 }} />)}</div> },
    { id: "profile",  label: "Profile",  icon: (c) => <div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${c}` }} /> },
  ];

  // ── Add expense modal ────────────────────────────────────────────
  // JSX variable (not a component) — avoids unmount/remount on every render
  const modalJsx = showModal ? (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", flexDirection: "column" }}>
      <div onClick={() => setShowModal(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }} />
      <div style={{
        position: "relative", marginTop: "auto",
        borderRadius: "36px 36px 0 0",
        background: T.sheetBg,
        borderTop: `1px solid ${T.border}`,
        padding: "14px 24px 32px",
        display: "flex", flexDirection: "column",
        animation: "cairnSheet .3s cubic-bezier(.22,1,.36,1)",
        boxShadow: "0 -24px 60px -20px rgba(0,0,0,0.5)",
        maxWidth: isDesktop ? 520 : "100%",
        marginLeft: isDesktop ? "auto" : 0,
        marginRight: isDesktop ? "auto" : 0,
        width: "100%",
      }}>
        <div style={{ width: 42, height: 5, borderRadius: 99, background: "rgba(255,255,255,0.22)", margin: "0 auto 16px" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <button onClick={() => setShowModal(false)} style={{ width: 34, height: 34, borderRadius: "50%", border: "none", background: T.chip, color: T.text2, fontSize: 16, cursor: "pointer" }}>✕</button>
          <span style={{ fontSize: 16, fontWeight: 700, color: T.text }}>New expense</span>
          <span style={{ width: 34 }} />
        </div>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: T.text2, marginBottom: 2 }}>Amount</div>
          <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 54, lineHeight: 1.1, fontVariantNumeric: "tabular-nums", color: T.text }}>
            <span style={{ color: T.text3 }}>₹</span>{amount ? fmt(Number(amount)) : "0"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 14, paddingBottom: 2 }}>
          {Object.keys(CAT_META).map((cat) => (
            <div key={cat} onClick={() => setCategory(cat)} style={chipStyle(cat)}>{CAT_META[cat].emoji} {cat}</div>
          ))}
        </div>
        <input
          value={description} onChange={(e) => setDescription(e.target.value)}
          placeholder="Add a note (optional)"
          style={{ height: 46, borderRadius: 14, border: `1px solid ${T.border}`, background: T.chip, color: T.text, fontFamily: "inherit", fontSize: 15, padding: "0 16px", outline: "none", marginBottom: 14 }}
        />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 9, marginBottom: 14 }}>
          {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((k, i) => (
            <div key={i} onClick={() => k && pressKey(k === "⌫" ? "back" : k)} style={{
              height: 50, display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: 16, background: k ? T.chip : "transparent",
              border: k ? `1px solid ${T.line}` : "none",
              fontSize: 21, fontWeight: 600, color: T.text,
              cursor: k ? "pointer" : "default", userSelect: "none", fontVariantNumeric: "tabular-nums",
            }}>{k}</div>
          ))}
        </div>
        <button onClick={saveExpense} style={{ width: "100%", height: 54, border: "none", borderRadius: 99, background: T.accentBg, color: T.accentFg, fontFamily: "inherit", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
          Save expense
        </button>
      </div>
    </div>
  ) : null;

  // ── Toast ────────────────────────────────────────────────────────
  const toastJsx = toast ? (
    <div style={{
      position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
      zIndex: 200, display: "flex", alignItems: "center", gap: 10,
      padding: "12px 16px", borderRadius: 16,
      background: toast.kind === "error" ? "rgba(232,137,124,0.18)" : "rgba(143,203,168,0.18)",
      border: `1px solid ${toast.kind === "error" ? "rgba(232,137,124,0.4)" : "rgba(143,203,168,0.4)"}`,
      boxShadow: "0 16px 30px -12px rgba(0,0,0,0.5)",
      animation: "cairnToast .28s ease",
      whiteSpace: "nowrap", maxWidth: "calc(100vw - 48px)",
    }}>
      <span style={{ width: 22, height: 22, borderRadius: "50%", background: toast.kind === "error" ? "#E8897C" : "#8FCBA8", color: "#0B1310", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
        {toast.kind === "error" ? "!" : "✓"}
      </span>
      <span style={{ fontSize: 13, color: T.text }}>{toast.msg}</span>
    </div>
  ) : null;

  // ════════════════════════════════════════════════════════════════
  // DESKTOP LAYOUT
  // ════════════════════════════════════════════════════════════════
  if (isDesktop) {
    return (
      <div style={{ minHeight: "100vh", background: T.rootBg, color: T.text, fontFamily: "'Hanken Grotesk', system-ui, sans-serif", display: "flex" }}>
        {toastJsx}

        {/* SIDEBAR RAIL */}
        <div style={{
          width: 228, flexShrink: 0,
          borderRight: `1px solid ${T.line}`,
          padding: "26px 18px",
          display: "flex", flexDirection: "column", gap: 6,
          background: T.railBg,
          position: "sticky", top: 0, height: "100vh", overflowY: "auto",
        }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 8px 24px" }}>
            <CairnLogo accent={T.accent} size={20} />
            <span style={{ fontSize: 16, fontWeight: 700, color: T.text }}>Cairn</span>
          </div>

          {/* Nav items */}
          {NAV.map(({ id, label, icon }) => {
            const active = tab === id;
            return (
              <div key={id} onClick={() => setTab(id)} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 14px", borderRadius: 14, cursor: "pointer",
                background: active ? rgba("#8FCBA8", 0.12) : "transparent",
                color: active ? T.accentText : T.text2,
                fontSize: 14, fontWeight: active ? 600 : 400,
                transition: "background .15s ease",
              }}>
                {icon(tabColor(id))}
                {label}
              </div>
            );
          })}

          {/* User info at bottom */}
          <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 11, padding: 10, borderRadius: 14, background: T.raised }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#2a5446,#1f4438)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#D8E6DD", flexShrink: 0 }}>
              {(profile.username || "A")[0].toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile.username}</div>
              <div style={{ fontSize: 11, color: T.text2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile.email}</div>
            </div>
          </div>
        </div>

        {/* MAIN AREA */}
        <div style={{ flex: 1, padding: 30, minWidth: 0, overflowY: "auto" }}>

          {/* Header row */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ fontSize: 14, color: T.text2 }}>{new Date().toLocaleString("en-IN", { month: "long", year: "numeric" })}</div>
              <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 32, color: T.text }}>
                Good morning, {profile.username || "there"}
              </div>
            </div>
            <button onClick={openModal} style={{ height: 46, padding: "0 22px", border: "none", borderRadius: 99, background: T.accentBg, color: T.accentFg, fontFamily: "inherit", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
              + Add expense
            </button>
          </div>

          {/* HOME tab — desktop-specific layout */}
          {tab === "home" && (
            <>
              {/* Stat row */}
              <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
                {/* Left to spend */}
                <div style={{ position: "relative", borderRadius: 24, padding: 24, background: T.heroBg, border: `1px solid ${T.border}`, overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: -30, right: -20, width: 140, height: 140, borderRadius: "50%", background: "radial-gradient(circle,rgba(227,189,158,0.3),transparent 65%)", pointerEvents: "none" }} />
                  <div style={{ fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", color: T.text2, marginBottom: 6 }}>Left to spend</div>
                  <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 46, lineHeight: 1, fontVariantNumeric: "tabular-nums", marginBottom: 14 }}>₹{fmt(left)}</div>
                  <div style={{ height: 8, borderRadius: 99, background: T.track, overflow: "hidden", marginBottom: 7 }}>
                    <div style={{ height: "100%", width: `${spentPct}%`, borderRadius: 99, background: `linear-gradient(90deg,${T.accent},#E3BD9E)`, transition: "width .5s ease" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.text2, fontVariantNumeric: "tabular-nums" }}>
                    <span>₹{fmt(spent)} spent</span><span>of ₹{fmt(BUDGET)}</span>
                  </div>
                </div>
                {/* This week */}
                <div style={{ borderRadius: 24, padding: 22, background: T.surface, border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 12, color: T.text2, marginBottom: 8 }}>This week</div>
                  <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 32, fontVariantNumeric: "tabular-nums", color: T.text }}>₹{fmt(thisWeek)}</div>
                  <div style={{ fontSize: 12, color: T.accentText, marginTop: 6 }}>Last 7 days</div>
                </div>
                {/* Total entries */}
                <div style={{ borderRadius: 24, padding: 22, background: T.surface, border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 12, color: T.text2, marginBottom: 8 }}>Transactions</div>
                  <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 32, fontVariantNumeric: "tabular-nums", color: T.text }}>{expenses.length}</div>
                  <div style={{ fontSize: 12, color: T.text2, marginTop: 6 }}>All time</div>
                </div>
              </div>

              {/* Ledger + chart */}
              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16 }}>
                {/* Recent ledger */}
                <div style={{ borderRadius: 24, padding: 22, background: T.surface, border: `1px solid ${T.border}` }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Recent</span>
                    <span onClick={() => setTab("activity")} style={{ fontSize: 13, color: T.accentText, cursor: "pointer" }}>See all</span>
                  </div>
                  {recent.length === 0
                    ? <EmptyState T={T} onAdd={openModal} />
                    : <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                        {recent.map((tx, i) => {
                          const meta = catMeta(tx.category);
                          return (
                            <div key={tx.id}>
                              {i > 0 && <div style={{ height: 1, background: T.line }} />}
                              <div style={{ display: "flex", alignItems: "center", gap: 13, padding: "10px 0" }}>
                                <div style={{ width: 38, height: 38, borderRadius: 12, background: rgba(meta.color, 0.16), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{meta.emoji}</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 14, fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tx.description || tx.category}</div>
                                  <div style={{ fontSize: 12, color: T.text2 }}>{tx.category} · {tx.date}</div>
                                </div>
                                <div style={{ fontSize: 15, fontWeight: 600, fontVariantNumeric: "tabular-nums", color: T.text }}>−₹{fmt(tx.amount)}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                  }
                </div>

                {/* By category */}
                <div style={{ borderRadius: 24, padding: 22, background: T.surface, border: `1px solid ${T.border}`, display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ alignSelf: "flex-start", fontSize: 15, fontWeight: 700, marginBottom: 16, color: T.text }}>By category</div>
                  {spent === 0 ? (
                    <div style={{ fontSize: 13, color: T.text2, textAlign: "center", marginTop: 40 }}>No data yet</div>
                  ) : (
                    <>
                      <div style={{ position: "relative", width: 160, height: 160 }}>
                        <ResponsiveContainer width={160} height={160}>
                          <PieChart>
                            <Pie data={byCat} dataKey="amount" nameKey="name" innerRadius={46} outerRadius={76} paddingAngle={0} stroke="none">
                              {byCat.map((c, i) => <Cell key={i} fill={c.color} />)}
                            </Pie>
                            <Tooltip formatter={(val) => [`₹${fmt(val)}`, ""]} contentStyle={{ background: "#11201A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#ECF1ED", fontSize: 12 }} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center", pointerEvents: "none" }}>
                          <div style={{ fontSize: 10, color: T.text2, letterSpacing: ".04em" }}>Spent</div>
                          <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 16, fontVariantNumeric: "tabular-nums", color: T.text, lineHeight: 1.1 }}>
                            ₹{spent >= 1000 ? `${(spent / 1000).toFixed(1)}k` : fmt(spent)}
                          </div>
                        </div>
                      </div>
                      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
                        {byCat.slice(0, 5).map((c) => (
                          <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                            <span style={{ width: 9, height: 9, borderRadius: "50%", background: c.color, flexShrink: 0 }} />
                            <span style={{ flex: 1, fontSize: 13, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
                            <div style={{ textAlign: "right", flexShrink: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: T.text }}>₹{fmt(c.amount)}</div>
                              <div style={{ fontSize: 11, color: T.text2, fontVariantNumeric: "tabular-nums" }}>{c.pct}%</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Other tabs fill the main area */}
          {tab === "activity" && <div style={{ maxWidth: 700, margin: "0 auto" }}><ActivityContent /></div>}
          {tab === "insights" && <div style={{ maxWidth: 600, margin: "0 auto" }}><InsightsContent /></div>}
          {tab === "profile" && <div style={{ maxWidth: 500, margin: "0 auto" }}><ProfileContent /></div>}
        </div>

        {modalJsx}
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════
  // MOBILE LAYOUT
  // ════════════════════════════════════════════════════════════════
  return (
    <div style={{ minHeight: "100vh", background: T.rootBg, color: T.text, fontFamily: "'Hanken Grotesk', system-ui, sans-serif", display: "flex", flexDirection: "column", position: "relative" }}>
      {toastJsx}

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 100 }}>
        <div style={{ padding: "20px 22px" }}>

          {/* Mobile greeting header */}
          {tab === "home" && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 13, color: T.text2 }}>Good morning,</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{profile.username || "there"}</div>
              </div>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,#2a5446,#1f4438)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#D8E6DD" }}>
                {(profile.username || "A")[0].toUpperCase()}
              </div>
            </div>
          )}

          {tab === "home"     && <HomeContent />}
          {tab === "activity" && <ActivityContent />}
          {tab === "insights" && <InsightsContent />}
          {tab === "profile"  && <ProfileContent />}
        </div>
      </div>

      {/* FAB */}
      <div onClick={openModal} style={{
        position: "fixed", right: 22, bottom: 82, zIndex: 20,
        width: 58, height: 58, borderRadius: "50%",
        background: T.accentBg, color: T.accentFg,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 32, lineHeight: 1, cursor: "pointer",
        boxShadow: "0 14px 28px -6px rgba(143,203,168,0.45)",
        userSelect: "none",
      }}>+</div>

      {/* Bottom tab bar */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 10,
        display: "flex", alignItems: "center", justifyContent: "space-around",
        padding: "12px 18px 24px",
        borderTop: `1px solid ${T.line}`,
        background: T.tabbar,
        backdropFilter: "blur(16px)",
      }}>
        {NAV.map(({ id, label, icon }) => (
          <div key={id} onClick={() => setTab(id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, cursor: "pointer" }}>
            {icon(tabColor(id))}
            <span style={{ fontSize: 10, fontWeight: 600, color: tabColor(id) }}>{label}</span>
          </div>
        ))}
      </div>

      {modalJsx}
    </div>
  );
}
