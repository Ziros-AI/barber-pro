export { default as ConfiguracoesScreen } from './screens/ConfiguracoesScreen';

export interface Configuracao {
  id?: string;
  nome_barbearia: string;
  mensagem_lembrete_template: string;
  horas_lembrete: number;
  lembretes_ativos: boolean;
}