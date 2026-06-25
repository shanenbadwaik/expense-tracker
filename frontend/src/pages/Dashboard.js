import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

// ── Design tokens ───────────────────────────────────────────────────────────────
const CAT_META = {
  Food:      { emoji: "🍜", color: "#8FCBA8" },
  Transport: { emoji: "🚇", color: "#6FB6B0" },
  Shopping:  { emoji: "🛍️", color: "#E3BD9E" },
  Bills:     { emoji: "🧾", color: "#9DBBD0" },
  Health:    { emoji: "💊", color: "#B8C99A" },
  Leisure:   { emoji: "🎬", color: "#D9A6C2" },
  Other:     { emoji: "📌", color: "#C7D4CC" },
};

const INCOME_SOURCES = ["Salary", "Freelance", "Business", "Investment", "Gift", "Other"];
const INCOME_META = {
  Salary:     { emoji: "💼" },
  Freelance:  { emoji: "💻" },
  Business:   { emoji: "🏢" },
  Investment: { emoji: "📈" },
  Gift:       { emoji: "🎁" },
  Other:      { emoji: "💰" },
};

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "SGD", "JPY", "CAD", "AUD"];
const CURRENCY_SYMBOLS = {
  INR: "₹", USD: "$", EUR: "€", GBP: "£",
  AED: "د.إ", SGD: "S$", JPY: "¥", CAD: "CA$", AUD: "A$",
};

const FREQUENCIES = [
  { id: "monthly", label: "Monthly" },
  { id: "weekly",  label: "Weekly" },
  { id: "yearly",  label: "Yearly" },
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function currMonth() {
  return new Date().toISOString().slice(0, 7);
}
function currSym(c) {
  return CURRENCY_SYMBOLS[c] || c;
}
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
    bg:         light ? "#EDF1ED" : "#0B1310",
    text:       light ? "#14221C" : "#ECF1ED",
    text2:      light ? "#56685D" : "#9DB0A5",
    text3:      light ? "#8A998F" : "#6B7D73",
    surface:    light ? "#FFFFFF" : "rgba(255,255,255,0.05)",
    raised:     light ? "#F6F9F6" : "rgba(255,255,255,0.085)",
    border:     light ? "rgba(20,34,28,0.08)" : "rgba(255,255,255,0.10)",
    line:       light ? "rgba(20,34,28,0.06)" : "rgba(255,255,255,0.06)",
    chip:       light ? "#F6F9F6" : "rgba(255,255,255,0.05)",
    tabbar:     light ? "rgba(237,241,237,0.9)" : "rgba(11,19,16,0.7)",
    track:      light ? "#E2EDE6" : "rgba(0,0,0,0.3)",
    accent:     light ? "#2E8C66" : "#8FCBA8",
    accentText: light ? "#2E8C66" : "#8FCBA8",
    accentBg:   light ? "#2E8C66" : "#8FCBA8",
    accentFg:   light ? "#fff"    : "#0B1310",
    railBg:     light ? "rgba(20,34,28,0.03)" : "rgba(255,255,255,0.02)",
    heroBg:     light
      ? "linear-gradient(150deg,#FFFFFF,#F1F6F2)"
      : "linear-gradient(150deg,rgba(143,203,168,0.16),rgba(255,255,255,0.04))",
    sheetBg:    light
      ? "radial-gradient(120% 40% at 50% 0%,rgba(143,203,168,0.22),transparent 55%),#FFFFFF"
      : "radial-gradient(120% 40% at 50% 0%,rgba(143,203,168,0.12),transparent 55%),#11201A",
    rootBg:     light
      ? "radial-gradient(130% 50% at 50% -8%,rgba(143,203,168,0.18),transparent 58%),#EDF1ED"
      : "radial-gradient(120% 70% at 18% -5%,rgba(21,48,39,0) 0%,#070D0B 60%),radial-gradient(90% 60% at 92% 8%,#11231D 0%,#070D0B 55%),#070D0B",
  };
}

// ── Shared sub-components ───────────────────────────────────────────────────────
function CairnLogo({ accent, size = 20 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <div style={{ width: size,      height: 4, borderRadius: 99, background: accent }} />
      <div style={{ width: size * .7, height: 4, borderRadius: 99, background: accent, opacity: .7 }} />
      <div style={{ width: size * .4, height: 4, borderRadius: 99, background: accent, opacity: .45 }} />
    </div>
  );
}

function TxCard({ tx, T, onEdit, onDelete }) {
  const meta = catMeta(tx.category);
  const sym  = currSym(tx.currency || "INR");
  const isNonINR = tx.currency && tx.currency !== "INR";
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
        <div style={{ fontSize: 12, color: T.text2 }}>
          {tx.category} · {tx.date}{isNonINR ? ` · ${tx.currency}` : ""}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: T.text }}>
          −{sym}{fmt(tx.amount)}
        </div>
        {onEdit && (
          <button onClick={() => onEdit(tx)} style={{
            width: 28, height: 28, borderRadius: 8, border: "none",
            background: T.chip, color: T.text2, cursor: "pointer",
            fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
          }}>✎</button>
        )}
        {onDelete && (
          <button onClick={() => onDelete(tx.id)} style={{
            width: 28, height: 28, borderRadius: 8, border: "none",
            background: "rgba(232,137,124,0.10)", color: "#E8897C", cursor: "pointer",
            fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
          }}>✕</button>
        )}
      </div>
    </div>
  );
}

function IncomeCard({ entry, T, onDelete }) {
  const meta = INCOME_META[entry.source] || { emoji: "💰" };
  const sym  = currSym(entry.currency || "INR");
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 13,
      background: rgba("#8FCBA8", 0.07), border: `1px solid ${rgba("#8FCBA8", 0.18)}`,
      borderRadius: 18, padding: "12px 14px",
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 13, flexShrink: 0,
        background: rgba("#8FCBA8", 0.18),
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17,
      }}>{meta.emoji}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: T.text }}>
          {entry.description || entry.source}
        </div>
        <div style={{ fontSize: 12, color: T.text2 }}>{entry.source} · {entry.date}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "#8FCBA8" }}>
          +{sym}{fmt(entry.amount)}
        </div>
        {onDelete && (
          <button onClick={() => onDelete(entry.id)} style={{
            width: 28, height: 28, borderRadius: 8, border: "none",
            background: "rgba(232,137,124,0.10)", color: "#E8897C", cursor: "pointer",
            fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
          }}>✕</button>
        )}
      </div>
    </div>
  );
}

