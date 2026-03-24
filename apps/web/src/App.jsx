import { useEffect, useState } from "react";
import DashboardGrupoMusso from "./components/DashboardGrupoMusso.jsx";
import LoginScreen from "./components/LoginScreen.jsx";
import SettingsUsersPanel from "./components/SettingsUsersPanel.jsx";
import {
  clearStoredToken,
  createConfigEntry,
  createUser,
  deleteConfigEntry,
  deleteUser,
  fetchConfigEntries,
  fetchLatestDashboard,
  fetchMe,
  fetchUsers,
  getStoredToken,
  login,
  setStoredToken,
  updateConfigEntry,
  updateUser,
} from "./lib/api.js";

const SHELL_COLORS = {
  bg: "#0B1120",
  card: "#111827",
  border: "#1E293B",
  text: "#E2E8F0",
  textMuted: "#94A3B8",
  blue: "#3B82F6",
  cyan: "#06B6D4",
};

export default function App() {
  const [dashboardData, setDashboardData] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [activeScreen, setActiveScreen] = useState("dashboard");

  const isAdmin = currentUser?.accessLevel === "admin";

  async function loadDashboard() {
    try {
      const snapshot = await fetchLatestDashboard();
      setDashboardData(snapshot?.payload ?? null);
      return true;
    } catch {
      setDashboardData(null);
      return false;
    }
  }

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      const token = getStoredToken();
      if (!token) {
        if (active) {
          setLoadingSession(false);
        }
        return;
      }

      try {
        const me = await fetchMe();
        if (!active) return;

        setCurrentUser(me.user ?? null);
        await loadDashboard();
      } catch {
        clearStoredToken();
        if (active) {
          setCurrentUser(null);
        }
      } finally {
        if (active) {
          setLoadingSession(false);
        }
      }
    }

    bootstrap();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isAdmin && activeScreen === "configuracoes") {
      setActiveScreen("dashboard");
    }
  }, [activeScreen, isAdmin]);

  async function handleLogin(credentials) {
    const result = await login(credentials);
    setStoredToken(result.token);
    setCurrentUser(result.user);
    setActiveScreen("dashboard");
    await loadDashboard();
  }

  function handleLogout() {
    clearStoredToken();
    setCurrentUser(null);
    setDashboardData(null);
  }

  if (loadingSession) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: SHELL_COLORS.bg,
          color: SHELL_COLORS.text,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
        }}
      >
        Carregando sessão...
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div style={{ minHeight: "100vh", background: SHELL_COLORS.bg, fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
      `}</style>

      <div
        style={{
          background: `linear-gradient(135deg, ${SHELL_COLORS.card} 0%, #0F172A 100%)`,
          borderBottom: `1px solid ${SHELL_COLORS.border}`,
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: `linear-gradient(135deg, ${SHELL_COLORS.blue}, ${SHELL_COLORS.cyan})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 13,
              color: "#fff",
            }}
          >
            GM
          </div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: SHELL_COLORS.text, letterSpacing: -0.3, margin: 0 }}>GRUPO MUSSO</h1>
            <div style={{ fontSize: 12, color: SHELL_COLORS.textMuted }}>Dashboard Gerencial • {dashboardData?.periodo || ""}</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {isAdmin ? (
            <button
              onClick={() => setActiveScreen((prev) => (prev === "configuracoes" ? "dashboard" : "configuracoes"))}
              title="Configurações"
              style={{
                border: `1px solid ${activeScreen === "configuracoes" ? `${SHELL_COLORS.blue}80` : SHELL_COLORS.border}`,
                background: activeScreen === "configuracoes" ? `${SHELL_COLORS.blue}20` : "transparent",
                color: SHELL_COLORS.text,
                borderRadius: 8,
                height: 36,
                fontSize: 12,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "0 10px",
                fontWeight: 600,
              }}
            >
              <span style={{ fontSize: 15, lineHeight: 1 }}>⚙</span>
              <span>Configurações</span>
            </button>
          ) : null}

          <div style={{ fontSize: 11, color: SHELL_COLORS.textMuted, textAlign: "right" }}>
            <div style={{ color: SHELL_COLORS.text }}>{currentUser.username}</div>
            <div>{currentUser.accessLevel === "admin" ? "Administrador" : "Usuário"}</div>
          </div>

          <button
            onClick={handleLogout}
            style={{
              border: `1px solid ${SHELL_COLORS.border}`,
              background: "transparent",
              color: SHELL_COLORS.text,
              borderRadius: 8,
              padding: "8px 11px",
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            Sair
          </button>
        </div>
      </div>

      {activeScreen === "configuracoes" ? (
        <SettingsUsersPanel
          currentUser={currentUser}
          onFetchUsers={async () => {
            const result = await fetchUsers();
            return result.users ?? [];
          }}
          onFetchConfigEntries={async () => fetchConfigEntries()}
          onCreateUser={async (payload) => createUser(payload)}
          onUpdateUser={async (userId, payload) => updateUser(userId, payload)}
          onDeleteUser={async (userId) => deleteUser(userId)}
          onCreateConfigEntry={async (payload) => createConfigEntry(payload)}
          onUpdateConfigEntry={async (entryId, payload) => updateConfigEntry(entryId, payload)}
          onDeleteConfigEntry={async (entryId) => deleteConfigEntry(entryId)}
          onConfigChanged={loadDashboard}
        />
      ) : (
        <DashboardGrupoMusso data={dashboardData} showHeader={false} />
      )}
    </div>
  );
}
