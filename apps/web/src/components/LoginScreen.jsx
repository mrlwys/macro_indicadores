import { useState } from "react";

const COLORS = {
  bg: "#0B1120",
  card: "#111827",
  border: "#1E293B",
  text: "#E2E8F0",
  textMuted: "#94A3B8",
  white: "#FFFFFF",
  blue: "#3B82F6",
  cyan: "#06B6D4",
  red: "#EF4444",
};

export default function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await onLogin({ username, password });
    } catch (submitError) {
      setError("Credenciais inválidas. Verifique usuário e senha.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `radial-gradient(circle at 15% 20%, ${COLORS.blue}30 0%, transparent 30%), radial-gradient(circle at 85% 10%, ${COLORS.cyan}20 0%, transparent 25%), ${COLORS.bg}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
      `}</style>
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: 420,
          background: COLORS.card,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 14,
          padding: 24,
          boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: `linear-gradient(135deg, ${COLORS.blue}, ${COLORS.cyan})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: COLORS.white,
              fontWeight: 700,
            }}
          >
            GM
          </div>
          <div>
            <h1 style={{ margin: 0, color: COLORS.white, fontSize: 18 }}>GRUPO MUSSO</h1>
            <div style={{ color: COLORS.textMuted, fontSize: 11 }}>Acesso ao Dashboard Gerencial</div>
          </div>
        </div>

        <label style={{ display: "block", color: COLORS.textMuted, fontSize: 11, marginBottom: 6 }}>Usuário</label>
        <input
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          autoComplete="username"
          style={{
            width: "100%",
            padding: "11px 12px",
            borderRadius: 8,
            border: `1px solid ${COLORS.border}`,
            background: "#0F172A",
            color: COLORS.text,
            marginBottom: 12,
            outline: "none",
          }}
        />

        <label style={{ display: "block", color: COLORS.textMuted, fontSize: 11, marginBottom: 6 }}>Senha</label>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          style={{
            width: "100%",
            padding: "11px 12px",
            borderRadius: 8,
            border: `1px solid ${COLORS.border}`,
            background: "#0F172A",
            color: COLORS.text,
            marginBottom: 12,
            outline: "none",
          }}
        />

        {error ? (
          <div
            style={{
              background: `${COLORS.red}20`,
              border: `1px solid ${COLORS.red}40`,
              color: "#FCA5A5",
              borderRadius: 8,
              padding: "8px 10px",
              fontSize: 12,
              marginBottom: 12,
            }}
          >
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          style={{
            width: "100%",
            padding: "11px 14px",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: 700,
            fontSize: 13,
            color: COLORS.white,
            background: `linear-gradient(135deg, ${COLORS.blue}, ${COLORS.cyan})`,
            opacity: submitting ? 0.75 : 1,
          }}
        >
          {submitting ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
