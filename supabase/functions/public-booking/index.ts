import { createClient } from "npm:@supabase/supabase-js@2.49.1";
import { DateTime } from "npm:luxon@3.4.4";
import {
  DEFAULT_AGENDA_CONFIG,
  encontrarConflitoDeHorario,
  getDuracaoEfetivaMinutos,
  getHorarioAgendamentoMensagem,
  getIntervaloAgendamentoUtc,
  getTimeSlotsForDate,
  isDateTimeWithinAgenda,
  mensagemConflitoHorario,
  normalizeAgendaConfig,
  rangeUtcDiaCivil,
  type AgendaConfig,
  type AgendamentoConflitoRow,
} from "./agendaLogic.ts";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, "");
  return cleaned.length === 11;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const ownerId = Deno.env.get("BOOKING_OWNER_USER_ID");
  const timeZone = Deno.env.get("BOOKING_TIMEZONE") || "America/Sao_Paulo";

  if (!supabaseUrl || !serviceKey) {
    return jsonResponse({ error: "Server misconfiguration" }, 500);
  }

  if (!ownerId) {
    return jsonResponse(
      {
        error:
          "BOOKING_OWNER_USER_ID não configurado. Defina o secret no projeto Supabase (UUID do usuário auth da barbearia).",
      },
      500,
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "JSON inválido" }, 400);
  }

  const action = body.action as string;
  if (!action) {
    return jsonResponse({ error: "Campo action obrigatório" }, 400);
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: configRows, error: configError } = await supabase
    .from("configuracoes")
    .select("nome_barbearia, agenda_intervalo_minutos, agenda_semana")
    .eq("user_id", ownerId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (configError) {
    console.error(configError);
    return jsonResponse({ error: "Não foi possível carregar configurações" }, 500);
  }

  const firstConfig = configRows?.[0] as Record<string, unknown> | undefined;
  const agendaConfig: AgendaConfig = normalizeAgendaConfig({
    slotDurationMinutes: firstConfig?.agenda_intervalo_minutos as number | undefined,
    weekSchedule: firstConfig?.agenda_semana as AgendaConfig["weekSchedule"] | undefined,
  });

  const nomeBarbearia =
    (typeof firstConfig?.nome_barbearia === "string" && firstConfig.nome_barbearia.trim()) ||
    "Barbearia";

  if (action === "bootstrap") {
    const { data: servicos, error: servicosError } = await supabase
      .from("servicos")
      .select("id, nome, preco, duracao")
      .or(`user_id.eq.${ownerId},user_id.is.null`)
      .order("nome", { ascending: true });

    if (servicosError) {
      console.error(servicosError);
      return jsonResponse({ error: "Não foi possível carregar serviços" }, 500);
    }

    return jsonResponse({
      nome_barbearia: nomeBarbearia,
      time_zone: timeZone,
      agenda: {
        slotDurationMinutes: agendaConfig.slotDurationMinutes,
        weekSchedule: agendaConfig.weekSchedule,
      },
      servicos: servicos || [],
    });
  }

  if (action === "slots") {
    const dateStr = body.date as string;
    if (!dateStr || typeof dateStr !== "string") {
      return jsonResponse({ error: "Campo date obrigatório (yyyy-MM-dd)" }, 400);
    }

    const day = DateTime.fromISO(dateStr, { zone: timeZone });
    if (!day.isValid) {
      return jsonResponse({ error: "Data inválida" }, 400);
    }

    const slots = getTimeSlotsForDate(agendaConfig, day.startOf("day"));
    return jsonResponse({ slots, date: dateStr });
  }

  if (action === "book") {
    const cliente_nome = typeof body.cliente_nome === "string" ? body.cliente_nome.trim() : "";
    const cliente_telefone_raw = typeof body.cliente_telefone === "string" ? body.cliente_telefone : "";
    const cliente_telefone = cliente_telefone_raw.replace(/\D/g, "");
    const servico_id = typeof body.servico_id === "string" ? body.servico_id : "";
    const data_hora = typeof body.data_hora === "string" ? body.data_hora : "";
    const email =
      typeof body.email === "string" && body.email.trim()
        ? body.email.trim().toLowerCase()
        : null;

    if (!cliente_nome || !cliente_telefone || !servico_id || !data_hora) {
      return jsonResponse(
        { error: "Preencha nome, telefone (11 dígitos com DDD), serviço e data/hora." },
        400,
      );
    }

    if (!isValidPhone(cliente_telefone_raw)) {
      return jsonResponse({ error: "Telefone inválido. Use DDD + 9 dígitos (11 números)." }, 400);
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonResponse({ error: "E-mail inválido" }, 400);
    }

    const dtUtc = DateTime.fromISO(data_hora, { setZone: true });
    if (!dtUtc.isValid) {
      return jsonResponse({ error: "data_hora inválida (use ISO 8601)" }, 400);
    }

    const localBarber = dtUtc.setZone(timeZone);
    if (!isDateTimeWithinAgenda(agendaConfig, localBarber)) {
      return jsonResponse(
        { error: getHorarioAgendamentoMensagem(agendaConfig, localBarber) },
        400,
      );
    }

    const { data: servicoRow, error: servicoErr } = await supabase
      .from("servicos")
      .select("id, nome, duracao, user_id")
      .eq("id", servico_id)
      .maybeSingle();

    if (servicoErr || !servicoRow) {
      return jsonResponse({ error: "Serviço não encontrado" }, 400);
    }

    if (servicoRow.user_id != null && servicoRow.user_id !== ownerId) {
      return jsonResponse({ error: "Serviço não disponível" }, 400);
    }

    const slotMinutes = agendaConfig.slotDurationMinutes;
    const duracaoServico =
      servicoRow.duracao != null ? Number(servicoRow.duracao) : undefined;
    const duracaoMinutos = getDuracaoEfetivaMinutos(duracaoServico, slotMinutes);
    const { start: inicio, end: fim } = getIntervaloAgendamentoUtc(data_hora, duracaoMinutos);

    const { startUtc, endUtc } = rangeUtcDiaCivil(localBarber, timeZone);

    const { data: existentesRaw, error: agErr } = await supabase
      .from("agendamentos")
      .select("id, data_hora, servico_id, status, cliente_nome, servicos(duracao)")
      .gte("data_hora", startUtc!)
      .lte("data_hora", endUtc!);

    if (agErr) {
      console.error(agErr);
      return jsonResponse({ error: "Não foi possível verificar disponibilidade" }, 500);
    }

    const existentes = (existentesRaw || []) as AgendamentoConflitoRow[];
    const conflito = encontrarConflitoDeHorario({
      inicio,
      fim,
      existentes,
      slotDurationMinutes: slotMinutes,
    });

    if (conflito) {
      return jsonResponse({ error: mensagemConflitoHorario(conflito) }, 409);
    }

    let cliente_id: string | null = null;
    const { data: clienteExistente } = await supabase
      .from("clientes")
      .select("id")
      .eq("telefone", cliente_telefone)
      .maybeSingle();

    if (clienteExistente?.id) {
      cliente_id = clienteExistente.id;
      await supabase
        .from("clientes")
        .update({ nome: cliente_nome, ...(email ? { email } : {}) })
        .eq("id", cliente_id);
    } else {
      const novoClientePayload: Record<string, unknown> = {
        nome: cliente_nome,
        telefone: cliente_telefone,
        frequencia_dias: 30,
      };
      if (email) novoClientePayload.email = email;

      const { data: novoCliente, error: insClienteErr } = await supabase
        .from("clientes")
        .insert(novoClientePayload)
        .select("id")
        .single();

      if (insClienteErr) {
        console.error(insClienteErr);
        const det = [insClienteErr.message, insClienteErr.hint].filter(Boolean).join(" ");
        return jsonResponse(
          {
            error: det
              ? `Não foi possível salvar o cadastro do cliente: ${det}`
              : "Não foi possível salvar o cadastro do cliente",
          },
          500,
        );
      }
      cliente_id = (novoCliente as { id: string }).id;
    }

    const tryInsert = (payload: Record<string, unknown>) =>
      supabase.from("agendamentos").insert(payload).select("*").single();

    const errFullText = (err: { message?: string; hint?: string; details?: string } | null) =>
      [err?.message, err?.hint, err?.details].filter(Boolean).join(" ");

    const schemaCacheMissingColumn = (
      err: { message?: string; hint?: string; details?: string } | null,
      col: string,
    ) => {
      const t = errFullText(err);
      return Boolean(
        err && new RegExp(col, "i").test(t) && /could not find|schema cache|does not exist|column/i.test(t),
      );
    };

    // Bases: com ou sem cliente_id (RELACIONAMENTOS_BANCO.sql adiciona cliente_id; bancos antigos não têm).
    const insertCore: Record<string, unknown> = {
      cliente_nome,
      cliente_telefone,
      servico_id,
      data_hora,
      status: "pendente",
      confirmado_whatsapp: false,
    };

    const tryServicoVariants = async (base: Record<string, unknown>) => {
      let payload: Record<string, unknown> = { ...base, servico: servicoRow.nome };
      let result = await tryInsert(payload);
      let t = errFullText(result.error);
      if (
        result.error &&
        /servico/i.test(t) &&
        (/could not find|does not exist|schema cache|column/i.test(t) || /PGRST/i.test(t))
      ) {
        payload = { ...base };
        result = await tryInsert(payload);
      }
      return result;
    };

    let insertBase: Record<string, unknown> = { ...insertCore };
    if (cliente_id) insertBase.cliente_id = cliente_id;

    let { data: agendamento, error: insAgErr } = await tryServicoVariants(insertBase);

    if (insAgErr && schemaCacheMissingColumn(insAgErr, "cliente_id")) {
      const { cliente_id: _drop, ...withoutCliente } = insertBase;
      insertBase = { ...withoutCliente };
      ({ data: agendamento, error: insAgErr } = await tryServicoVariants(insertBase));
    }

    if (insAgErr) {
      console.error(insAgErr);
      const det = [insAgErr.message, insAgErr.hint, (insAgErr as { details?: string }).details]
        .filter(Boolean)
        .join(" ");
      return jsonResponse(
        {
          error: det
            ? `Não foi possível criar o agendamento: ${det}`
            : "Não foi possível criar o agendamento",
        },
        500,
      );
    }

    return jsonResponse({
      ok: true,
      agendamento,
      servico_nome: servicoRow.nome,
      nome_barbearia: nomeBarbearia,
    });
  }

  return jsonResponse({ error: `Ação desconhecida: ${action}` }, 400);
});
