export interface Agendamento {
  id: string;
  data_hora: string;
  cliente_nome: string;
  cliente_telefone: string;
  servico: string;
  status: 'pendente' | 'confirmado' | 'concluido' | 'cancelado';
  confirmado_whatsapp: boolean;
  created_at: string;
  updated_at: string;
}

export interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  created_at: string;
  updated_at: string;
}

export interface Venda {
  id: string;
  data_hora: string;
  valor_total: number;
  valor_servico: number;
  produtos_vendidos: ProdutoVendido[];
  cliente_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ProdutoVendido {
  nome: string;
  quantidade: number;
  subtotal: number;
  preco_unitario: number;
}

export interface Produto {
  id: string;
  nome: string;
  marca?: string;
  preco: number;
  estoque: number;
  created_at: string;
  updated_at: string;
}

export interface Lembrete {
  id: string;
  agendamento_id: string;
  cliente_nome: string;
  mensagem: string;
  data_envio: string;
  status: 'pendente' | 'enviado';
  created_at: string;
  updated_at: string;
}

export interface Configuracao {
  id: string;
  nome_barbearia: string;
  horas_lembrete: number;
  mensagem_lembrete_template: string;
  lembretes_ativos: boolean;
}
