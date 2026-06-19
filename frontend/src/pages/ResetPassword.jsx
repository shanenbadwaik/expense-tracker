import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";

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

export default function ResetPassword() {
  const [params]          = useSearchParams();
  const navigate          = useNavigate();
  const token             = params.get("token") || "";

  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [step, setStep]           = useState("form"); // "form" | "success"
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  useEffect(() => {
    if (!token) setError("No reset token found. Please request a new link.");
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      await axios.post("http://127.0.0.1:8000/reset-password", {
        token,
        new_password: password,
      });
      setStep("success");
    } catch (err) {
      setError(err.response?.data?.detail || "Reset failed. The link may have expired.");
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
              position: "absolute", top: -40, right: -30, width: 200, height: 200, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(227,189,158,0.35), transparent 65%)",
              filter: "blur(10px)", pointerEvents: "none",
            }} />
            <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 40, lineHeight: 1.1, color: "#fff", position: "relative" }}>
              {step === "success" ? "All done." : "Choose a new password."}
            </div>
            <div style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", marginTop: 10, position: "relative" }}>
              {step === "success" ? "Your password has been updated." : "Make it something you'll remember."}
            </div>
          </div>

          {/* Body */}
          <div style={{ paddingTop: 32, paddingRight: 36, paddingBottom: 36, paddingLeft: 36 }}>

            {step === "success" ? (
              <div>
                <div style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "16px",
                  borderRadius: 16, marginBottom: 24,
                  background: "rgba(143,203,168,0.10)",
                  border: "1px solid rgba(143,203,168,0.25)",
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                    background: ACCENT, display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: 18,
                  }}>✓</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#ECF1ED" }}>
                    Password updated successfully
                  </div>
                </div>
                <button
                  onClick={() => navigate("/")}
                  style={{
                    height: 56, width: "100%", border: "none", borderRadius: 99,
                    background: ACCENT, color: "#0B1310",
                    fontFamily: "inherit", fontSize: 16, fontWeight: 700, cursor: "pointer",
                  }}
                >
                  Log in
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>

                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#9DB0A5", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 8 }}>
                    New password
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={inputStyle}
                  />
                  <div style={{ fontSize: 11, color: "#6B7D73", marginTop: 6 }}>
                    At least 8 characters, one uppercase letter and one number.
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#9DB0A5", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 8 }}>
                    Confirm password
                  </div>
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    style={{
                      ...inputStyle,
                      borderColor: confirm && confirm !== password
                        ? "rgba(232,137,124,0.5)"
                        : "rgba(255,255,255,0.12)",
                    }}
                  />
                </div>

                {error && (
                  <div style={{
                    padding: "12px 14px", borderRadius: 12, fontSize: 13,
                    background: "rgba(232,137,124,0.12)",
                    border: "1px solid rgba(232,137,124,0.3)",
                    color: "#E8897C",
                  }}>
                    {error}{" "}
                    {error.toLowerCase().includes("expired") && (
                      <span
                        onClick={() => navigate("/forgot-password")}
                        style={{ textDecoration: "underline", cursor: "pointer" }}
                      >
                        Request a new one.
                      </span>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !token}
                  style={{
                    height: 56, width: "100%", border: "none", borderRadius: 99,
                    background: ACCENT, color: "#0B1310",
                    fontFamily: "inherit", fontSize: 16, fontWeight: 700,
                    cursor: (loading || !token) ? "not-allowed" : "pointer",
                    opacity: (loading || !token) ? 0.7 : 1, marginTop: 4,
                  }}
                >
                  {loading ? "Updating…" : "Update password"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
