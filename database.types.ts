export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      clientes: {
        Row: {
          id: string
          nome: string | null
          telefone: string | null
          email: string | null
          tax_id: string | null
          status: string | null
          criado_em: string
          tenant_id: string | null
        }
        Insert: {
          id?: string
          nome?: string | null
          telefone?: string | null
          email?: string | null
          tax_id?: string | null
          status?: string | null
          criado_em?: string
          tenant_id?: string | null
        }
        Update: {
          id?: string
          nome?: string | null
          telefone?: string | null
          email?: string | null
          tax_id?: string | null
          status?: string | null
          criado_em?: string
          tenant_id?: string | null
        }
      }
      agendamentos: {
        Row: {
          id: string
          cliente_id: string | null
          especialista_id: string | null
          data_hora: string | null
          status: string | null
          criado_em: string
          tenant_id: string | null
        }
        Insert: {
          id?: string
          cliente_id?: string | null
          especialista_id?: string | null
          data_hora?: string | null
          status?: string | null
          criado_em?: string
          tenant_id?: string | null
        }
        Update: {
          id?: string
          cliente_id?: string | null
          especialista_id?: string | null
          data_hora?: string | null
          status?: string | null
          criado_em?: string
          tenant_id?: string | null
        }
      }
      atendimentos: {
        Row: {
          id: string
          cliente_id: string | null
          canal: string | null
          responsavel: string | null
          status: string | null
          criado_em: string
          tenant_id: string | null
        }
        Insert: {
          id?: string
          cliente_id?: string | null
          canal?: string | null
          responsavel?: string | null
          status?: string | null
          criado_em?: string
          tenant_id?: string | null
        }
        Update: {
          id?: string
          cliente_id?: string | null
          canal?: string | null
          responsavel?: string | null
          status?: string | null
          criado_em?: string
          tenant_id?: string | null
        }
      }
      especialistas: {
        Row: {
          id: string
          nome: string | null
          especialidade: string | null
          ativo: boolean | null
          criado_em: string
          tenant_id: string | null
        }
        Insert: {
          id?: string
          nome?: string | null
          especialidade?: string | null
          ativo?: boolean | null
          criado_em?: string
          tenant_id?: string | null
        }
        Update: {
          id?: string
          nome?: string | null
          especialidade?: string | null
          ativo?: boolean | null
          criado_em?: string
          tenant_id?: string | null
        }
      }
      mensagens: {
        Row: {
          id: string
          cliente_id: string | null
          texto: string | null
          direcao: string | null
          metadata: Json | null
          criado_em: string
          tenant_id: string | null
        }
        Insert: {
          id?: string
          cliente_id?: string | null
          texto?: string | null
          direcao?: string | null
          metadata?: Json | null
          criado_em?: string
          tenant_id?: string | null
        }
        Update: {
          id?: string
          cliente_id?: string | null
          texto?: string | null
          direcao?: string | null
          metadata?: Json | null
          criado_em?: string
          tenant_id?: string | null
        }
      }
      servicos: {
        Row: {
          id: string
          nome: string | null
          descricao: string | null
          categoria: string | null
          duracao_minutos: number | null
          ativo: boolean | null
          criado_em: string
          tenant_id: string | null
        }
        Insert: {
          id?: string
          nome?: string | null
          descricao?: string | null
          categoria?: string | null
          duracao_minutos?: number | null
          ativo?: boolean | null
          criado_em?: string
          tenant_id?: string | null
        }
        Update: {
          id?: string
          nome?: string | null
          descricao?: string | null
          categoria?: string | null
          duracao_minutos?: number | null
          ativo?: boolean | null
          criado_em?: string
          tenant_id?: string | null
        }
      }
      pagamentos: {
        Row: {
          id: string
          cliente_id: string | null
          valor: number | null
          status: string | null
          vencimento: string | null
          pagbank_order_id: string | null
          pagbank_charge_id: string | null
          pagbank_status: string | null
          pagbank_qr_code_text: string | null
          pagbank_qr_code_image_url: string | null
          pagbank_reference_id: string | null
          pagbank_payload: Json | null
          pagbank_fee: number | null
          pagbank_net_amount: number | null
          pagbank_expires_at: string | null
          pagbank_updated_at: string | null
          criado_em: string
          tenant_id: string | null
        }
        Insert: {
          id?: string
          cliente_id?: string | null
          valor?: number | null
          status?: string | null
          vencimento?: string | null
          pagbank_order_id?: string | null
          pagbank_charge_id?: string | null
          pagbank_status?: string | null
          pagbank_qr_code_text?: string | null
          pagbank_qr_code_image_url?: string | null
          pagbank_reference_id?: string | null
          pagbank_payload?: Json | null
          pagbank_fee?: number | null
          pagbank_net_amount?: number | null
          pagbank_expires_at?: string | null
          pagbank_updated_at?: string | null
          criado_em?: string
          tenant_id?: string | null
        }
        Update: {
          id?: string
          cliente_id?: string | null
          valor?: number | null
          status?: string | null
          vencimento?: string | null
          pagbank_order_id?: string | null
          pagbank_charge_id?: string | null
          pagbank_status?: string | null
          pagbank_qr_code_text?: string | null
          pagbank_qr_code_image_url?: string | null
          pagbank_reference_id?: string | null
          pagbank_payload?: Json | null
          pagbank_fee?: number | null
          pagbank_net_amount?: number | null
          pagbank_expires_at?: string | null
          pagbank_updated_at?: string | null
          criado_em?: string
          tenant_id?: string | null
        }
      }
      solara_threads: {
        Row: {
          id: string
          user_id: string | null
          channel: string | null
          source: string | null
          external_id: string | null
          status: string | null
          criado_em: string
          tenant_id: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          channel?: string | null
          source?: string | null
          external_id?: string | null
          status?: string | null
          criado_em?: string
          tenant_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          channel?: string | null
          source?: string | null
          external_id?: string | null
          status?: string | null
          criado_em?: string
          tenant_id?: string | null
        }
      }
      solara_messages: {
        Row: {
          id: string
          thread_id: string | null
          content: string | null
          role: string | null
          metadata: Json | null
          criado_em: string
        }
        Insert: {
          id?: string
          thread_id?: string | null
          content?: string | null
          role?: string | null
          metadata?: Json | null
          criado_em?: string
        }
        Update: {
          id?: string
          thread_id?: string | null
          content?: string | null
          role?: string | null
          metadata?: Json | null
          criado_em?: string
        }
      }
    }
  }
}
