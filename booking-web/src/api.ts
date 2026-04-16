export type Servico = { id: string; nome: string; preco: number; duracao: number };

export type BootstrapResponse = {
  nome_barbearia: string;
  time_zone: string;
  agenda: {
    slotDurationMinutes: number;
    weekSchedule: unknown;
  };
  servicos: Servico[];
};

export type SlotsResponse = { slots: string[]; date: string };

function getPublicBookingUrl(): string {
  const base = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, "") ?? "";
  if (import.meta.env.DEV) {
    return "/functions/v1/public-booking";
  }
  return `${base}/functions/v1/public-booking`;
}

async function callBooking<T>(body: Record<string, unknown>): Promise<T> {
  const baseConfigured = Boolean(import.meta.env.VITE_SUPABASE_URL?.trim());
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!baseConfigured || !anon) {
    throw new Error("Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env");
  }

  const url = getPublicBookingUrl();

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${anon}`,
        apikey: anon,
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    const isDev = import.meta.env.DEV;
    const extra = isDev
      ? " Em desenvolvimento a URL passa pelo proxy do Vite; pare e rode de novo npm run dev. Se persistir, faça deploy da função public-booking no Supabase."
      : " Confirme deploy da função public-booking, URL do projeto e desative bloqueadores para este site.";
    const msg = e instanceof Error ? e.message : "Falha de rede";
    throw new Error(`${msg}.${extra}`);
  }

  let data: { error?: string } & T;
  try {
    data = (await res.json()) as { error?: string } & T;
  } catch {
    throw new Error(
      res.ok
        ? "Resposta inválida do servidor."
        : `HTTP ${res.status}. A função public-booking existe neste projeto? Deploy: supabase functions deploy public-booking`,
    );
  }

  if (!res.ok) {
    throw new Error(data.error || `Erro ${res.status}`);
  }
  return data as T;
}

export function fetchBootstrap() {
  return callBooking<BootstrapResponse>({ action: "bootstrap" });
}

export function fetchSlots(dateYmd: string) {
  return callBooking<SlotsResponse>({ action: "slots", date: dateYmd });
}

export function bookAppointment(payload: {
  cliente_nome: string;
  cliente_telefone: string;
  servico_id: string;
  data_hora: string;
  email?: string;
}) {
  return callBooking<{
    ok: boolean;
    agendamento: { id: string; data_hora: string; status: string };
    servico_nome: string;
    nome_barbearia: string;
  }>({ action: "book", ...payload });
}
