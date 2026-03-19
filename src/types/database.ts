export interface Database {
  public: {
    Tables: {
      agendamentos: {
        Row: {
          id: string;
          data_hora: string;
          cliente_nome: string;
          cliente_telefone: string | null;
          cliente_id: string | null;
          servico: string;
          status: 'pendente' | 'confirmado' | 'concluido';
          confirmado_whatsapp: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          data_hora: string;
          cliente_nome: string;
          cliente_telefone?: string | null;
          cliente_id?: string | null;
          servico: string;
          status?: 'pendente' | 'confirmado' | 'concluido';
          confirmado_whatsapp?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          data_hora?: string;
          cliente_nome?: string;
          cliente_telefone?: string | null;
          cliente_id?: string | null;
          servico?: string;
          status?: 'pendente' | 'confirmado' | 'concluido';
          confirmado_whatsapp?: boolean;
        };
      };
      clientes: {
        Row: {
          id: string;
          nome: string;
          email: string | null;
          telefone: string | null;
          frequencia_dias: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          email?: string | null;
          telefone?: string | null;
          frequencia_dias?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          email?: string | null;
          telefone?: string | null;
          frequencia_dias?: number;
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
        };
        Insert: {
          id?: string;
          data_hora?: string;
          valor_total: number;
          valor_servico: number;
          forma_pagamento?: string | null;
          produtos_vendidos?: any;
          cliente_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          data_hora?: string;
          valor_total?: number;
          valor_servico?: number;
          forma_pagamento?: string | null;
          produtos_vendidos?: any;
          cliente_id?: string | null;
        };
      };
      venda_itens: {
        Row: {
          id: string;
          venda_id: string;
          produto_id: string;
          quantidade: number;
          preco_unitario: number;
          subtotal: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          venda_id: string;
          produto_id: string;
          quantidade: number;
          preco_unitario: number;
          subtotal: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          venda_id?: string;
          produto_id?: string;
          quantidade?: number;
          preco_unitario?: number;
          subtotal?: number;
          created_at?: string;
        };
      };
      produtos: {
        Row: {
          id: string;
          nome: string;
          marca: string;
          preco: number;
          estoque: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          marca: string;
          preco: number;
          estoque?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          marca?: string;
          preco?: number;
          estoque?: number;
        };
      };
      lembretes: {
        Row: {
          id: string;
          cliente_id: string | null;
          agendamento_id: string | null;
          cliente_nome: string;
          mensagem: string;
          data_envio: string;
          status: 'pendente' | 'enviado';
          servico: string | null;
          cliente_telefone: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          cliente_id?: string | null;
          agendamento_id?: string | null;
          cliente_nome: string;
          mensagem: string;
          data_envio: string;
          status?: 'pendente' | 'enviado';
          servico?: string | null;
          cliente_telefone?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          cliente_id?: string | null;
          agendamento_id?: string | null;
          cliente_nome?: string;
          mensagem?: string;
          data_envio?: string;
          status?: 'pendente' | 'enviado';
          servico?: string | null;
          cliente_telefone?: string | null;
        };
      };
      configuracoes: {
        Row: {
          id: string;
          nome_barbearia: string;
          mensagem_lembrete_template: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          nome_barbearia: string;
          mensagem_lembrete_template: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          nome_barbearia?: string;
          mensagem_lembrete_template?: string;
        };
      };
    };
    Functions: {
      finalizar_venda_completa: {
        Args: {
          p_agendamento_id: string;
          p_cliente_id: string | null;
          p_valor_servico: number;
          p_valor_total: number;
          p_forma_pagamento: string;
          p_produtos?: any;
        };
        Returns: string;
      };
    };
  };
}
