export interface Database {
  public: {
    Tables: {
      agendamentos: {
        Row: {
          id: string;
          data_hora: string;
          cliente_nome: string;
          cliente_telefone: string;
          servico: string;
          status: 'pendente' | 'confirmado' | 'concluido' | 'cancelado';
          confirmado_whatsapp: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          data_hora: string;
          cliente_nome: string;
          cliente_telefone: string;
          servico: string;
          status?: 'pendente' | 'confirmado' | 'concluido' | 'cancelado';
          confirmado_whatsapp?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          data_hora?: string;
          cliente_nome?: string;
          cliente_telefone?: string;
          servico?: string;
          status?: 'pendente' | 'confirmado' | 'concluido' | 'cancelado';
          confirmado_whatsapp?: boolean;
          updated_at?: string;
        };
      };
      clientes: {
        Row: {
          id: string;
          nome: string;
          email: string;
          telefone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          email: string;
          telefone: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          email?: string;
          telefone?: string;
          updated_at?: string;
        };
      };
      vendas: {
        Row: {
          id: string;
          data_hora: string;
          valor_total: number;
          valor_servico: number;
          forma_pagamento: string | null;
          produtos_vendidos: any;
          cliente_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          data_hora: string;
          valor_total: number;
          valor_servico: number;
          forma_pagamento?: string | null;
          produtos_vendidos?: any;
          cliente_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          data_hora?: string;
          valor_total?: number;
          valor_servico?: number;
          forma_pagamento?: string | null;
          produtos_vendidos?: any;
          cliente_id?: string | null;
          updated_at?: string;
        };
      };
      produtos: {
        Row: {
          id: string;
          nome: string;
          marca: string | null;
          preco: number;
          estoque: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          marca?: string | null;
          preco: number;
          estoque?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          marca?: string | null;
          preco?: number;
          estoque?: number;
          updated_at?: string;
        };
      };
      lembretes: {
        Row: {
          id: string;
          agendamento_id: string;
          cliente_nome: string;
          mensagem: string;
          data_envio: string;
          status: 'pendente' | 'enviado';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          agendamento_id: string;
          cliente_nome: string;
          mensagem: string;
          data_envio: string;
          status?: 'pendente' | 'enviado';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          agendamento_id?: string;
          cliente_nome?: string;
          mensagem?: string;
          data_envio?: string;
          status?: 'pendente' | 'enviado';
          updated_at?: string;
        };
      };
      configuracoes: {
        Row: {
          id: string;
          nome_barbearia: string;
          horas_lembrete: number;
          mensagem_lembrete_template: string;
          lembretes_ativos: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nome_barbearia: string;
          horas_lembrete?: number;
          mensagem_lembrete_template: string;
          lembretes_ativos?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nome_barbearia?: string;
          horas_lembrete?: number;
          mensagem_lembrete_template?: string;
          lembretes_ativos?: boolean;
          updated_at?: string;
        };
      };
    };
  };
}
