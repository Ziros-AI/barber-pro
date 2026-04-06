export type TemplateMensagemTipo = 'confirmacao' | 'lembrete' | 'reagendamento' | 'nao_comparecimento' | 'pos_atendimento';

export interface TemplateMensagem {
  id: string;
  nome: string;
  tipo: TemplateMensagemTipo;
  mensagem: string;
  ativo: boolean;
  padrao: boolean;
}

export const TEMPLATE_TIPO_LABELS: Record<TemplateMensagemTipo, string> = {
  confirmacao: 'Confirmação',
  lembrete: 'Lembrete',
  reagendamento: 'Reagendamento',
  nao_comparecimento: 'Não comparecimento',
  pos_atendimento: 'Pós-atendimento'
};

const buildDefaultTemplate = (
  id: string,
  nome: string,
  tipo: TemplateMensagemTipo,
  mensagem: string
): TemplateMensagem => ({
  id,
  nome,
  tipo,
  mensagem,
  ativo: true,
  padrao: true
});

export const DEFAULT_TEMPLATE_MESSAGES: TemplateMensagem[] = [
  buildDefaultTemplate(
    'confirmacao-padrao',
    'Confirmação padrão',
    'confirmacao',
    'Fala {nome}! Confirmado seu {servico} às {hora}. Te esperamos na {barbearia}!'
  ),
  buildDefaultTemplate(
    'lembrete-padrao',
    'Lembrete padrão',
    'lembrete',
    'Olá {nome}, lembrete do seu {servico} amanhã às {hora}. Te esperamos! - {barbearia}'
  ),
  buildDefaultTemplate(
    'reagendamento-padrao',
    'Reagendamento padrão',
    'reagendamento',
    'Olá {nome}, precisamos reagendar seu {servico}. Fale com a {barbearia} para escolher um novo horário.'
  ),
  buildDefaultTemplate(
    'nao-comparecimento-padrao',
    'Não comparecimento padrão',
    'nao_comparecimento',
    'Olá {nome}, sentimos sua ausência no horário das {hora}. Se quiser, podemos remarcar seu {servico} na {barbearia}.'
  ),
  buildDefaultTemplate(
    'pos-atendimento-padrao',
    'Pós-atendimento padrão',
    'pos_atendimento',
    'Valeu pela visita, {nome}! Obrigado por escolher a {barbearia}. Quando quiser agendar outro {servico}, estamos por aqui.'
  )
];

const TEMPLATE_TIPOS = DEFAULT_TEMPLATE_MESSAGES.map((item) => item.tipo);

const isTemplateTipo = (value: unknown): value is TemplateMensagemTipo =>
  typeof value === 'string' && TEMPLATE_TIPOS.includes(value as TemplateMensagemTipo);

const getDefaultTemplatesByTipo = (): Record<TemplateMensagemTipo, TemplateMensagem> =>
  DEFAULT_TEMPLATE_MESSAGES.reduce((acc, template) => {
    acc[template.tipo] = { ...template };
    return acc;
  }, {} as Record<TemplateMensagemTipo, TemplateMensagem>);

export const createTemplateMensagem = (tipo: TemplateMensagemTipo, index: number): TemplateMensagem => ({
  id: `${tipo}-${Date.now()}-${index}`,
  nome: `${TEMPLATE_TIPO_LABELS[tipo]} ${index}`,
  tipo,
  mensagem: getDefaultTemplatesByTipo()[tipo].mensagem,
  ativo: true,
  padrao: false
});

export const normalizeTemplatesMensagem = (
  rawTemplates: unknown,
  legacyTemplate?: string | null
): TemplateMensagem[] => {
  const defaultsByTipo = getDefaultTemplatesByTipo();
  const templates = Array.isArray(rawTemplates)
    ? rawTemplates
        .map((item, index) => {
          if (!item || typeof item !== 'object') {
            return null;
          }

          const candidate = item as Partial<TemplateMensagem>;

          if (!isTemplateTipo(candidate.tipo)) {
            return null;
          }

          return {
            id: typeof candidate.id === 'string' && candidate.id.trim() ? candidate.id : `${candidate.tipo}-${index + 1}`,
            nome:
              typeof candidate.nome === 'string' && candidate.nome.trim()
                ? candidate.nome.trim()
                : `${TEMPLATE_TIPO_LABELS[candidate.tipo]} ${index + 1}`,
            tipo: candidate.tipo,
            mensagem:
              typeof candidate.mensagem === 'string' && candidate.mensagem.trim()
                ? candidate.mensagem
                : defaultsByTipo[candidate.tipo].mensagem,
            ativo: candidate.ativo !== false,
            padrao: candidate.padrao === true
          } satisfies TemplateMensagem;
        })
        .filter((item): item is TemplateMensagem => Boolean(item))
    : [];

  const normalizedByTipo = (Object.keys(defaultsByTipo) as TemplateMensagemTipo[]).flatMap((tipo) => {
    const templatesTipo = templates.filter((item) => item.tipo === tipo);

    if (templatesTipo.length === 0) {
      const fallbackMensagem =
        legacyTemplate && (tipo === 'confirmacao' || tipo === 'lembrete') ? legacyTemplate : defaultsByTipo[tipo].mensagem;

      return [
        {
          ...defaultsByTipo[tipo],
          mensagem: fallbackMensagem
        }
      ];
    }

    const existeTemplateAtivo = templatesTipo.some((item) => item.ativo);
    const templatesComAtivo = existeTemplateAtivo
      ? templatesTipo
      : templatesTipo.map((item, index) => ({
          ...item,
          ativo: index === 0
        }));
    const existePadraoAtivo = templatesComAtivo.some((item) => item.ativo && item.padrao);
    const primeiroTemplateAtivoId = templatesComAtivo.find((item) => item.ativo)?.id;

    return templatesComAtivo.map((item, index) => ({
      ...item,
      padrao: existePadraoAtivo ? item.ativo && item.padrao : item.ativo && item.id === primeiroTemplateAtivoId
    }));
  });

  return normalizedByTipo;
};

export const getTemplatePadraoPorTipo = (
  templates: TemplateMensagem[],
  tipo: TemplateMensagemTipo,
  fallbackTemplate?: string
): string => {
  const templatesTipo = templates.filter((item) => item.tipo === tipo && item.ativo);
  const templatePadrao = templatesTipo.find((item) => item.padrao) || templatesTipo[0];

  if (templatePadrao?.mensagem?.trim()) {
    return templatePadrao.mensagem;
  }

  if (fallbackTemplate?.trim()) {
    return fallbackTemplate;
  }

  return getDefaultTemplatesByTipo()[tipo].mensagem;
};

export const ensureTemplatePadraoUnico = (
  templates: TemplateMensagem[],
  tipo: TemplateMensagemTipo,
  templateId: string
): TemplateMensagem[] =>
  templates.map((item) => {
    if (item.tipo !== tipo) {
      return item;
    }

    return {
      ...item,
      padrao: item.id === templateId
    };
  });
