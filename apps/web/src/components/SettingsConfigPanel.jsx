import { useEffect, useMemo, useState } from "react";

const COLORS = {
  card: "#111827",
  border: "#1E293B",
  borderLight: "#334155",
  text: "#E2E8F0",
  textMuted: "#94A3B8",
  white: "#FFFFFF",
  blue: "#3B82F6",
  red: "#EF4444",
};

const EMPTY_FORM = {
  configKey: "financeiro.meta_anual",
  referenceDate: new Date().toISOString().slice(0, 10),
  valueNumber: "",
  valueBoolean: "true",
  valueText: "",
  notes: "",
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

function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR");
}

function formatReferenceDate(value) {
  if (!value) return "—";
  return new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR");
}

function formatConfigValue(entry, definition) {
  if (!definition) {
    return entry.value_text || entry.value_number || "—";
  }

  if (definition.input_type === "currency") {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(entry.value_number || 0));
  }

  if (definition.value_type === "number") {
    return Number(entry.value_number || 0).toLocaleString("pt-BR");
  }

  if (definition.value_type === "boolean") {
    return entry.value_boolean ? "Sim" : "Não";
  }

  return entry.value_text || "—";
}

export default function SettingsConfigPanel({
  onFetchConfigEntries,
  onCreateConfigEntry,
  onUpdateConfigEntry,
  onDeleteConfigEntry,
  onConfigChanged,
}) {
  const [definitions, setDefinitions] = useState([]);
  const [entries, setEntries] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [modalMode, setModalMode] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deletingEntry, setDeletingEntry] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const definitionsByKey = useMemo(() => new Map(definitions.map((item) => [item.key, item])), [definitions]);
  const selectedDefinition = definitionsByKey.get(form.configKey) || null;

  async function loadConfigEntries() {
    setLoading(true);
    setError("");

    try {
      const result = await onFetchConfigEntries();
      setDefinitions(Array.isArray(result?.definitions) ? result.definitions : []);
      setEntries(Array.isArray(result?.entries) ? result.entries : []);
      setHistory(Array.isArray(result?.history) ? result.history : []);
    } catch (loadError) {
      setError(parseErrorMessage(loadError, "Não foi possível carregar os dados de configuração."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadConfigEntries();
  }, []);

  function resetForm(nextKey) {
    const definition = definitionsByKey.get(nextKey) || definitions[0] || null;
    setForm({
      configKey: definition?.key || nextKey || EMPTY_FORM.configKey,
      referenceDate: new Date().toISOString().slice(0, 10),
      valueNumber: "",
      valueBoolean: "true",
      valueText: "",
      notes: "",
    });
  }

  function openCreateModal() {
    setError("");
    setMessage("");
    setSelectedEntry(null);
    resetForm(definitions[0]?.key || EMPTY_FORM.configKey);
    setModalMode("create");
  }

  function openEditModal(entry) {
    setError("");
    setMessage("");
    setSelectedEntry(entry);
    setForm({
      configKey: entry.config_key,
      referenceDate: entry.reference_date,
      valueNumber: entry.value_number === null || entry.value_number === undefined ? "" : String(entry.value_number),
      valueBoolean: entry.value_boolean ? "true" : "false",
      valueText: entry.value_text || "",
      notes: entry.notes || "",
    });
    setModalMode("edit");
  }

  function closeModal() {
    if (submitting) return;
    setModalMode(null);
    setSelectedEntry(null);
    resetForm(EMPTY_FORM.configKey);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!selectedDefinition) {
      setError("Selecione um campo válido.");
      return;
    }

    const payload = {
      configKey: form.configKey,
      referenceDate: form.referenceDate,
      valueType: selectedDefinition.value_type,
      valueNumber: selectedDefinition.value_type === "number" ? Number(form.valueNumber) : null,
      valueBoolean: selectedDefinition.value_type === "boolean" ? form.valueBoolean === "true" : null,
      valueText: selectedDefinition.value_type === "text" ? form.valueText.trim() : null,
      notes: form.notes.trim() || null,
    };

    if (selectedDefinition.value_type === "number" && !Number.isFinite(payload.valueNumber)) {
      setError("Informe um valor numérico válido.");
      return;
    }

    if (selectedDefinition.value_type === "text" && !payload.valueText) {
      setError("Informe um texto para este campo.");
      return;
    }

    setSubmitting(true);
    try {
      const response =
        modalMode === "edit" && selectedEntry
          ? await onUpdateConfigEntry(selectedEntry.id, payload)
          : await onCreateConfigEntry(payload);
      setMessage(response?.message || "Dado de configuração salvo com sucesso.");
      closeModal();
      await loadConfigEntries();
      await onConfigChanged?.();
    } catch (submitError) {
      setError(parseErrorMessage(submitError, "Não foi possível salvar o dado de configuração."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteConfirmed() {
    if (!deletingEntry) return;

    setDeleting(true);
    setError("");
    setMessage("");

    try {
      const response = await onDeleteConfigEntry(deletingEntry.id);
      setMessage(response?.message || "Dado de configuração excluído com sucesso.");
      setDeletingEntry(null);
      await loadConfigEntries();
      await onConfigChanged?.();
    } catch (deleteError) {
      setError(parseErrorMessage(deleteError, "Não foi possível excluir o dado de configuração."));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.white }}>Inserção de Dados</div>
          <div style={{ fontSize: 11, color: COLORS.textMuted }}>Dados manuais auditáveis que alimentam o dashboard.</div>
        </div>
        <button onClick={openCreateModal} style={{ border: "none", borderRadius: 8, padding: "10px 14px", fontSize: 12, fontWeight: 700, color: COLORS.white, background: `linear-gradient(135deg, ${COLORS.blue}, #06B6D4)`, cursor: "pointer" }}>Novo dado</button>
      </div>

      {error ? <div style={{ color: "#FCA5A5", fontSize: 12, marginBottom: 10 }}>{error}</div> : null}
      {message ? <div style={{ color: "#6EE7B7", fontSize: 12, marginBottom: 10 }}>{message}</div> : null}

      {loading ? (
        <div style={{ fontSize: 12, color: COLORS.textMuted }}>Carregando dados de configuração...</div>
      ) : (
        <>
          <div style={{ fontSize: 12, color: COLORS.white, marginBottom: 8 }}>Registros atuais</div>
          <div style={{ overflowX: "auto", marginBottom: 18 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr>
                  {["Campo", "Setor", "Referência", "Valor", "Observações", "Atualizado em", "Ações"].map((header) => (
                    <th key={header} style={{ textAlign: "left", color: COLORS.textMuted, fontSize: 10, textTransform: "uppercase", padding: "7px 8px", borderBottom: `1px solid ${COLORS.border}` }}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: "10px 8px", color: COLORS.textMuted }}>Nenhum dado manual cadastrado até o momento.</td></tr>
                ) : entries.map((entry, index) => {
                  const definition = definitionsByKey.get(entry.config_key);
                  return (
                    <tr key={entry.id} style={{ background: index % 2 ? `${COLORS.border}20` : "transparent" }}>
                      <td style={{ padding: "8px", color: COLORS.white }}>{definition?.label || entry.config_key}</td>
                      <td style={{ padding: "8px", color: COLORS.textMuted }}>{definition?.section || "—"}</td>
                      <td style={{ padding: "8px", color: COLORS.textMuted }}>{formatReferenceDate(entry.reference_date)}</td>
                      <td style={{ padding: "8px", color: COLORS.white, fontWeight: 600 }}>{formatConfigValue(entry, definition)}</td>
                      <td style={{ padding: "8px", color: COLORS.textMuted }}>{entry.notes || "—"}</td>
                      <td style={{ padding: "8px", color: COLORS.textMuted }}>{formatDateTime(entry.updated_at)}</td>
                      <td style={{ padding: "8px" }}><button onClick={() => openEditModal(entry)} style={{ border: `1px solid ${COLORS.borderLight}`, borderRadius: 6, background: "transparent", color: COLORS.text, cursor: "pointer", fontSize: 11, padding: "5px 8px" }}>Editar</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ fontSize: 12, color: COLORS.white, marginBottom: 8 }}>Histórico de auditoria</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr>
                  {["Data", "Ação", "Campo", "Referência", "Valor", "Observações"].map((header) => (
                    <th key={header} style={{ textAlign: "left", color: COLORS.textMuted, fontSize: 10, textTransform: "uppercase", padding: "7px 8px", borderBottom: `1px solid ${COLORS.border}` }}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: "10px 8px", color: COLORS.textMuted }}>Ainda não há histórico de alterações.</td></tr>
                ) : history.map((item, index) => {
                  const definition = definitionsByKey.get(item.snapshot.config_key);
                  const actionLabel = item.action === "created" ? "Criação" : item.action === "updated" ? "Edição" : "Exclusão";
                  return (
                    <tr key={item.id} style={{ background: index % 2 ? `${COLORS.border}20` : "transparent" }}>
                      <td style={{ padding: "8px", color: COLORS.textMuted }}>{formatDateTime(item.acted_at)}</td>
                      <td style={{ padding: "8px", color: COLORS.white }}>{actionLabel}</td>
                      <td style={{ padding: "8px", color: COLORS.white }}>{definition?.label || item.snapshot.config_key}</td>
                      <td style={{ padding: "8px", color: COLORS.textMuted }}>{formatReferenceDate(item.snapshot.reference_date)}</td>
                      <td style={{ padding: "8px", color: COLORS.textMuted }}>{formatConfigValue(item.snapshot, definition)}</td>
                      <td style={{ padding: "8px", color: COLORS.textMuted }}>{item.snapshot.notes || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {modalMode ? (
        <div style={{ position: "fixed", inset: 0, background: "rgba(2, 8, 23, 0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: 16 }} onClick={closeModal}>
          <form onSubmit={handleSubmit} onClick={(event) => event.stopPropagation()} style={{ width: "100%", maxWidth: 480, background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.white }}>{modalMode === "edit" ? "Editar dado" : "Novo dado"}</div>
              <button type="button" onClick={closeModal} style={{ border: "none", background: "transparent", color: COLORS.textMuted, cursor: "pointer", fontSize: 16 }}>×</button>
            </div>

            <label style={{ display: "block", color: COLORS.textMuted, fontSize: 11, marginBottom: 6 }}>Campo</label>
            <select value={form.configKey} onChange={(event) => resetForm(event.target.value)} disabled={modalMode === "edit"} style={{ width: "100%", borderRadius: 8, border: `1px solid ${COLORS.borderLight}`, background: "#0F172A", color: COLORS.text, padding: "10px 12px", marginBottom: 10, outline: "none" }}>
              {definitions.map((definition) => <option key={definition.key} value={definition.key}>{definition.label}</option>)}
            </select>
            <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 10 }}>{selectedDefinition?.description || "Selecione o campo manual."}</div>

            <label style={{ display: "block", color: COLORS.textMuted, fontSize: 11, marginBottom: 6 }}>Data de referência</label>
            <input type="date" value={form.referenceDate} onChange={(event) => setForm((prev) => ({ ...prev, referenceDate: event.target.value }))} style={{ width: "100%", borderRadius: 8, border: `1px solid ${COLORS.borderLight}`, background: "#0F172A", color: COLORS.text, padding: "10px 12px", marginBottom: 10, outline: "none" }} />

            {selectedDefinition?.value_type === "number" ? <><label style={{ display: "block", color: COLORS.textMuted, fontSize: 11, marginBottom: 6 }}>Valor</label><input type="number" step="0.01" value={form.valueNumber} onChange={(event) => setForm((prev) => ({ ...prev, valueNumber: event.target.value }))} style={{ width: "100%", borderRadius: 8, border: `1px solid ${COLORS.borderLight}`, background: "#0F172A", color: COLORS.text, padding: "10px 12px", marginBottom: 10, outline: "none" }} /></> : null}
            {selectedDefinition?.value_type === "boolean" ? <><label style={{ display: "block", color: COLORS.textMuted, fontSize: 11, marginBottom: 6 }}>Valor</label><select value={form.valueBoolean} onChange={(event) => setForm((prev) => ({ ...prev, valueBoolean: event.target.value }))} style={{ width: "100%", borderRadius: 8, border: `1px solid ${COLORS.borderLight}`, background: "#0F172A", color: COLORS.text, padding: "10px 12px", marginBottom: 10, outline: "none" }}><option value="true">Sim</option><option value="false">Não</option></select></> : null}
            {selectedDefinition?.value_type === "text" ? <><label style={{ display: "block", color: COLORS.textMuted, fontSize: 11, marginBottom: 6 }}>Valor</label><textarea value={form.valueText} onChange={(event) => setForm((prev) => ({ ...prev, valueText: event.target.value }))} rows={4} style={{ width: "100%", borderRadius: 8, border: `1px solid ${COLORS.borderLight}`, background: "#0F172A", color: COLORS.text, padding: "10px 12px", marginBottom: 10, outline: "none", resize: "vertical" }} /></> : null}

            <label style={{ display: "block", color: COLORS.textMuted, fontSize: 11, marginBottom: 6 }}>Observações</label>
            <textarea value={form.notes} onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))} rows={3} style={{ width: "100%", borderRadius: 8, border: `1px solid ${COLORS.borderLight}`, background: "#0F172A", color: COLORS.text, padding: "10px 12px", marginBottom: 14, outline: "none", resize: "vertical" }} />

            <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 12 }}>O dashboard considera o valor mais recente compatível com a referência do snapshot, e o histórico permanece auditável.</div>

            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <div>{modalMode === "edit" && selectedEntry ? <button type="button" onClick={() => { setDeletingEntry(selectedEntry); closeModal(); }} style={{ border: `1px solid ${COLORS.red}50`, borderRadius: 8, background: `${COLORS.red}10`, color: "#FCA5A5", padding: "8px 12px", fontSize: 12, cursor: "pointer" }}>Excluir dado</button> : null}</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" onClick={closeModal} style={{ border: `1px solid ${COLORS.borderLight}`, borderRadius: 8, background: "transparent", color: COLORS.text, padding: "8px 12px", cursor: "pointer", fontSize: 12 }}>Cancelar</button>
                <button type="submit" disabled={submitting} style={{ border: "none", borderRadius: 8, padding: "8px 12px", fontSize: 12, fontWeight: 700, color: COLORS.white, background: `linear-gradient(135deg, ${COLORS.blue}, #06B6D4)`, cursor: "pointer", opacity: submitting ? 0.75 : 1 }}>{submitting ? "Salvando..." : "Salvar"}</button>
              </div>
            </div>
          </form>
        </div>
      ) : null}

      {deletingEntry ? (
        <div style={{ position: "fixed", inset: 0, background: "rgba(2, 8, 23, 0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 70, padding: 16 }} onClick={() => { if (!deleting) setDeletingEntry(null); }}>
          <div onClick={(event) => event.stopPropagation()} style={{ width: "100%", maxWidth: 420, background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.white, marginBottom: 8 }}>Confirmar exclusão</div>
            <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 14 }}>Deseja realmente excluir este dado de configuração? O histórico de auditoria será preservado.</div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button type="button" onClick={() => setDeletingEntry(null)} disabled={deleting} style={{ border: `1px solid ${COLORS.borderLight}`, borderRadius: 8, background: "transparent", color: COLORS.text, padding: "8px 12px", cursor: "pointer", fontSize: 12 }}>Cancelar</button>
              <button type="button" onClick={handleDeleteConfirmed} disabled={deleting} style={{ border: "none", borderRadius: 8, padding: "8px 12px", fontSize: 12, fontWeight: 700, color: COLORS.white, background: COLORS.red, cursor: "pointer", opacity: deleting ? 0.75 : 1 }}>{deleting ? "Excluindo..." : "Excluir"}</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