function EmptyState({ T, onAdd, label }) {
  return (
    <div style={{
      textAlign: "center", padding: "40px 20px",
      border: `1px dashed ${T.border}`, borderRadius: 24,
      background: "rgba(255,255,255,0.02)",
    }}>
      <div style={{ width: 52, height: 52, borderRadius: "50%", background: rgba("#8FCBA8", 0.12), display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
        <CairnLogo accent={T.accent} size={16} />
      </div>
      <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 20, marginBottom: 6, color: T.text }}>
        {label || "Nothing here yet"}
      </div>
      {onAdd && (
        <button onClick={onAdd} style={{
          height: 42, padding: "0 22px", border: "none", borderRadius: 99, marginTop: 14,
          background: T.accentBg, color: T.accentFg,
          fontFamily: "inherit", fontSize: 14, fontWeight: 700, cursor: "pointer",
        }}>Add one</button>
      )}
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [tab, setTab]   = useState("home");
  const [colorMode, setColorMode] = useState(
    () => localStorage.getItem("cairn_theme") || "dark"
  );
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const toastRef = useRef(null);

  // ── Core data ──────────────────────────────────────────────────────────────────
  const [expenses,  setExpenses]  = useState([]);
  const [income,    setIncome]    = useState([]);
  const [budgets,   setBudgets]   = useState([]);
  const [recurring, setRecurring] = useState([]);
  const [profile,   setProfile]   = useState({});

  // ── UI state ───────────────────────────────────────────────────────────────────
  const [toast,         setToast]         = useState(null);
  const [verifyBanner,  setVerifyBanner]  = useState(false);
  const [resendsLoading,setResendsLoading]= useState(false);

  // ── Add expense modal ──────────────────────────────────────────────────────────
  const [showModal,    setShowModal]    = useState(false);
  const [amount,       setAmount]       = useState("");
  const [category,     setCategory]     = useState("Food");
  const [description,  setDescription]  = useState("");
  const [expenseDate,  setExpenseDate]  = useState(todayStr());
  const [selCurrency,  setSelCurrency]  = useState("INR");

  // ── Edit expense modal ─────────────────────────────────────────────────────────
  const [editTarget,   setEditTarget]   = useState(null);
  const [editAmount,   setEditAmount]   = useState("");
  const [editCategory, setEditCategory] = useState("Food");
  const [editDesc,     setEditDesc]     = useState("");
  const [editDate,     setEditDate]     = useState("");
  const [editCurrency, setEditCurrency] = useState("INR");

  // ── Delete confirm ─────────────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, type: "expense"|"income" }

  // ── Income modal ───────────────────────────────────────────────────────────────
  const [incomeModal,  setIncomeModal]  = useState(false);
  const [incomeAmt,    setIncomeAmt]    = useState("");
  const [incomeSource, setIncomeSource] = useState("Salary");
  const [incomeDesc,   setIncomeDesc]   = useState("");
  const [incomeDate,   setIncomeDate]   = useState(todayStr());
  const [incomeCur,    setIncomeCur]    = useState("INR");

  // ── Budget modal ───────────────────────────────────────────────────────────────
  const [budgetModal,  setBudgetModal]  = useState(false);
  const [budgetCat,    setBudgetCat]    = useState("Food");
  const [budgetAmt,    setBudgetAmt]    = useState("");

  // ── Recurring modal ────────────────────────────────────────────────────────────
  const [recurModal,   setRecurModal]   = useState(false);
  const [recurAmt,     setRecurAmt]     = useState("");
  const [recurCat,     setRecurCat]     = useState("Bills");
  const [recurDesc,    setRecurDesc]    = useState("");
  const [recurFreq,    setRecurFreq]    = useState("monthly");
  const [recurDay,     setRecurDay]     = useState(1);
  const [recurCur,     setRecurCur]     = useState("INR");

  // ── Activity filters ───────────────────────────────────────────────────────────
  const [searchQuery,    setSearchQuery]    = useState("");
  const [filterCategory, setFilterCategory] = useState(null);
  const [activityView,   setActivityView]   = useState("expenses"); // "expenses" | "income"

  const T         = buildTheme(colorMode);
  const isDesktop = windowWidth >= 900;
  const token     = localStorage.getItem("token");
  const headers   = { headers: { Authorization: `Bearer ${token}` } };

  // ── Window resize ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ── Data fetching ──────────────────────────────────────────────────────────────
  const fetchExpenses = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/expenses", headers);
      setExpenses(res.data);
    } catch (e) { console.log(e); }
  };

  const fetchIncome = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/income", headers);
      setIncome(res.data);
    } catch (e) { console.log(e); }
  };

  const fetchBudgets = async () => {
    try {
      const res = await axios.get(`http://127.0.0.1:8000/budgets?month=${currMonth()}`, headers);
      setBudgets(res.data);
    } catch (e) { console.log(e); }
  };

  const fetchRecurring = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/recurring", headers);
      setRecurring(res.data);
    } catch (e) { console.log(e); }
  };

  const fetchProfile = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/profile", headers);
      setProfile(res.data);
      if (!res.data.is_verified) setVerifyBanner(true);
    } catch (e) { console.log(e); }
  };

  useEffect(() => {
    fetchExpenses();
    fetchIncome();
    fetchBudgets();
    fetchRecurring();
    fetchProfile();
  }, []);

  // ── Toast ──────────────────────────────────────────────────────────────────────
  const showToast = (msg, kind = "success") => {
    clearTimeout(toastRef.current);
    setToast({ msg, kind });
    toastRef.current = setTimeout(() => setToast(null), 2800);
  };

  // ── Auth & theme ───────────────────────────────────────────────────────────────
  const logout = () => { localStorage.removeItem("token"); window.location.href = "/"; };

  const toggleTheme = () => {
    const next = colorMode === "dark" ? "light" : "dark";
    setColorMode(next);
    localStorage.setItem("cairn_theme", next);
  };

  // ── Add expense ────────────────────────────────────────────────────────────────
  const pressKey = (k) => {
    if (k === "back") { setAmount((a) => a.slice(0, -1)); return; }
    setAmount((a) => {
      if (a.replace(/^0+/, "").length >= 7) return a;
      return (a === "0" ? "" : a) + k;
    });
  };

  const openModal = () => {
    setAmount(""); setCategory("Food"); setDescription("");
    setExpenseDate(todayStr()); setSelCurrency("INR");
    setShowModal(true);
  };

  const saveExpense = async () => {
    const amt = Number(amount || 0);
    if (!amt) { showToast("Enter an amount first", "error"); return; }
    try {
      await axios.post("http://127.0.0.1:8000/expenses", {
        amount: amt, category,
        description: description || category,
        date: expenseDate,
        currency: selCurrency,
      }, headers);
      setShowModal(false);
      await fetchExpenses();
      showToast(`₹${fmt(amt)} added to ${category}`);
    } catch (e) {
      showToast(e.response?.data?.detail || "Could not save", "error");
    }
  };

  // ── Edit expense ───────────────────────────────────────────────────────────────
  const openEdit = (tx) => {
    setEditTarget(tx);
    setEditAmount(String(tx.amount));
    setEditCategory(tx.category);
    setEditDesc(tx.description || "");
    setEditDate(tx.date);
    setEditCurrency(tx.currency || "INR");
  };

  const saveEdit = async () => {
    const amt = Number(editAmount || 0);
    if (!amt) { showToast("Amount can't be zero", "error"); return; }
    try {
      await axios.put(`http://127.0.0.1:8000/expenses/${editTarget.id}`, {
        amount: amt,
        category: editCategory,
        description: editDesc,
        date: editDate,
        currency: editCurrency,
      }, headers);
      setEditTarget(null);
      await fetchExpenses();
      showToast("Expense updated");
    } catch (e) {
      showToast(e.response?.data?.detail || "Could not update", "error");
    }
  };

  // ── Delete expense / income ────────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === "expense") {
        await axios.delete(`http://127.0.0.1:8000/expenses/${deleteTarget.id}`, headers);
        await fetchExpenses();
        showToast("Expense deleted");
      } else {
        await axios.delete(`http://127.0.0.1:8000/income/${deleteTarget.id}`, headers);
        await fetchIncome();
        showToast("Income entry deleted");
      }
    } catch (e) {
      showToast("Could not delete", "error");
    } finally {
      setDeleteTarget(null);
    }
  };

  // ── Add income ─────────────────────────────────────────────────────────────────
  const saveIncome = async () => {
    const amt = Number(incomeAmt || 0);
    if (!amt) { showToast("Enter an amount first", "error"); return; }
    try {
      await axios.post("http://127.0.0.1:8000/income", {
        amount: amt,
        source: incomeSource,
        description: incomeDesc || incomeSource,
        date: incomeDate,
        currency: incomeCur,
      }, headers);
      setIncomeModal(false);
      setIncomeAmt(""); setIncomeDesc(""); setIncomeSource("Salary");
      setIncomeDate(todayStr()); setIncomeCur("INR");
      await fetchIncome();
      showToast(`Income of ${currSym(incomeCur)}${fmt(amt)} logged`);
    } catch (e) {
      showToast(e.response?.data?.detail || "Could not save", "error");
    }
  };

  // ── Budgets ────────────────────────────────────────────────────────────────────
  const saveBudget = async () => {
    const amt = Number(budgetAmt || 0);
    if (!amt) { showToast("Enter a budget amount", "error"); return; }
    try {
      await axios.post("http://127.0.0.1:8000/budgets", {
        category: budgetCat,
        amount: amt,
        month: currMonth(),
      }, headers);
      setBudgetModal(false); setBudgetAmt("");
      await fetchBudgets();
      showToast(`Budget set for ${budgetCat}`);
    } catch (e) {
      showToast("Could not save budget", "error");
    }
  };

  const deleteBudget = async (id) => {
    try {
      await axios.delete(`http://127.0.0.1:8000/budgets/${id}`, headers);
      await fetchBudgets();
      showToast("Budget removed");
    } catch (e) { showToast("Could not remove budget", "error"); }
  };

  // ── Recurring ──────────────────────────────────────────────────────────────────
  const saveRecurring = async () => {
    const amt = Number(recurAmt || 0);
    if (!amt) { showToast("Enter an amount", "error"); return; }
    try {
      await axios.post("http://127.0.0.1:8000/recurring", {
        amount: amt,
        category: recurCat,
        description: recurDesc || recurCat,
        currency: recurCur,
        frequency: recurFreq,
        day_of_month: recurDay,
      }, headers);
      setRecurModal(false);
      setRecurAmt(""); setRecurDesc(""); setRecurCat("Bills");
      await fetchRecurring();
      showToast("Recurring expense created");
    } catch (e) {
      showToast(e.response?.data?.detail || "Could not create", "error");
    }
  };

  const toggleRecurring = async (id, active) => {
    try {
      await axios.put(`http://127.0.0.1:8000/recurring/${id}`, { active }, headers);
      await fetchRecurring();
    } catch (e) { showToast("Could not update", "error"); }
  };

  const deleteRecurring = async (id) => {
    try {
      await axios.delete(`http://127.0.0.1:8000/recurring/${id}`, headers);
      await fetchRecurring();
      showToast("Recurring expense removed");
    } catch (e) { showToast("Could not delete", "error"); }
  };

  // ── CSV export ─────────────────────────────────────────────────────────────────
  const exportCSV = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/expenses/export", {
        ...headers,
        responseType: "blob",
      });
      const url  = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href  = url;
      link.setAttribute("download", "cairn-expenses.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast("CSV downloaded");
    } catch (e) { showToast("Export failed", "error"); }
  };

  // ── Email verification ─────────────────────────────────────────────────────────
  const resendVerification = async () => {
    setResendsLoading(true);
    try {
      await axios.post("http://127.0.0.1:8000/resend-verification", {}, headers);
      showToast("Verification email sent — check your inbox.", "success");
    } catch (e) {
      showToast("Couldn't send email. Try again shortly.", "error");
    } finally {
      setResendsLoading(false);
    }
  };

  // ── Derived values ─────────────────────────────────────────────────────────────
  const spent      = expenses.reduce((t, e) => t + Number(e.amount), 0);
  const totalIncome = income.reduce((t, i) => t + Number(i.amount), 0);
  const netFlow    = totalIncome - spent;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const thisWeek = expenses
    .filter((e) => new Date(e.date) >= sevenDaysAgo)
    .reduce((t, e) => t + Number(e.amount), 0);

  const thisMonthExpenses = expenses.filter((e) => e.date && e.date.startsWith(currMonth()));
  const catSpentThisMonth = {};
  thisMonthExpenses.forEach((e) => {
    catSpentThisMonth[e.category] = (catSpentThisMonth[e.category] || 0) + Number(e.amount);
  });

  const totals = {};
  expenses.forEach((e) => { totals[e.category] = (totals[e.category] || 0) + Number(e.amount); });
  const byCat = Object.entries(totals)
    .map(([name, val]) => ({
      name, amount: val,
      color: catMeta(name).color,
      pct: spent ? Math.round((val / spent) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const filteredExpenses = expenses.filter((e) => {
    if (filterCategory && e.category !== filterCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!`${e.description || ""} ${e.category}`.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const recent = expenses.slice(0, 4);

  // ── Style helpers ──────────────────────────────────────────────────────────────
  const tabColor = (t) => tab === t ? T.accentText : T.text3;

  const chipStyle = (cat, selected) => {
    const active = selected === cat;
    return {
      display: "inline-flex", alignItems: "center", gap: 6,
      height: 38, padding: "0 14px", borderRadius: 99,
      fontSize: 13, whiteSpace: "nowrap", flexShrink: 0, cursor: "pointer",
      fontWeight: active ? 600 : 400,
      background: active ? T.accentBg : T.chip,
      color: active ? T.accentFg : T.text2,
      border: `1px solid ${active ? "transparent" : T.border}`,
      transition: "all .15s ease",
    };
  };

  // ── Inline input style ─────────────────────────────────────────────────────────
  const inputSt = {
    height: 46, borderRadius: 14, border: `1px solid ${T.border}`,
    background: T.chip, color: T.text, fontFamily: "inherit",
    fontSize: 15, padding: "0 14px", outline: "none", width: "100%",
    boxSizing: "border-box",
  };
  const selectSt = {
    ...inputSt,
    WebkitAppearance: "none",
    appearance: "none",
    cursor: "pointer",
  };

  // ── NAV definition ─────────────────────────────────────────────────────────────
  const NAV = [
    { id: "home",     label: "Home",     icon: (c) => <div style={{ width: 16, height: 16, borderRadius: 5, border: `2px solid ${c}` }} /> },
    { id: "activity", label: "Activity", icon: (c) => <div style={{ display: "flex", flexDirection: "column", gap: 3, width: 16 }}>{[0,1,2].map((i) => <span key={i} style={{ height: 2, background: c, borderRadius: 2 }} />)}</div> },
    { id: "insights", label: "Insights", icon: (c) => <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 16 }}>{[8,13,16].map((h,i) => <span key={i} style={{ width: 4, height: h, background: c, borderRadius: 2 }} />)}</div> },
    { id: "profile",  label: "Profile",  icon: (c) => <div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${c}` }} /> },
  ];

  // ════════════════════════════════════════════════════════════════════════════════
  // TAB CONTENT
  // ════════════════════════════════════════════════════════════════════════════════

  const HomeContent = () => (
    <div>
      {/* Net flow hero */}
      <div style={{
        position: "relative", borderRadius: 28, padding: 26,
        background: T.heroBg, border: `1px solid ${T.border}`,
        overflow: "hidden", marginBottom: 16,
      }}>
        <div style={{ position: "absolute", top: -30, right: -20, width: 130, height: 130, borderRadius: "50%", background: "radial-gradient(circle,rgba(227,189,158,0.3),transparent 65%)", pointerEvents: "none" }} />
        <div style={{ fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", color: T.text2, marginBottom: 6 }}>Net this month</div>
        <div style={{
          fontFamily: "'Instrument Serif', serif",
          fontSize: isDesktop ? 46 : 48, lineHeight: 1,
          fontVariantNumeric: "tabular-nums", marginBottom: 18,
          color: netFlow >= 0 ? T.text : "#E8897C",
        }}>
          {netFlow >= 0 ? "+" : "−"}₹{fmt(Math.abs(netFlow))}
        </div>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 11, color: T.text2, marginBottom: 2 }}>Income</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#8FCBA8", fontVariantNumeric: "tabular-nums" }}>+₹{fmt(totalIncome)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: T.text2, marginBottom: 2 }}>Expenses</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.text, fontVariantNumeric: "tabular-nums" }}>−₹{fmt(spent)}</div>
          </div>
        </div>
        <button
          onClick={() => setIncomeModal(true)}
          style={{
            position: "absolute", right: 20, bottom: 20,
            height: 34, padding: "0 14px", border: `1px solid rgba(143,203,168,0.3)`,
            borderRadius: 99, background: rgba("#8FCBA8", 0.12), color: "#8FCBA8",
            fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}
        >+ Add income</button>
      </div>

      {/* This week */}
      <div style={{ borderRadius: 20, padding: "16px 20px", background: T.surface, border: `1px solid ${T.border}`, marginBottom: 24 }}>
        <div style={{ fontSize: 12, color: T.text2, marginBottom: 4 }}>This week</div>
        <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 28, fontVariantNumeric: "tabular-nums", color: T.text }}>₹{fmt(thisWeek)}</div>
      </div>

      {/* Recent */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: T.text }}>Recent</span>
        <span onClick={() => setTab("activity")} style={{ fontSize: 13, color: T.accentText, fontWeight: 600, cursor: "pointer" }}>See all</span>
      </div>
      {recent.length === 0
        ? <EmptyState T={T} onAdd={openModal} label="Nothing logged yet" />
        : <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {recent.map((tx) => <TxCard key={tx.id} tx={tx} T={T} />)}
          </div>
      }
    </div>
  );

  const ActivityContent = () => (
    <div>
      <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 32, marginBottom: 18, color: T.text }}>Activity</div>

      {/* View toggle: expenses / income */}
      <div style={{ display: "flex", background: T.chip, borderRadius: 99, padding: 4, marginBottom: 16, border: `1px solid ${T.border}` }}>
        {[{ id: "expenses", label: "Expenses" }, { id: "income", label: "Income" }].map(({ id, label }) => {
          const active = activityView === id;
          return (
            <div key={id} onClick={() => setActivityView(id)} style={{
              flex: 1, textAlign: "center", padding: "8px 0", borderRadius: 99,
              fontSize: 13, fontWeight: active ? 600 : 400, cursor: "pointer",
              background: active ? T.accentBg : "transparent",
              color: active ? T.accentFg : T.text2,
              transition: "all .15s",
            }}>{label}</div>
          );
        })}
      </div>

      {activityView === "expenses" && (
        <>
          {/* Search */}
          <div style={{ position: "relative", marginBottom: 14 }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: T.text3, fontSize: 15 }}>🔍</span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search expenses…"
              style={{ ...inputSt, paddingLeft: 40 }}
            />
          </div>

          {/* Category filters */}
          <div style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 16, paddingBottom: 2 }}>
            <div onClick={() => setFilterCategory(null)} style={chipStyle("All", filterCategory === null ? "All" : "")}>All</div>
            {Object.keys(CAT_META).map((cat) => (
              <div key={cat} onClick={() => setFilterCategory(filterCategory === cat ? null : cat)} style={chipStyle(cat, filterCategory)}>
                {CAT_META[cat].emoji} {cat}
              </div>
            ))}
          </div>

          {/* Export + count row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <span style={{ fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", color: T.text3 }}>
              {filteredExpenses.length} item{filteredExpenses.length !== 1 ? "s" : ""}
            </span>
            <button
              onClick={exportCSV}
              style={{ height: 32, padding: "0 14px", border: `1px solid ${T.border}`, borderRadius: 99, background: "transparent", color: T.text2, fontFamily: "inherit", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >⬇ Export CSV</button>
          </div>

          {filteredExpenses.length === 0
            ? <EmptyState T={T} onAdd={openModal} label="No matching expenses" />
            : <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {filteredExpenses.map((tx) => (
                  <TxCard
                    key={tx.id} tx={tx} T={T}
                    onEdit={openEdit}
                    onDelete={(id) => setDeleteTarget({ id, type: "expense" })}
                  />
                ))}
              </div>
          }
        </>
      )}

      {activityView === "income" && (
        <>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
            <button
              onClick={() => setIncomeModal(true)}
              style={{ height: 36, padding: "0 16px", border: "none", borderRadius: 99, background: T.accentBg, color: T.accentFg, fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >+ Add income</button>
          </div>
          {income.length === 0
            ? <EmptyState T={T} onAdd={() => setIncomeModal(true)} label="No income logged yet" />
            : <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {income.map((entry) => (
                  <IncomeCard
                    key={entry.id} entry={entry} T={T}
                    onDelete={(id) => setDeleteTarget({ id, type: "income" })}
                  />
                ))}
              </div>
          }
        </>
      )}
    </div>
  );

  const InsightsContent = () => {
    const [budgetEditCat, setBudgetEditCat] = useState(null);
    const [budgetEditAmt, setBudgetEditAmt] = useState("");

    const handleSetBudget = async (cat) => {
      const amt = Number(budgetEditAmt || 0);
      if (!amt) { showToast("Enter an amount", "error"); return; }
      try {
        await axios.post("http://127.0.0.1:8000/budgets", {
          category: cat, amount: amt, month: currMonth(),
        }, headers);
        setBudgetEditCat(null); setBudgetEditAmt("");
        await fetchBudgets();
        showToast(`Budget set for ${cat}`);
      } catch (e) { showToast("Could not save budget", "error"); }
    };

    return (
      <div>
        <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 32, marginBottom: 24, color: T.text }}>Insights</div>
        {spent === 0 ? (
          <EmptyState T={T} label="No expenses yet" />
        ) : (
          <>
            {/* Pie chart */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
              <ResponsiveContainer width={220} height={220}>
                <PieChart>
                  <Pie data={byCat} dataKey="amount" nameKey="name" innerRadius={62} outerRadius={100} paddingAngle={0} stroke="none">
                    {byCat.map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Pie>
                  <Tooltip formatter={(val) => [`₹${fmt(val)}`, ""]} contentStyle={{ background: "#11201A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#ECF1ED", fontSize: 13 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ fontSize: 12, color: T.text2, marginBottom: 4 }}>Total spent</div>
              <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 38, fontVariantNumeric: "tabular-nums", color: T.text }}>₹{fmt(spent)}</div>
            </div>

            {/* Category breakdown */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 32 }}>
              {byCat.map((c) => (
                <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 16, background: rgba(c.color, 0.10) }}>
                  <div style={{ width: 36, height: 36, borderRadius: 11, background: rgba(c.color, 0.22), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>
                    {catMeta(c.name).emoji}
                  </div>
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: T.text }}>{c.name}</span>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: T.text }}>₹{fmt(c.amount)}</div>
                    <div style={{ fontSize: 11, color: T.text2 }}>{c.pct}%</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Budgets */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>Monthly budgets</div>
              <span style={{ fontSize: 12, color: T.text3 }}>{new Date().toLocaleString("en-IN", { month: "long", year: "numeric" })}</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {Object.keys(CAT_META).map((cat) => {
                const spentCat = catSpentThisMonth[cat] || 0;
                const budgetEntry = budgets.find((b) => b.category === cat);
                const budgetAmt   = budgetEntry?.amount || 0;
                const pct         = budgetAmt ? Math.min(100, Math.round((spentCat / budgetAmt) * 100)) : 0;
                const overBudget  = budgetAmt && spentCat > budgetAmt;
                const isEditing   = budgetEditCat === cat;

                return (
                  <div key={cat} style={{ borderRadius: 18, padding: "14px 16px", background: T.surface, border: `1px solid ${overBudget ? "rgba(232,137,124,0.3)" : T.border}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: budgetAmt ? 10 : 0 }}>
                      <span style={{ fontSize: 18 }}>{catMeta(cat).emoji}</span>
                      <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: T.text }}>{cat}</span>
                      {budgetAmt > 0 && (
                        <span style={{ fontSize: 12, fontVariantNumeric: "tabular-nums", color: overBudget ? "#E8897C" : T.text2, fontWeight: 600 }}>
                          ₹{fmt(spentCat)} / ₹{fmt(budgetAmt)}
                        </span>
                      )}
                      {!budgetAmt && (
                        <span style={{ fontSize: 12, color: T.text3 }}>₹{fmt(spentCat)} spent</span>
                      )}
                    </div>

                    {budgetAmt > 0 && (
                      <div style={{ height: 6, borderRadius: 99, background: T.track, overflow: "hidden", marginBottom: 8 }}>
                        <div style={{ height: "100%", width: `${pct}%`, borderRadius: 99, background: overBudget ? "#E8897C" : `linear-gradient(90deg,${catMeta(cat).color},${catMeta(cat).color}aa)`, transition: "width .4s ease" }} />
                      </div>
                    )}

                    {overBudget && (
                      <div style={{ fontSize: 11, color: "#E8897C", marginBottom: 8 }}>⚠ Over budget by ₹{fmt(spentCat - budgetAmt)}</div>
                    )}

                    {isEditing ? (
                      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                        <input
                          type="number" placeholder="Amount (₹)"
                          value={budgetEditAmt}
                          onChange={(e) => setBudgetEditAmt(e.target.value)}
                          style={{ ...inputSt, flex: 1, height: 38, fontSize: 14 }}
                        />
                        <button onClick={() => handleSetBudget(cat)} style={{ height: 38, padding: "0 14px", border: "none", borderRadius: 10, background: T.accentBg, color: T.accentFg, fontFamily: "inherit", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>Save</button>
                        <button onClick={() => { setBudgetEditCat(null); setBudgetEditAmt(""); }} style={{ height: 38, padding: "0 12px", border: `1px solid ${T.border}`, borderRadius: 10, background: "transparent", color: T.text2, fontFamily: "inherit", cursor: "pointer", fontSize: 13 }}>✕</button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: 8, marginTop: budgetAmt ? 2 : 8 }}>
                        <button
                          onClick={() => { setBudgetEditCat(cat); setBudgetEditAmt(budgetAmt ? String(budgetAmt) : ""); }}
                          style={{ fontSize: 12, color: T.accentText, fontWeight: 600, cursor: "pointer", background: "none", border: "none", padding: 0, fontFamily: "inherit" }}
                        >{budgetAmt ? "Edit budget" : "Set budget"}</button>
                        {budgetEntry && (
                          <button onClick={() => deleteBudget(budgetEntry.id)} style={{ fontSize: 12, color: "#E8897C", fontWeight: 500, cursor: "pointer", background: "none", border: "none", padding: 0, fontFamily: "inherit" }}>Remove</button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  };

  const ProfileContent = () => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg,#2a5446,#1f4438)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 700, color: "#D8E6DD", marginBottom: 12 }}>
        {(profile.username || "A")[0].toUpperCase()}
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: T.text, marginBottom: 4 }}>{profile.username}</div>
      <div style={{ fontSize: 13, color: T.text2, marginBottom: 24 }}>{profile.email}</div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 10, width: "100%", maxWidth: 440, marginBottom: 20 }}>
        {[
          { value: expenses.length, label: "expenses" },
          { value: income.length,   label: "income entries" },
          { value: `₹${fmt(spent)}`, label: "tracked" },
        ].map((s) => (
          <div key={s.label} style={{ flex: 1, borderRadius: 18, background: T.surface, border: `1px solid ${T.border}`, padding: 14, textAlign: "center" }}>
            <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, fontVariantNumeric: "tabular-nums", color: T.text }}>{s.value}</div>
            <div style={{ fontSize: 10, color: T.text2, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Theme toggle */}
      <div style={{ width: "100%", maxWidth: 440, borderRadius: 20, background: T.surface, border: `1px solid ${T.border}`, overflow: "hidden", marginBottom: 20 }}>
        <div style={{ padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 12 }}>
            <span style={{ fontSize: 16 }}>🎨</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, color: T.text, fontWeight: 500 }}>Appearance</div>
              <div style={{ fontSize: 11, color: T.text2, marginTop: 1 }}>
                {colorMode === "dark" ? "Dark mode active" : "Light mode active"}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", background: colorMode === "dark" ? "rgba(0,0,0,0.3)" : "rgba(20,34,28,0.07)", borderRadius: 99, padding: 4 }}>
            {[{ id: "dark", icon: "🌙", label: "Dark" }, { id: "light", icon: "☀️", label: "Light" }].map(({ id, icon, label }) => {
              const active = colorMode === id;
              return (
                <div key={id} onClick={() => { if (!active) toggleTheme(); }} style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "9px 0", borderRadius: 99,
                  background: active ? T.accentBg : "transparent",
                  color: active ? T.accentFg : T.text2,
                  fontSize: 13, fontWeight: active ? 600 : 400,
                  cursor: active ? "default" : "pointer", transition: "all .18s ease",
                }}>
                  <span style={{ fontSize: 14 }}>{icon}</span>{label}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recurring expenses */}
      <div style={{ width: "100%", maxWidth: 440, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>Recurring</div>
          <button
            onClick={() => setRecurModal(true)}
            style={{ height: 32, padding: "0 14px", border: "none", borderRadius: 99, background: T.accentBg, color: T.accentFg, fontFamily: "inherit", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
          >+ Add</button>
        </div>
        {recurring.length === 0 ? (
          <div style={{ fontSize: 13, color: T.text3, textAlign: "center", padding: "20px 0" }}>No recurring expenses set up.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {recurring.map((r) => (
              <div key={r.id} style={{
                display: "flex", alignItems: "center", gap: 12,
                borderRadius: 16, padding: "12px 14px",
                background: T.surface, border: `1px solid ${T.border}`,
                opacity: r.active ? 1 : 0.5,
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 11, background: rgba(catMeta(r.category).color, 0.16), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                  {catMeta(r.category).emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.description || r.category}</div>
                  <div style={{ fontSize: 11, color: T.text2 }}>{r.frequency} · {currSym(r.currency)}{fmt(r.amount)}{r.next_due_date ? ` · next ${r.next_due_date}` : ""}</div>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button onClick={() => toggleRecurring(r.id, !r.active)} style={{
                    height: 28, padding: "0 10px", borderRadius: 8, border: `1px solid ${T.border}`,
                    background: r.active ? rgba("#8FCBA8", 0.12) : T.chip,
                    color: r.active ? "#8FCBA8" : T.text3,
                    fontFamily: "inherit", fontSize: 11, fontWeight: 600, cursor: "pointer",
                  }}>{r.active ? "On" : "Off"}</button>
                  <button onClick={() => deleteRecurring(r.id)} style={{
                    width: 28, height: 28, borderRadius: 8, border: "none",
                    background: "rgba(232,137,124,0.10)", color: "#E8897C", cursor: "pointer", fontSize: 13,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ width: "100%", maxWidth: 440 }}>
        <button onClick={logout} style={{ width: "100%", height: 50, border: "1px solid rgba(232,137,124,0.3)", borderRadius: 99, background: "rgba(232,137,124,0.08)", color: "#E8897C", fontFamily: "inherit", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
          Log out
        </button>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════════
  // MODALS
  // ════════════════════════════════════════════════════════════════════════════════

  const sheetWrap = (content, onClose) => (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", flexDirection: "column" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }} />
      <div style={{
        position: "relative", marginTop: "auto",
        borderRadius: "36px 36px 0 0",
        background: T.sheetBg,
        borderTop: `1px solid ${T.border}`,
        padding: "14px 24px 36px",
        animation: "cairnSheet .3s cubic-bezier(.22,1,.36,1)",
        boxShadow: "0 -24px 60px -20px rgba(0,0,0,0.5)",
        maxWidth: isDesktop ? 520 : "100%",
        marginLeft: isDesktop ? "auto" : 0,
        marginRight: isDesktop ? "auto" : 0,
        width: "100%",
        maxHeight: "90vh",
        overflowY: "auto",
      }}>
        <div style={{ width: 42, height: 5, borderRadius: 99, background: "rgba(255,255,255,0.22)", margin: "0 auto 20px" }} />
        {content}
      </div>
    </div>
  );

  // ── Add expense modal ──────────────────────────────────────────────────────────
  const addExpenseModal = showModal ? sheetWrap(
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <button onClick={() => setShowModal(false)} style={{ width: 34, height: 34, borderRadius: "50%", border: "none", background: T.chip, color: T.text2, fontSize: 16, cursor: "pointer" }}>✕</button>
        <span style={{ fontSize: 16, fontWeight: 700, color: T.text }}>New expense</span>
        <span style={{ width: 34 }} />
      </div>

      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: T.text2, marginBottom: 2 }}>Amount</div>
        <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 54, lineHeight: 1.1, fontVariantNumeric: "tabular-nums", color: T.text }}>
          <span style={{ color: T.text3 }}>{currSym(selCurrency)}</span>{amount ? fmt(Number(amount)) : "0"}
        </div>
      </div>

      {/* Category chips */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 14, paddingBottom: 2 }}>
        {Object.keys(CAT_META).map((cat) => (
          <div key={cat} onClick={() => setCategory(cat)} style={chipStyle(cat, category)}>
            {CAT_META[cat].emoji} {cat}
          </div>
        ))}
      </div>

      {/* Description */}
      <input
        value={description} onChange={(e) => setDescription(e.target.value)}
        placeholder="Add a note (optional)"
        style={{ ...inputSt, marginBottom: 10 }}
      />

      {/* Date + Currency row */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <input
          type="date" value={expenseDate} max={todayStr()}
          onChange={(e) => setExpenseDate(e.target.value)}
          style={{ ...inputSt, flex: 1 }}
        />
        <select
          value={selCurrency} onChange={(e) => setSelCurrency(e.target.value)}
          style={{ ...selectSt, flex: "0 0 100px" }}
        >
          {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Numpad */}
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
    </>,
    () => setShowModal(false)
  ) : null;

  // ── Edit expense modal ─────────────────────────────────────────────────────────
  const editExpenseModal = editTarget ? sheetWrap(
    <>
      <div style={{ fontSize: 16, fontWeight: 700, color: T.text, textAlign: "center", marginBottom: 20 }}>Edit expense</div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: T.text3, marginBottom: 6, textTransform: "uppercase", letterSpacing: ".08em" }}>Amount</div>
        <input
          type="number" value={editAmount}
          onChange={(e) => setEditAmount(e.target.value)}
          style={inputSt}
        />
      </div>

      <div style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 12, paddingBottom: 2 }}>
        {Object.keys(CAT_META).map((cat) => (
          <div key={cat} onClick={() => setEditCategory(cat)} style={chipStyle(cat, editCategory)}>
            {CAT_META[cat].emoji} {cat}
          </div>
        ))}
      </div>

      <input
        value={editDesc} onChange={(e) => setEditDesc(e.target.value)}
        placeholder="Description"
        style={{ ...inputSt, marginBottom: 12 }}
      />

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <input
          type="date" value={editDate} max={todayStr()}
          onChange={(e) => setEditDate(e.target.value)}
          style={{ ...inputSt, flex: 1 }}
        />
        <select
          value={editCurrency} onChange={(e) => setEditCurrency(e.target.value)}
          style={{ ...selectSt, flex: "0 0 100px" }}
        >
          {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => setEditTarget(null)} style={{ flex: 1, height: 50, border: `1px solid ${T.border}`, borderRadius: 99, background: "transparent", color: T.text2, fontFamily: "inherit", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
          Cancel
        </button>
        <button onClick={saveEdit} style={{ flex: 2, height: 50, border: "none", borderRadius: 99, background: T.accentBg, color: T.accentFg, fontFamily: "inherit", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
          Save changes
        </button>
      </div>
    </>,
    () => setEditTarget(null)
  ) : null;

  // ── Income modal ───────────────────────────────────────────────────────────────
  const incomeModalJsx = incomeModal ? sheetWrap(
    <>
      <div style={{ fontSize: 16, fontWeight: 700, color: T.text, textAlign: "center", marginBottom: 20 }}>Log income</div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: T.text3, marginBottom: 6, textTransform: "uppercase", letterSpacing: ".08em" }}>Amount</div>
        <input
          type="number" value={incomeAmt} placeholder="0"
          onChange={(e) => setIncomeAmt(e.target.value)}
          style={inputSt}
        />
      </div>

      {/* Source chips */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 12, paddingBottom: 2 }}>
        {INCOME_SOURCES.map((src) => (
          <div key={src} onClick={() => setIncomeSource(src)} style={chipStyle(src, incomeSource)}>
            {INCOME_META[src]?.emoji} {src}
          </div>
        ))}
      </div>

      <input
        value={incomeDesc} onChange={(e) => setIncomeDesc(e.target.value)}
        placeholder="Note (optional)"
        style={{ ...inputSt, marginBottom: 12 }}
      />

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <input
          type="date" value={incomeDate} max={todayStr()}
          onChange={(e) => setIncomeDate(e.target.value)}
          style={{ ...inputSt, flex: 1 }}
        />
        <select
          value={incomeCur} onChange={(e) => setIncomeCur(e.target.value)}
          style={{ ...selectSt, flex: "0 0 100px" }}
        >
          {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <button onClick={saveIncome} style={{ width: "100%", height: 54, border: "none", borderRadius: 99, background: T.accentBg, color: T.accentFg, fontFamily: "inherit", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
        Save income
      </button>
    </>,
    () => setIncomeModal(false)
  ) : null;

  // ── Add recurring modal ────────────────────────────────────────────────────────
  const recurModalJsx = recurModal ? sheetWrap(
    <>
      <div style={{ fontSize: 16, fontWeight: 700, color: T.text, textAlign: "center", marginBottom: 20 }}>Add recurring expense</div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: T.text3, marginBottom: 6, textTransform: "uppercase", letterSpacing: ".08em" }}>Amount</div>
        <input
          type="number" value={recurAmt} placeholder="0"
          onChange={(e) => setRecurAmt(e.target.value)}
          style={inputSt}
        />
      </div>

      <div style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 12, paddingBottom: 2 }}>
        {Object.keys(CAT_META).map((cat) => (
          <div key={cat} onClick={() => setRecurCat(cat)} style={chipStyle(cat, recurCat)}>
            {CAT_META[cat].emoji} {cat}
          </div>
        ))}
      </div>

      <input
        value={recurDesc} onChange={(e) => setRecurDesc(e.target.value)}
        placeholder="Label (e.g. Netflix, Rent)"
        style={{ ...inputSt, marginBottom: 12 }}
      />

      {/* Frequency */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: T.text3, marginBottom: 6, textTransform: "uppercase", letterSpacing: ".08em" }}>Frequency</div>
        <div style={{ display: "flex", gap: 8 }}>
          {FREQUENCIES.map(({ id, label }) => (
            <div key={id} onClick={() => setRecurFreq(id)} style={{ ...chipStyle(id, recurFreq), flex: 1, justifyContent: "center" }}>{label}</div>
          ))}
        </div>
      </div>

      {recurFreq === "monthly" && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: T.text3, marginBottom: 6, textTransform: "uppercase", letterSpacing: ".08em" }}>Day of month (1-28)</div>
          <input
            type="number" min={1} max={28} value={recurDay}
            onChange={(e) => setRecurDay(Number(e.target.value))}
            style={inputSt}
          />
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: T.text3, marginBottom: 6, textTransform: "uppercase", letterSpacing: ".08em" }}>Currency</div>
        <select value={recurCur} onChange={(e) => setRecurCur(e.target.value)} style={selectSt}>
          {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <button onClick={saveRecurring} style={{ width: "100%", height: 54, border: "none", borderRadius: 99, background: T.accentBg, color: T.accentFg, fontFamily: "inherit", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
        Create recurring
      </button>
    </>,
    () => setRecurModal(false)
  ) : null;

  // ── Delete confirm overlay ─────────────────────────────────────────────────────
  const deleteConfirmJsx = deleteTarget ? (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px" }}>
      <div onClick={() => setDeleteTarget(null)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} />
      <div style={{ position: "relative", borderRadius: 28, padding: "28px 28px 24px", background: T.sheetBg, border: `1px solid ${T.border}`, width: "100%", maxWidth: 360 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 8 }}>Delete {deleteTarget.type === "expense" ? "expense" : "income entry"}?</div>
        <div style={{ fontSize: 14, color: T.text2, marginBottom: 24 }}>This action cannot be undone.</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, height: 46, border: `1px solid ${T.border}`, borderRadius: 99, background: "transparent", color: T.text2, fontFamily: "inherit", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          <button onClick={confirmDelete} style={{ flex: 1, height: 46, border: "none", borderRadius: 99, background: "#E8897C", color: "#fff", fontFamily: "inherit", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Delete</button>
        </div>
      </div>
    </div>
  ) : null;

  // ── Toast JSX ──────────────────────────────────────────────────────────────────
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

  // ── Verify banner ──────────────────────────────────────────────────────────────
  const verifyBannerJsx = verifyBanner ? (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "11px 16px",
      background: "rgba(227,189,158,0.10)",
      borderBottom: "1px solid rgba(227,189,158,0.20)",
      flexWrap: "wrap",
    }}>
      <span style={{ fontSize: 13, color: "#E3BD9E", flex: 1, minWidth: 200 }}>
        ✉ Please verify your email address to secure your account.
      </span>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <span
          onClick={resendsLoading ? undefined : resendVerification}
          style={{ fontSize: 12, fontWeight: 600, color: "#E3BD9E", cursor: resendsLoading ? "default" : "pointer", opacity: resendsLoading ? 0.5 : 1, textDecoration: "underline" }}
        >{resendsLoading ? "Sending…" : "Resend email"}</span>
        <span onClick={() => setVerifyBanner(false)} style={{ fontSize: 18, color: "rgba(255,255,255,0.3)", cursor: "pointer", lineHeight: 1 }}>×</span>
      </div>
    </div>
  ) : null;

  // ════════════════════════════════════════════════════════════════════════════════
  // DESKTOP LAYOUT
  // ════════════════════════════════════════════════════════════════════════════════
  if (isDesktop) {
    return (
      <div style={{ minHeight: "100vh", background: T.rootBg, color: T.text, fontFamily: "'Hanken Grotesk', system-ui, sans-serif", display: "flex" }}>
        {toastJsx}
        {deleteConfirmJsx}

        {/* SIDEBAR */}
        <div style={{
          width: 228, flexShrink: 0,
          borderRight: `1px solid ${T.line}`,
          background: T.railBg,
          position: "sticky", top: 0, height: "100vh",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}>
          {/* Logo — fixed top */}
          <div style={{ flexShrink: 0, padding: "26px 18px 12px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 8px" }}>
              <CairnLogo accent={T.accent} size={20} />
              <span style={{ fontSize: 16, fontWeight: 700, color: T.text }}>Cairn</span>
            </div>
          </div>

          {/* Nav items — scrollable middle section */}
          <div style={{ flex: 1, overflowY: "auto", padding: "4px 18px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
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
            </div>
          </div>

          {/* User card — pinned to bottom, always visible */}
          <div style={{ flexShrink: 0, padding: "12px 18px 20px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11, padding: 10, borderRadius: 14, background: T.raised }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#2a5446,#1f4438)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#D8E6DD", flexShrink: 0 }}>
                {(profile.username || "A")[0].toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile.username}</div>
                <div style={{ fontSize: 11, color: T.text2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile.email}</div>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN AREA */}
        <div style={{ flex: 1, minWidth: 0, overflowY: "auto", display: "flex", flexDirection: "column" }}>
          {verifyBannerJsx}
          <div style={{ flex: 1, padding: 30 }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
              <div>
                <div style={{ fontSize: 14, color: T.text2 }}>{new Date().toLocaleString("en-IN", { month: "long", year: "numeric" })}</div>
                <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 32, color: T.text }}>
                  Good morning, {profile.username || "there"}
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setIncomeModal(true)} style={{ height: 46, padding: "0 18px", border: `1px solid rgba(143,203,168,0.3)`, borderRadius: 99, background: rgba("#8FCBA8", 0.10), color: "#8FCBA8", fontFamily: "inherit", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                  + Income
                </button>
                <button onClick={openModal} style={{ height: 46, padding: "0 22px", border: "none", borderRadius: 99, background: T.accentBg, color: T.accentFg, fontFamily: "inherit", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
                  + Expense
                </button>
              </div>
            </div>

            {tab === "home" && (
              <>
                {/* Stat row */}
                <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
                  {/* Net flow hero */}
                  <div style={{ position: "relative", borderRadius: 24, padding: 24, background: T.heroBg, border: `1px solid ${T.border}`, overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: -30, right: -20, width: 140, height: 140, borderRadius: "50%", background: "radial-gradient(circle,rgba(227,189,158,0.3),transparent 65%)", pointerEvents: "none" }} />
                    <div style={{ fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", color: T.text2, marginBottom: 6 }}>Net this month</div>
                    <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 42, lineHeight: 1, fontVariantNumeric: "tabular-nums", marginBottom: 14, color: netFlow >= 0 ? T.text : "#E8897C" }}>
                      {netFlow >= 0 ? "+" : "−"}₹{fmt(Math.abs(netFlow))}
                    </div>
                    <div style={{ display: "flex", gap: 16 }}>
                      <div>
                        <div style={{ fontSize: 11, color: T.text2 }}>Income</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#8FCBA8", fontVariantNumeric: "tabular-nums" }}>+₹{fmt(totalIncome)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: T.text2 }}>Spent</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: T.text, fontVariantNumeric: "tabular-nums" }}>−₹{fmt(spent)}</div>
                      </div>
                    </div>
                  </div>
                  {/* This week */}
                  <div style={{ borderRadius: 24, padding: 22, background: T.surface, border: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 12, color: T.text2, marginBottom: 8 }}>This week</div>
                    <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 32, fontVariantNumeric: "tabular-nums", color: T.text }}>₹{fmt(thisWeek)}</div>
                    <div style={{ fontSize: 12, color: T.accentText, marginTop: 6 }}>Last 7 days</div>
                  </div>
                  {/* Transactions */}
                  <div style={{ borderRadius: 24, padding: 22, background: T.surface, border: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 12, color: T.text2, marginBottom: 8 }}>Transactions</div>
                    <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 32, fontVariantNumeric: "tabular-nums", color: T.text }}>{expenses.length}</div>
                    <div style={{ fontSize: 12, color: T.text2, marginTop: 6 }}>All time</div>
                  </div>
                </div>

                {/* Ledger + chart */}
                <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16 }}>
                  <div style={{ borderRadius: 24, padding: 22, background: T.surface, border: `1px solid ${T.border}` }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Recent</span>
                      <span onClick={() => setTab("activity")} style={{ fontSize: 13, color: T.accentText, cursor: "pointer" }}>See all</span>
                    </div>
                    {recent.length === 0
                      ? <EmptyState T={T} onAdd={openModal} label="Nothing logged yet" />
                      : <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                          {recent.map((tx, i) => {
                            const meta = catMeta(tx.category);
                            const sym  = currSym(tx.currency || "INR");
                            return (
                              <div key={tx.id}>
                                {i > 0 && <div style={{ height: 1, background: T.line }} />}
                                <div style={{ display: "flex", alignItems: "center", gap: 13, padding: "10px 0" }}>
                                  <div style={{ width: 38, height: 38, borderRadius: 12, background: rgba(meta.color, 0.16), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{meta.emoji}</div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tx.description || tx.category}</div>
                                    <div style={{ fontSize: 12, color: T.text2 }}>{tx.category} · {tx.date}</div>
                                  </div>
                                  <div style={{ fontSize: 15, fontWeight: 600, fontVariantNumeric: "tabular-nums", color: T.text }}>−{sym}{fmt(tx.amount)}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                    }
                  </div>

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
                                <div style={{ fontSize: 11, color: T.text2 }}>{c.pct}%</div>
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

            {tab === "activity" && <div style={{ maxWidth: 700, margin: "0 auto" }}><ActivityContent /></div>}
            {tab === "insights" && <div style={{ maxWidth: 620, margin: "0 auto" }}><InsightsContent /></div>}
            {tab === "profile" && <div style={{ maxWidth: 500, margin: "0 auto" }}><ProfileContent /></div>}
          </div>
        </div>

        {addExpenseModal}
        {editExpenseModal}
        {incomeModalJsx}
        {recurModalJsx}
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════════
  // MOBILE LAYOUT
  // ════════════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ minHeight: "100vh", background: T.rootBg, color: T.text, fontFamily: "'Hanken Grotesk', system-ui, sans-serif", display: "flex", flexDirection: "column", position: "relative" }}>
      {toastJsx}
      {verifyBannerJsx}
      {deleteConfirmJsx}

      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 100 }}>
        <div style={{ padding: "20px 22px" }}>
          {tab === "home" && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 13, color: T.text2 }}>Good morning,</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: T.text }}>{profile.username || "there"}</div>
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

      {addExpenseModal}
      {editExpenseModal}
      {incomeModalJsx}
      {recurModalJsx}
    </div>
  );
}
