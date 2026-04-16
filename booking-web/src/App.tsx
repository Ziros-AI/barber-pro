import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { DateTime } from "luxon";
import { bookAppointment, fetchBootstrap, fetchSlots, type BootstrapResponse, type Servico } from "./api";

const TZ =
  import.meta.env.VITE_BOOKING_TIMEZONE?.trim() || "America/Sao_Paulo";

function todayYmd(zone: string) {
  return DateTime.now().setZone(zone).toISODate()!;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

export default function App() {
  const [bootstrap, setBootstrap] = useState<BootstrapResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const [dateYmd, setDateYmd] = useState(() => todayYmd(TZ));
  const [hora, setHora] = useState<string | null>(null);
  const [servicoId, setServicoId] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const effectiveTz = bootstrap?.time_zone || TZ;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const b = await fetchBootstrap();
        if (!cancelled) {
          setBootstrap(b);
          setLoadError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : "Falha ao carregar");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadSlots = useCallback(
    async (d: string) => {
      setSlotsLoading(true);
      setSlotsError(null);
      setHora(null);
      try {
        const r = await fetchSlots(d);
        setSlots(r.slots);
        if (r.slots.length === 0) {
          setSlotsError("Não há horários disponíveis nesta data.");
        }
      } catch (e) {
        setSlots([]);
        setSlotsError(e instanceof Error ? e.message : "Erro ao carregar horários");
      } finally {
        setSlotsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!bootstrap) return;
    loadSlots(dateYmd);
  }, [bootstrap, dateYmd, loadSlots]);

  const servicos: Servico[] = bootstrap?.servicos ?? [];
  const servicoSel = useMemo(
    () => servicos.find((s) => s.id === servicoId),
    [servicos, servicoId],
  );

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setFormError(null);
    setSuccess(null);

    if (!nome.trim() || !telefone.trim() || !servicoId || !hora) {
      setFormError("Preencha nome, telefone, serviço e horário.");
      return;
    }

    const digits = telefone.replace(/\D/g, "");
    if (digits.length !== 11) {
      setFormError("Telefone: informe DDD + número (11 dígitos).");
      return;
    }

    const [y, m, d] = dateYmd.split("-").map(Number);
    const [hh, mm] = hora.split(":").map(Number);
    const dt = DateTime.fromObject(
      { year: y, month: m, day: d, hour: hh, minute: mm, second: 0, millisecond: 0 },
      { zone: effectiveTz },
    );
    if (!dt.isValid) {
      setFormError("Data ou horário inválido.");
      return;
    }

    setSubmitting(true);
    try {
      const iso = dt.toISO();
      if (!iso) throw new Error("Não foi possível montar data/hora");
      await bookAppointment({
        cliente_nome: nome.trim(),
        cliente_telefone: telefone,
        servico_id: servicoId,
        data_hora: iso,
        email: email.trim() || undefined,
      });
      setSuccess("Agendamento solicitado! Você receberá confirmação pela barbearia.");
      setHora(null);
      setServicoId("");
      setNome("");
      setTelefone("");
      setEmail("");
      loadSlots(dateYmd);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Não foi possível agendar");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadError) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.h1}>Agendamento</h1>
          <p style={styles.err}>{loadError}</p>
          <p style={styles.muted}>
            Confira se a função <code style={styles.code}>public-booking</code> está publicada no
            Supabase e se o <code style={styles.code}>.env</code> aponta para o projeto certo.
          </p>
        </div>
      </div>
    );
  }

  if (!bootstrap) {
    return (
      <div style={styles.page}>
        <p style={styles.muted}>Carregando…</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.h1}>{bootstrap.nome_barbearia}</h1>
        <p style={styles.sub}>Agende seu horário online</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            Data
            <input
              type="date"
              value={dateYmd}
              min={todayYmd(effectiveTz)}
              onChange={(e) => setDateYmd(e.target.value)}
              style={styles.input}
            />
          </label>

          <div style={styles.label}>
            Horário
            {slotsLoading && <span style={styles.muted}> (carregando…)</span>}
            {!slotsLoading && slots.length > 0 && (
              <div style={styles.slotGrid}>
                {slots.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setHora(s)}
                    style={{
                      ...styles.slotBtn,
                      ...(hora === s ? styles.slotBtnActive : {}),
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            {slotsError && <p style={styles.warn}>{slotsError}</p>}
          </div>

          <label style={styles.label}>
            Serviço
            <select
              value={servicoId}
              onChange={(e) => setServicoId(e.target.value)}
              style={styles.input}
            >
              <option value="">Selecione</option>
              {servicos.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome} — {formatCurrency(s.preco)} ({s.duracao} min)
                </option>
              ))}
            </select>
          </label>

          {servicoSel && (
            <p style={styles.muted}>
              Duração na agenda: pelo menos {Math.max(servicoSel.duracao, bootstrap.agenda.slotDurationMinutes)}{" "}
              min (intervalos de {bootstrap.agenda.slotDurationMinutes} min).
            </p>
          )}

          <label style={styles.label}>
            Seu nome
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              style={styles.input}
              autoComplete="name"
            />
          </label>

          <label style={styles.label}>
            WhatsApp / celular
            <input
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="11999999999"
              style={styles.input}
              autoComplete="tel"
            />
          </label>

          <label style={styles.label}>
            E-mail <span style={styles.muted}>(opcional)</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              autoComplete="email"
            />
          </label>

          {formError && <p style={styles.err}>{formError}</p>}
          {success && <p style={styles.ok}>{success}</p>}

          <button type="submit" disabled={submitting || !hora} style={styles.submit}>
            {submitting ? "Enviando…" : "Confirmar agendamento"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: "2rem 1rem",
    background: "linear-gradient(165deg, #1a1814 0%, #0f0e0c 50%)",
  },
  card: {
    maxWidth: 440,
    margin: "0 auto",
    padding: "1.75rem",
    borderRadius: 16,
    background: "#1c1b18",
    border: "1px solid #2e2c27",
    boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
  },
  h1: {
    margin: "0 0 0.25rem",
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#f5f1ea",
  },
  sub: {
    margin: "0 0 1.5rem",
    color: "#9a958c",
    fontSize: "0.95rem",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "#c4bfb6",
  },
  input: {
    padding: "0.65rem 0.75rem",
    borderRadius: 10,
    border: "1px solid #3d3a34",
    background: "#121110",
    color: "#f5f1ea",
    fontSize: "1rem",
  },
  slotGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  slotBtn: {
    padding: "0.45rem 0.75rem",
    borderRadius: 8,
    border: "1px solid #3d3a34",
    background: "#121110",
    color: "#e8e4dc",
    cursor: "pointer",
    fontSize: "0.9rem",
  },
  slotBtnActive: {
    borderColor: "#c9a962",
    background: "#2a2619",
    color: "#f5e6c0",
  },
  submit: {
    marginTop: 8,
    padding: "0.85rem",
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(135deg, #c9a962, #a68542)",
    color: "#1a150c",
    fontWeight: 700,
    fontSize: "1rem",
    cursor: "pointer",
  },
  err: { color: "#f08080", margin: 0, fontSize: "0.9rem" },
  warn: { color: "#e6c86e", margin: "0.25rem 0 0", fontSize: "0.85rem" },
  ok: { color: "#8fd4a6", margin: 0, fontSize: "0.9rem" },
  muted: { color: "#7a756c", fontSize: "0.85rem", fontWeight: 400 },
  code: {
    fontSize: "0.8em",
    background: "#2a2824",
    padding: "2px 6px",
    borderRadius: 4,
  },
};
