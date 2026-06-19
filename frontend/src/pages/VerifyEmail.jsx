import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";

const ACCENT = "#8FCBA8";

export default function VerifyEmail() {
  const [params]      = useSearchParams();
  const navigate      = useNavigate();
  const token         = params.get("token") || "";
  const [status, setStatus] = useState("loading"); // "loading" | "success" | "error"
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token found.");
      return;
    }
    axios
      .get(`http://127.0.0.1:8000/verify-email?token=${encodeURIComponent(token)}`)
      .then(() => setStatus("success"))
      .catch((err) => {
        setStatus("error");
        setMessage(err.response?.data?.detail || "Verification failed. The link may have expired.");
      });
  }, [token]);

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
              {status === "loading" && "Verifying…"}
              {status === "success" && "You're verified."}
              {status === "error"   && "Link problem."}
            </div>
            <div style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", marginTop: 10, position: "relative" }}>
              {status === "loading" && "Checking your link…"}
              {status === "success" && "Your email address is confirmed."}
              {status === "error"   && "We couldn't verify this link."}
            </div>
          </div>

          <div style={{ paddingTop: 32, paddingRight: 36, paddingBottom: 36, paddingLeft: 36 }}>

            {status === "loading" && (
              <div style={{ display: "flex", justifyContent: "center", padding: "20px 0" }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  border: `3px solid rgba(143,203,168,0.2)`,
                  borderTopColor: ACCENT,
                  animation: "spin 0.8s linear infinite",
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            )}

            {status === "success" && (
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
                  <div style={{ fontSize: 14, color: "#ECF1ED", lineHeight: 1.5 }}>
                    Your account is now verified. You can track your expenses and access all features.
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
                  Go to login
                </button>
              </div>
            )}

            {status === "error" && (
              <div>
                <div style={{
                  padding: "14px 16px", borderRadius: 14, marginBottom: 24, fontSize: 14,
                  background: "rgba(232,137,124,0.10)",
                  border: "1px solid rgba(232,137,124,0.25)",
                  color: "#E8897C", lineHeight: 1.6,
                }}>
                  {message}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <button
                    onClick={() => navigate("/")}
                    style={{
                      height: 52, width: "100%", border: "none", borderRadius: 99,
                      background: ACCENT, color: "#0B1310",
                      fontFamily: "inherit", fontSize: 15, fontWeight: 700, cursor: "pointer",
                    }}
                  >
                    Go to login
                  </button>
                  <button
                    onClick={() => navigate("/forgot-password")}
                    style={{
                      height: 52, width: "100%", cursor: "pointer",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 99, background: "transparent",
                      color: "#9DB0A5", fontFamily: "inherit", fontSize: 15, fontWeight: 500,
                    }}
                  >
                    Request new link
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
