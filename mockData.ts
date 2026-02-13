
import { Patient, PatientStatus, Appointment } from './types';

const now = new Date();
const getRecentTime = (minsAgo: number) => new Date(now.getTime() - minsAgo * 60000).toISOString();

export const mockPatients: Patient[] = [
  {
    id: '1',
    name: 'Carlos Eduardo Santos',
    cpf: '123.456.789-00',
    birthDate: '1985-05-12',
    phone: '(11) 98888-7777',
    insurance: 'Bradesco Saúde',
    status: PatientStatus.WAITING,
    arrivalTime: getRecentTime(15),
    alerts: ['Hipertensão'],
    lastVisit: '2024-12-10',
    history: [
      {
        id: 'h1',
        date: '10/12/2024',
        professional: 'Dr. Ricardo (Dentista)',
        notes: 'Paciente relatou sensibilidade no dente 24. Realizado exame clínico e radiográfico. Sugerida restauração.',
        procedure: 'Avaliação Inicial'
      }
    ],
    isUrgent: true
  },
  {
    id: '2',
    name: 'Ana Julia Pereira',
    cpf: '222.333.444-55',
    birthDate: '1992-09-20',
    phone: '(11) 97777-6666',
    insurance: 'Particular',
    status: PatientStatus.TRIAGE,
    arrivalTime: getRecentTime(30),
    alerts: ['Alergia a Penicilina'],
    lastVisit: '2025-01-05',
    history: [],
  },
  {
    id: '3',
    name: 'Mariana Oliveira',
    cpf: '444.555.666-77',
    birthDate: '1980-03-15',
    phone: '(11) 96666-5555',
    insurance: 'Unimed',
    status: PatientStatus.ATTENDING,
    arrivalTime: getRecentTime(45),
    alerts: [],
    lastVisit: '2024-11-20',
    history: [],
  },
  {
    id: '4',
    name: 'João Victor Silva',
    cpf: '555.666.777-88',
    birthDate: '2005-01-10',
    phone: '(11) 95555-4444',
    insurance: 'SulAmérica',
    status: PatientStatus.CHECKOUT,
    arrivalTime: getRecentTime(60),
    alerts: ['Diabetes'],
    lastVisit: '2025-02-01',
    history: [],
  }
];

export const mockAppointments: Appointment[] = [
  { id: 'a1', patientId: '1', patientName: 'Carlos Eduardo Santos', time: '09:00', professional: 'Dr. Ricardo', type: 'Restauração' },
  { id: 'a2', patientId: '2', patientName: 'Ana Julia Pereira', time: '09:30', professional: 'Dra. Luana', type: 'Limpeza' },
  { id: 'a3', patientId: '5', patientName: 'Pedro Cavalcanti', time: '10:00', professional: 'Dr. Ricardo', type: 'Consulta' },
  { id: 'a4', patientId: '6', patientName: 'Julia Rosa', time: '11:00', professional: 'Dra. Luana', type: 'Harmonização' },
];
