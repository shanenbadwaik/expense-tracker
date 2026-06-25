import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import API from "../api";

const ACCENT = "#8FCBA8";

const inputStyle = {
  height: 52, borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.05)",
  color: "#ECF1ED",
  fontFamily: "'Hanken Grotesk', system-ui, sans-serif",
  fontSize: 15,
  paddingLeft: 16, paddingRight: 16,
  outline: "none", width: "100%",
  boxSizing: "border-box", display: "block",
};

export default function ForgotPassword() {
  const [email, setEmail]     = useState("");
  const [step, setStep]       = useState("form"); // "form" | "sent"
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const navigate              = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await axios.post(`${API}/forgot-password`, { email });
      setStep("sent");
    } catch (err) {
      const d = err.response?.data?.detail;
      setError(Array.isArray(d) ? d.map((x) => x.msg?.replace(/^Value error,\s*/i, "")).join(" · ") : (d || "Something went wrong. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(120% 70% at 18% -5%, rgba(21,48,39,0) 0%, #070D0B 60%), radial-gradient(90% 60% at 92% 8%, #11231D 0%, #070D0B 55%), #070D0B",
      fontFamily: "'Hanken Grotesk', system-ui, sans-serif",
      display: "grid", placeItems: "center",
      padding: "40px 20px", boxSizing: "border-box",
    }}>
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
          borderRadius: 28, overflow: "hidden",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.10)",
          boxShadow: "0 32px 64px -24px rgba(0,0,0,0.6)",
        }}>

          {/* Card header */}
          <div style={{
            paddingTop: 36, paddingRight: 36, paddingBottom: 32, paddingLeft: 36,
            background: "linear-gradient(165deg,#1f4438,rgba(22,48,39,0)), radial-gradient(120% 90% at 30% 10%, #2a5446, #0e1a15)",
            position: "relative", overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", top: -40, right: -30,
              width: 200, height: 200, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(227,189,158,0.35), transparent 65%)",
              filter: "blur(10px)", pointerEvents: "none",
            }} />
            <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 40, lineHeight: 1.1, color: "#fff", position: "relative" }}>
              {step === "sent" ? "Check your inbox." : "Forgot your password?"}
            </div>
            <div style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", marginTop: 10, position: "relative" }}>
              {step === "sent"
                ? `We sent a reset link to ${email}`
                : "Enter your email and we'll send a reset link."}
            </div>
          </div>

          {/* Body */}
          <div style={{ paddingTop: 32, paddingRight: 36, paddingBottom: 36, paddingLeft: 36 }}>

            {step === "sent" ? (
              /* ── Success state ── */
              <div>
                <div style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "16px", borderRadius: 16,
                  background: "rgba(143,203,168,0.10)",
                  border: "1px solid rgba(143,203,168,0.25)",
                  marginBottom: 24,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                    background: ACCENT, display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: 18,
                  }}>✓</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#ECF1ED", marginBottom: 2 }}>Check your inbox</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>
                      A reset link has been sent to your email. It expires in 15 minutes.
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => navigate("/")}
                  style={{
                    height: 52, width: "100%", border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 14, background: "rgba(255,255,255,0.05)",
                    color: "#ECF1ED", fontFamily: "inherit", fontSize: 15,
                    fontWeight: 600, cursor: "pointer",
                  }}
                >
                  Back to login
                </button>
                <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "#9DB0A5" }}>
                  Didn't receive it?{" "}
                  <span
                    onClick={() => { setStep("form"); setEmail(""); }}
                    style={{ color: ACCENT, fontWeight: 600, cursor: "pointer" }}
                  >
                    Try again
                  </span>
                </div>
              </div>
            ) : (
              /* ── Email form ── */
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#9DB0A5", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 8 }}>
                    Email address
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    style={{ ...inputStyle, color: email ? "#ECF1ED" : "rgba(255,255,255,0.3)" }}
                  />
                </div>

                {error && (
                  <div style={{
                    padding: "12px 14px", borderRadius: 12, fontSize: 13,
                    background: "rgba(232,137,124,0.12)",
                    border: "1px solid rgba(232,137,124,0.3)",
                    color: "#E8897C",
                  }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    height: 56, width: "100%", border: "none", borderRadius: 99,
                    background: ACCENT, color: "#0B1310",
                    fontFamily: "inherit", fontSize: 16, fontWeight: 700,
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.7 : 1, marginTop: 4,
                  }}
                >
                  {loading ? "Sending…" : "Send reset link"}
                </button>

                <div style={{ textAlign: "center", fontSize: 13, color: "#9DB0A5" }}>
                  Remember your password?{" "}
                  <span
                    onClick={() => navigate("/")}
                    style={{ color: ACCENT, fontWeight: 600, cursor: "pointer" }}
                  >
                    Log in
                  </span>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
