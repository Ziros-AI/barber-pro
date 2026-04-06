import { DEFAULT_TEMPLATE_MESSAGES, type TemplateMensagem, type TemplateMensagemTipo } from '../../lib/messageTemplates';

export interface ConfiguracaoForm {
  id?: string;
  nome_barbearia: string;
  horas_lembrete: number;
  mensagem_lembrete_template: string;
  mensagens_templates: TemplateMensagem[];
  lembretes_ativos: boolean;
}

export const DEFAULT_CONFIG: ConfiguracaoForm = {
  nome_barbearia: 'Barbearia',
  horas_lembrete: 24,
  mensagem_lembrete_template: 'Olá {nome}, lembrete do seu {servico} amanhã às {hora}. Te esperamos! - {barbearia}',
  mensagens_templates: DEFAULT_TEMPLATE_MESSAGES,
  lembretes_ativos: true
};

export const TEMPLATE_TIPOS: TemplateMensagemTipo[] = ['confirmacao', 'lembrete', 'reagendamento', 'nao_comparecimento', 'pos_atendimento'];
