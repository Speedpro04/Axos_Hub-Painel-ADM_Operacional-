
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Patient, PatientStatus, MedicalRecord } from './types';
import { mockPatients } from './mockData';
import toast from 'react-hot-toast';

interface AxosState {
  patients: Patient[];
  isSidebarOpen: boolean;
  activeTab: 'dashboard' | 'kanban' | 'patients' | 'agenda';
  selectedPatientId: string | null;
  isLoading: boolean;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  
  // Actions
  setSidebarOpen: (open: boolean) => void;
  setActiveTab: (tab: AxosState['activeTab']) => void;
  setSelectedPatientId: (id: string | null) => void;
  setSyncStatus: (status: AxosState['syncStatus']) => void;
  
  // Patient management
  updatePatientStatus: (id: string, status: PatientStatus) => Promise<void>;
  updatePatient: (updatedPatient: Patient) => Promise<void>;
  addMedicalRecord: (patientId: string, record: MedicalRecord) => Promise<void>;
  
  // n8n sync helper
  syncToN8N: (endpoint: string, data: any) => Promise<any>;
}

// Em um ambiente real, estas chaves viriam de process.env
const N8N_BASE_URL = ''; // URL do webhook do n8n

export const useAxosStore = create<AxosState>()(
  devtools(
    persist(
      (set, get) => ({
        patients: mockPatients,
        isSidebarOpen: true,
        activeTab: 'dashboard',
        selectedPatientId: null,
        isLoading: false,
        syncStatus: 'idle',

        setSidebarOpen: (open) => set({ isSidebarOpen: open }),
        setActiveTab: (tab) => set({ activeTab: tab, selectedPatientId: null }),
        setSelectedPatientId: (id) => set({ selectedPatientId: id }),
        setSyncStatus: (status) => set({ syncStatus: status }),

        updatePatientStatus: async (id, status) => {
          const previousPatients = get().patients;
          set({
            patients: previousPatients.map(p => 
              p.id === id ? { ...p, status, isSyncing: true } : p
            )
          });

          try {
            await get().syncToN8N('/update-status', { patientId: id, status });
            
            set({
              patients: get().patients.map(p => 
                p.id === id ? { ...p, isSyncing: false } : p
              )
            });
            toast.success(`Fluxo atualizado para ${status}`);
          } catch (error) {
            set({ patients: previousPatients });
            toast.error('Erro na sincronização Axos Hub.');
          }
        },

        updatePatient: async (updated) => {
          set(state => ({
            patients: state.patients.map(p => p.id === updated.id ? updated : p)
          }));
          
          get().syncToN8N('/update-patient', updated).catch(console.error);
        },

        addMedicalRecord: async (patientId, record) => {
          const patient = get().patients.find(p => p.id === patientId);
          if (!patient) return;

          const updatedPatient = {
            ...patient,
            history: [record, ...patient.history]
          };

          set(state => ({
            patients: state.patients.map(p => p.id === patientId ? updatedPatient : p)
          }));

          toast.success('Prontuário atualizado e assinado');
          get().syncToN8N('/new-record', { patientId, record }).catch(console.error);
        },

        syncToN8N: async (endpoint, data) => {
          set({ syncStatus: 'syncing' });
          
          if (!N8N_BASE_URL) {
            // Mock de sucesso quando a URL do n8n não está configurada
            await new Promise(r => setTimeout(r, 1000));
            set({ syncStatus: 'success' });
            setTimeout(() => set({ syncStatus: 'idle' }), 2000);
            return;
          }
          
          try {
            const response = await fetch(`${N8N_BASE_URL}${endpoint}`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                ...data,
                timestamp: new Date().toISOString(),
                source: 'Axos Hub Frontend'
              })
            });

            if (!response.ok) throw new Error(`n8n sync failed: ${response.statusText}`);
            
            set({ syncStatus: 'success' });
            setTimeout(() => set({ syncStatus: 'idle' }), 2000);
            
            return response.json();
          } catch (error) {
            set({ syncStatus: 'error' });
            setTimeout(() => set({ syncStatus: 'idle' }), 3000);
            throw error;
          }
        }
      }),
      { name: 'axos-hub-storage' }
    )
  )
);
