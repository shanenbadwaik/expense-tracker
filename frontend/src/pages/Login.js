import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import API from "../api";

const ACCENT = "#8FCBA8";

const inputStyle = {
  height: 52,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.05)",
  color: "#ECF1ED",
  fontFamily: "'Hanken Grotesk', system-ui, sans-serif",
  fontSize: 15,
  paddingLeft: 16,
  paddingRight: 16,
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
  display: "block",
};

export default function Login() {
  const [mode, setMode]         = useState("login");
  const [formData, setFormData] = useState({ username: "", email: "", password: "" });
  const [toast, setToast]       = useState(null);
  const [loading, setLoading]   = useState(false);
  const [verifyUrl, setVerifyUrl] = useState(null);
  const navigate                = useNavigate();

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const showToast = (msg, kind = "error") => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "register") {
        const res = await axios.post(`${API}/register`, {
          username: formData.username,
          email:    formData.email,
          password: formData.password,
        });
        if (res.data.verify_url) {
          setVerifyUrl(res.data.verify_url);
        } else {
          showToast("Account created — check your email to verify.", "success");
          setMode("login");
          setFormData({ username: "", email: "", password: "" });
        }
      } else {
        const body = new URLSearchParams();
        body.append("username", formData.email);
        body.append("password", formData.password);
        const res = await axios.post(`${API}/login`, body, {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
        localStorage.setItem("token", res.data.access_token);
        window.location.href = "/dashboard";
      }
    } catch (err) {
      const detail = err.response?.data?.detail;
      const msg = Array.isArray(detail)
        ? detail.map((d) => d.msg?.replace(/^Value error,\s*/i, "")).join(" · ")
        : (typeof detail === "string" ? detail : "Something went wrong");
      showToast(msg);
    } finally {
      setLoading(false);
    }
  };

  const isRegister = mode === "register";

  if (verifyUrl) {
    return (
      <div style={{ minHeight:"100vh", width:"100%", background:"#070D0B", display:"grid", placeItems:"center", padding:"40px 20px", boxSizing:"border-box", fontFamily:"'Hanken Grotesk',system-ui,sans-serif" }}>
        <div style={{ width:"100%", maxWidth:460 }}>
          <div style={{ borderRadius:28, overflow:"hidden", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.10)" }}>
            <div style={{ padding:"36px 36px 28px", background:"linear-gradient(165deg,#1f4438,#0e1a15)" }}>
              <div style={{ fontFamily:"'Instrument Serif',serif", fontSize:36, color:"#fff" }}>Account created.</div>
              <div style={{ fontSize:15, color:"rgba(255,255,255,0.5)", marginTop:8 }}>Click the link below to verify your email and log in.</div>
            </div>
            <div style={{ padding:"28px 36px 36px" }}>
              <a href={verifyUrl} style={{ display:"block", textAlign:"center", height:54, lineHeight:"54px", borderRadius:99, background:ACCENT, color:"#0B1310", fontWeight:700, fontSize:16, textDecoration:"none" }}>
                Verify my email & continue
              </a>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.3)", marginTop:16, wordBreak:"break-all", lineHeight:1.6 }}>
                Or copy this link: <span style={{ color:"rgba(255,255,255,0.5)" }}>{verifyUrl}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      width: "100%",
      background: "radial-gradient(120% 70% at 18% -5%, rgba(21,48,39,0) 0%, #070D0B 60%), radial-gradient(90% 60% at 92% 8%, #11231D 0%, #070D0B 55%), #070D0B",
      fontFamily: "'Hanken Grotesk', system-ui, sans-serif",
      display: "grid",
      placeItems: "center",
      padding: "40px 20px",
      boxSizing: "border-box",
    }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)",
          zIndex: 100, display: "flex", alignItems: "center", gap: 10,
          padding: "13px 16px", borderRadius: 16, whiteSpace: "nowrap",
          background: toast.kind === "error" ? "rgba(232,137,124,0.16)" : "rgba(143,203,168,0.16)",
          border: `1px solid ${toast.kind === "error" ? "rgba(232,137,124,0.4)" : "rgba(143,203,168,0.4)"}`,
          boxShadow: "0 16px 30px -12px rgba(0,0,0,0.5)",
          animation: "cairnToast .28s ease",
        }}>
          <span style={{
            width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
            background: toast.kind === "error" ? "#E8897C" : "#8FCBA8",
            color: "#0B1310", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 700,
          }}>{toast.kind === "error" ? "!" : "✓"}</span>
          <span style={{ fontSize: 13, color: "#ECF1ED" }}>{toast.msg}</span>
        </div>
      )}

      {/* Card container */}
      <div style={{ width: "100%", maxWidth: 460 }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 32 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <div style={{ width: 22, height: 4, borderRadius: 99, background: ACCENT }} />
            <div style={{ width: 15, height: 4, borderRadius: 99, background: ACCENT, opacity: .7, margin: "0 auto" }} />
            <div style={{ width: 9,  height: 4, borderRadius: 99, background: ACCENT, opacity: .45, margin: "0 auto" }} />
          </div>
          <span style={{ fontSize: 18, fontWeight: 700, color: "#ECF1ED" }}>Cairn</span>
        </div>

        {/* Card */}
        <div style={{
          borderRadius: 28,
          overflow: "hidden",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.10)",
          boxShadow: "0 32px 64px -24px rgba(0,0,0,0.6)",
        }}>

          {/* Card header */}
          <div style={{
            paddingTop: 36, paddingRight: 36, paddingBottom: 32, paddingLeft: 36,
            background: "linear-gradient(165deg,#1f4438,rgba(22,48,39,0)), radial-gradient(120% 90% at 30% 10%, #2a5446, #0e1a15)",
            position: "relative",
            overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", top: -40, right: -30,
              width: 200, height: 200, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(227,189,158,0.35), transparent 65%)",
              filter: "blur(10px)", pointerEvents: "none",
            }} />
            <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 40, lineHeight: 1.1, color: "#fff", position: "relative" }}>
              {isRegister ? "Create your account." : "Welcome back."}
            </div>
            <div style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", marginTop: 10, position: "relative" }}>
              {isRegister ? "Start building a calmer money habit." : "Log in to continue."}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{
            paddingTop: 32,
            paddingRight: 36,
            paddingBottom: 36,
            paddingLeft: 36,
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}>
            {isRegister && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#9DB0A5", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 8 }}>
                  Username
                </div>
                <input
                  type="text" name="username"
                  value={formData.username} onChange={handleChange}
                  required style={inputStyle}
                />
              </div>
            )}

            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#9DB0A5", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 8 }}>
                Email
              </div>
              <input
                type="email" name="email"
                value={formData.email} onChange={handleChange}
                required style={inputStyle}
              />
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#9DB0A5", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 8 }}>
                Password
              </div>
              <input
                type="password" name="password"
                value={formData.password} onChange={handleChange}
                required style={inputStyle}
              />
              {isRegister && (
                <div style={{ fontSize: 11, color: "#6B7D73", marginTop: 6 }}>At least 8 characters, one uppercase letter and one number.</div>
              )}
              {!isRegister && (
                <div style={{ textAlign: "right", marginTop: 6 }}>
                  <span
                    onClick={() => navigate("/forgot-password")}
                    style={{ fontSize: 12, color: ACCENT, fontWeight: 500, cursor: "pointer" }}
                  >
                    Forgot password?
                  </span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                height: 56, width: "100%",
                border: "none", borderRadius: 99,
                background: ACCENT, color: "#0B1310",
                fontFamily: "inherit", fontSize: 16, fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                marginTop: 4,
                display: "block",
              }}
            >
              {loading ? "…" : isRegister ? "Create account" : "Log in"}
            </button>

            <div style={{ textAlign: "center", fontSize: 13, color: "#9DB0A5" }}>
              {isRegister ? "Already have an account?" : "New here?"}{" "}
              <span
                onClick={() => {
                  setMode(isRegister ? "login" : "register");
                  setFormData({ username: "", email: "", password: "" });
                }}
                style={{ color: ACCENT, fontWeight: 600, cursor: "pointer" }}
              >
                {isRegister ? "Log in" : "Create account"}
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
