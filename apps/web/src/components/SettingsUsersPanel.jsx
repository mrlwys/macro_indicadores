import { useEffect, useMemo, useState } from "react";
import SettingsConfigPanel from "./SettingsConfigPanel.jsx";
const COLORS = {
  bg: "#0B1120",
  card: "#111827",
  border: "#1E293B",
  borderLight: "#334155",
  text: "#E2E8F0",
  textMuted: "#94A3B8",
  white: "#FFFFFF",
  blue: "#3B82F6",
  green: "#10B981",
  red: "#EF4444",
  yellow: "#F59E0B",
};

const EMPTY_FORM = {
  fullName: "",
  username: "",
  accessLevel: "user",
  isActive: true,
};

function parseErrorMessage(error, fallback) {
  if (!(error instanceof Error)) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(error.message);
    if (parsed?.message) {
      return parsed.message;
    }
  } catch {
    // Ignora falha de parse.
  }

  return error.message || fallback;
}

export default function SettingsUsersPanel({
  currentUser,
  onFetchUsers,
  onCreateUser,
  onUpdateUser,
  onDeleteUser,
  onFetchConfigEntries,
  onCreateConfigEntry,
  onUpdateConfigEntry,
  onDeleteConfigEntry,
  onConfigChanged,
}) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [modalMode, setModalMode] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const [deletingUser, setDeletingUser] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const isModalOpen = modalMode === "create" || modalMode === "edit";

  const modalTitle = useMemo(() => {
    if (modalMode === "create") return "Novo usuário";
    if (modalMode === "edit") return "Editar usuário";
    return "";
  }, [modalMode]);

  async function loadUsers() {
    setLoading(true);
    setError("");

    try {
      const list = await onFetchUsers();
      setUsers(Array.isArray(list) ? list : []);
    } catch (loadError) {
      setError(parseErrorMessage(loadError, "Não foi possível carregar os usuários."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  function openCreateModal() {
    setError("");
    setMessage("");
    setSelectedUser(null);
    setForm(EMPTY_FORM);
    setModalMode("create");
  }

  function openEditModal(user) {
    setError("");
    setMessage("");
    setSelectedUser(user);
    setForm({
      fullName: user.full_name || "",
      username: user.username || "",
      accessLevel: user.access_level || "user",
      isActive: Boolean(user.is_active),
    });
    setModalMode("edit");
  }

  function closeModal() {
    if (submitting) return;
    setModalMode(null);
    setSelectedUser(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!form.fullName.trim() || !form.username.trim()) {
      setError("Preencha os campos Nome e Usuário.");
      return;
    }

    setSubmitting(true);
    try {
      if (modalMode === "create") {
        const response = await onCreateUser({
          fullName: form.fullName.trim(),
          username: form.username.trim(),
          accessLevel: form.accessLevel,
          isActive: form.isActive,
        });
        setMessage(response?.message || "Usuário criado com sucesso.");
      } else if (modalMode === "edit" && selectedUser) {
        const response = await onUpdateUser(selectedUser.id, {
          fullName: form.fullName.trim(),
          username: form.username.trim(),
          accessLevel: form.accessLevel,
          isActive: form.isActive,
        });
        setMessage(response?.message || "Usuário atualizado com sucesso.");
      }

      closeModal();
      await loadUsers();
    } catch (submitError) {
      setError(parseErrorMessage(submitError, "Não foi possível salvar o usuário."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteConfirmed() {
    if (!deletingUser) return;

    setDeleting(true);
    setError("");
    setMessage("");

    try {
      const response = await onDeleteUser(deletingUser.id);
      setMessage(response?.message || "Usuário excluído com sucesso.");
      setDeletingUser(null);
      await loadUsers();
    } catch (deleteError) {
      setError(parseErrorMessage(deleteError, "Não foi possível excluir o usuário."));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div style={{ padding: "20px 24px", maxWidth: 1400, margin: "0 auto", fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
        <div>
          <h2 style={{ color: COLORS.white, margin: 0, fontSize: 18 }}>Configurações</h2>
          <div style={{ color: COLORS.textMuted, fontSize: 12 }}>Gestão de usuários e níveis de acesso</div>
        </div>

        <button
          onClick={openCreateModal}
          style={{
            border: "none",
            borderRadius: 8,
            padding: "10px 14px",
            fontSize: 12,
            fontWeight: 700,
            color: COLORS.white,
            background: `linear-gradient(135deg, ${COLORS.blue}, #06B6D4)`,
            cursor: "pointer",
          }}
        >
          Novo usuário
        </button>
      </div>

      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.white, marginBottom: 12 }}>Listagem de usuários</div>

        {error ? <div style={{ color: "#FCA5A5", fontSize: 12, marginBottom: 10 }}>{error}</div> : null}
        {message ? <div style={{ color: "#6EE7B7", fontSize: 12, marginBottom: 10 }}>{message}</div> : null}

        {loading ? (
          <div style={{ fontSize: 12, color: COLORS.textMuted }}>Carregando usuários...</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr>
                  {[
                    "Nome",
                    "Usuário",
                    "Acesso",
                    "Status",
                    "Criado em",
                    "Ações",
                  ].map((header) => (
                    <th
                      key={header}
                      style={{
                        textAlign: "left",
                        color: COLORS.textMuted,
                        fontSize: 10,
                        textTransform: "uppercase",
                        padding: "7px 8px",
                        borderBottom: `1px solid ${COLORS.border}`,
                      }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr key={user.id} style={{ background: index % 2 ? `${COLORS.border}20` : "transparent" }}>
                    <td style={{ padding: "8px", color: COLORS.white }}>{user.full_name}</td>
                    <td style={{ padding: "8px", color: COLORS.textMuted }}>{user.username}</td>
                    <td style={{ padding: "8px", color: user.access_level === "admin" ? COLORS.blue : COLORS.textMuted, fontWeight: 600 }}>
                      {user.access_level === "admin" ? "Administrador" : "Usuário"}
                    </td>
                    <td style={{ padding: "8px", color: user.is_active ? COLORS.green : COLORS.yellow }}>
                      {user.is_active ? "Ativo" : "Inativo"}
                    </td>
                    <td style={{ padding: "8px", color: COLORS.textMuted }}>{new Date(user.created_at).toLocaleDateString("pt-BR")}</td>
                    <td style={{ padding: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <button
                          onClick={() => openEditModal(user)}
                          style={{
                            border: `1px solid ${COLORS.borderLight}`,
                            borderRadius: 6,
                            background: "transparent",
                            color: COLORS.text,
                            cursor: "pointer",
                            fontSize: 11,
                            padding: "5px 8px",
                          }}
                        >
                          Editar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div style={{ marginTop: 18 }}>
        <SettingsConfigPanel
          onFetchConfigEntries={onFetchConfigEntries}
          onCreateConfigEntry={onCreateConfigEntry}
          onUpdateConfigEntry={onUpdateConfigEntry}
          onDeleteConfigEntry={onDeleteConfigEntry}
          onConfigChanged={onConfigChanged}
        />
      </div>

      {isModalOpen ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(2, 8, 23, 0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 60,
            padding: 16,
          }}
          onClick={closeModal}
        >
          <form
            onSubmit={handleSubmit}
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 420,
              background: COLORS.card,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 12,
              padding: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.white }}>{modalTitle}</div>
              <button
                type="button"
                onClick={closeModal}
                style={{ border: "none", background: "transparent", color: COLORS.textMuted, cursor: "pointer", fontSize: 16 }}
              >
                ×
              </button>
            </div>

            <label style={{ display: "block", color: COLORS.textMuted, fontSize: 11, marginBottom: 6 }}>Nome</label>
            <input
              value={form.fullName}
              onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
              style={{
                width: "100%",
                borderRadius: 8,
                border: `1px solid ${COLORS.borderLight}`,
                background: "#0F172A",
                color: COLORS.text,
                padding: "10px 12px",
                marginBottom: 10,
                outline: "none",
              }}
            />

            <label style={{ display: "block", color: COLORS.textMuted, fontSize: 11, marginBottom: 6 }}>Usuário</label>
            <input
              value={form.username}
              onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
              style={{
                width: "100%",
                borderRadius: 8,
                border: `1px solid ${COLORS.borderLight}`,
                background: "#0F172A",
                color: COLORS.text,
                padding: "10px 12px",
                marginBottom: 10,
                outline: "none",
              }}
            />

            <label style={{ display: "block", color: COLORS.textMuted, fontSize: 11, marginBottom: 6 }}>Nível de acesso</label>
            <select
              value={form.accessLevel}
              onChange={(event) => setForm((prev) => ({ ...prev, accessLevel: event.target.value }))}
              style={{
                width: "100%",
                borderRadius: 8,
                border: `1px solid ${COLORS.borderLight}`,
                background: "#0F172A",
                color: COLORS.text,
                padding: "10px 12px",
                marginBottom: 10,
                outline: "none",
              }}
            >
              <option value="user">Usuário</option>
              <option value="admin">Administrador</option>
            </select>

            <label style={{ display: "block", color: COLORS.textMuted, fontSize: 11, marginBottom: 6 }}>Status</label>
            <select
              value={form.isActive ? "ativo" : "inativo"}
              onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.value === "ativo" }))}
              style={{
                width: "100%",
                borderRadius: 8,
                border: `1px solid ${COLORS.borderLight}`,
                background: "#0F172A",
                color: COLORS.text,
                padding: "10px 12px",
                marginBottom: 14,
                outline: "none",
              }}
            >
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>

            <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 12 }}>
              Na criação, a senha inicial será igual ao nome de usuário.
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <div>
                {modalMode === "edit" && selectedUser ? (
                  <button
                    type="button"
                    onClick={() => {
                      setDeletingUser(selectedUser);
                      closeModal();
                    }}
                    disabled={currentUser?.id === selectedUser.id}
                    title={currentUser?.id === selectedUser.id ? "Não é possível excluir o próprio usuário." : "Excluir usuário"}
                    style={{
                      border: `1px solid ${COLORS.red}50`,
                      borderRadius: 8,
                      background: `${COLORS.red}10`,
                      color: "#FCA5A5",
                      padding: "8px 12px",
                      fontSize: 12,
                      cursor: currentUser?.id === selectedUser.id ? "not-allowed" : "pointer",
                      opacity: currentUser?.id === selectedUser.id ? 0.45 : 1,
                    }}
                  >
                    Excluir usuário
                  </button>
                ) : null}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={closeModal}
                  style={{
                    border: `1px solid ${COLORS.borderLight}`,
                    borderRadius: 8,
                    background: "transparent",
                    color: COLORS.text,
                    padding: "8px 12px",
                    cursor: "pointer",
                    fontSize: 12,
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    border: "none",
                    borderRadius: 8,
                    padding: "8px 12px",
                    fontSize: 12,
                    fontWeight: 700,
                    color: COLORS.white,
                    background: `linear-gradient(135deg, ${COLORS.blue}, #06B6D4)`,
                    cursor: "pointer",
                    opacity: submitting ? 0.75 : 1,
                  }}
                >
                  {submitting ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : null}

      {deletingUser ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(2, 8, 23, 0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 70,
            padding: 16,
          }}
          onClick={() => {
            if (!deleting) setDeletingUser(null);
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 420,
              background: COLORS.card,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 12,
              padding: 16,
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.white, marginBottom: 8 }}>Confirmar exclusão</div>
            <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 14 }}>
              Deseja realmente excluir o usuário <strong style={{ color: COLORS.white }}>{deletingUser.username}</strong>? Esta ação não poderá ser desfeita.
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                disabled={deleting}
                style={{
                  border: `1px solid ${COLORS.borderLight}`,
                  borderRadius: 8,
                  background: "transparent",
                  color: COLORS.text,
                  padding: "8px 12px",
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirmed}
                disabled={deleting}
                style={{
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontSize: 12,
                  fontWeight: 700,
                  color: COLORS.white,
                  background: COLORS.red,
                  cursor: "pointer",
                  opacity: deleting ? 0.75 : 1,
                }}
              >
                {deleting ? "Excluindo..." : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}



