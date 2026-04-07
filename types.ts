import type { Database } from './database.types'

// ============================================
// Tipos raw do Supabase (banco real)
// ============================================
export type ClienteRow = Database['public']['Tables']['clientes']['Row']
export type AgendamentoRow = Database['public']['Tables']['agendamentos']['Row']
export type AtendimentoRow = Database['public']['Tables']['atendimentos']['Row']
export type EspecialistaRow = Database['public']['Tables']['especialistas']['Row']
export type MensagemRow = Database['public']['Tables']['mensagens']['Row']
export type ServicoRow = Database['public']['Tables']['servicos']['Row']
export type PagamentoRow = Database['public']['Tables']['pagamentos']['Row']
export type SolaraThreadRow = Database['public']['Tables']['solara_threads']['Row']
export type SolaraMessageRow = Database['public']['Tables']['solara_messages']['Row']

// ============================================
// Tipos adaptados para o frontend (UI)
// ============================================
export enum PatientStatus {
  WAITING = 'Aguardando',
  TRIAGE = 'Triagem',
  ATTENDING = 'Em Atendimento',
  CHECKOUT = 'Checkout',
  RESCHEDULE = 'Remarcar',
  FINISHED = 'Finalizado',
  DELETED = 'Deletado',
}

export interface Patient {
  id: string
  name: string
  cpf: string
  birthDate: string
  phone: string
  insurance: string
  status: PatientStatus
  alerts: string[]
  history: MedicalRecord[]
  lastVisit: string
  arrivalTime: string
  isUrgent?: boolean
  isSyncing?: boolean
}

export interface MedicalRecord {
  id: string
  date: string
  professional: string
  notes: string
  summary?: string
  procedure?: string
}

export interface Appointment {
  id: string
  patientId: string
  patientName: string
  time: string
  professional: string
  type: string
}

export interface Customer {
  id: string
  nome: string
  telefone: string
  email: string
  status: string
  criado_em: string
}

export interface Service {
  id: string
  nome: string
  descricao: string
  categoria: string
  duracao_minutos: number
  ativo: boolean
}

export interface Specialist {
  id: string
  nome: string
  especialidade: string
  ativo: boolean
}

// ============================================
// Funcoes de adaptacao (Supabase → Frontend)
// ============================================
export function clienteToPatient(cliente: ClienteRow): Patient {
  return {
    id: cliente.id,
    name: cliente.nome ?? 'Sem nome',
    cpf: cliente.tax_id ?? '',
    birthDate: '',
    phone: cliente.telefone ?? '',
    insurance: '',
    status: PatientStatus.WAITING,
    alerts: [],
    history: [],
    lastVisit: '',
    arrivalTime: cliente.criado_em,
    isUrgent: false,
  }
}

export function agendamentoToAppointment(
  ag: AgendamentoRow,
  patientName: string = 'Paciente'
): Appointment {
  return {
    id: ag.id,
    patientId: ag.cliente_id ?? '',
    patientName,
    time: ag.data_hora
      ? new Date(ag.data_hora).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '--:--',
    professional: ag.especialista_id ?? '',
    type: 'Consulta',
  }
}
