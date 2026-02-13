
export enum PatientStatus {
  WAITING = 'Aguardando',
  TRIAGE = 'Triagem',
  ATTENDING = 'Em Atendimento',
  CHECKOUT = 'Checkout',
  RESCHEDULE = 'Remarcar',
  DELETED = 'Deletado',
  FINISHED = 'Finalizado'
}

export interface Patient {
  id: string;
  name: string;
  cpf: string;
  birthDate: string;
  phone: string;
  insurance: string;
  status: PatientStatus;
  alerts: string[];
  history: MedicalRecord[];
  lastVisit: string;
  arrivalTime: string; // ISO string para cálculos de tempo real
  isUrgent?: boolean;
  isSyncing?: boolean; // Controle visual para n8n/Supabase
}

export interface MedicalRecord {
  id: string;
  date: string;
  professional: string;
  notes: string;
  summary?: string;
  procedure?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  time: string;
  professional: string;
  type: string;
}
