import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { supabase } from './services/supabase'
import { Patient, PatientStatus, MedicalRecord } from './types'
import { mockPatients } from './mockData'
import toast from 'react-hot-toast'

interface AxosState {
  patients: Patient[]
  isSidebarOpen: boolean
  activeTab: 'dashboard' | 'kanban' | 'patients' | 'agenda'
  selectedPatientId: string | null
  isLoading: boolean
  syncStatus: 'idle' | 'syncing' | 'success' | 'error'

  // Actions
  setSidebarOpen: (open: boolean) => void
  setActiveTab: (tab: AxosState['activeTab']) => void
  setSelectedPatientId: (id: string | null) => void
  setSyncStatus: (status: AxosState['syncStatus']) => void

  // Supabase sync
  loadCustomers: () => Promise<void>
  updatePatientStatus: (id: string, status: PatientStatus) => Promise<void>
  updatePatient: (updatedPatient: Patient) => Promise<void>
  addMedicalRecord: (patientId: string, record: MedicalRecord) => Promise<void>
}

// Wrapper para usar with await - Supabase v2 precisa de .then() explicito
async function sb<T>(builder: any): Promise<{ data: T | null; error: any }> {
  return (builder as any).then((result: any) => result)
}

// Wrapper fire-and-forget
function sbFire(builder: any): void {
  ;(builder as any).then()
}

export const useAxosStore = create<AxosState>()(
  devtools((set, get) => ({
    patients: mockPatients,
    isSidebarOpen: true,
    activeTab: 'dashboard',
    selectedPatientId: null,
    isLoading: true,
    syncStatus: 'idle',

    setSidebarOpen: (open) => set({ isSidebarOpen: open }),
    setActiveTab: (tab) => set({ activeTab: tab, selectedPatientId: null }),
    setSelectedPatientId: (id) => set({ selectedPatientId: id }),
    setSyncStatus: (status) => set({ syncStatus: status }),

    loadCustomers: async () => {
      try {
        set({ isLoading: true, syncStatus: 'syncing' })

        const { data, error } = await sb<any[]>(
          supabase.from('clientes').select('*')
        )

        if (data && data.length > 0) {
          const patients: Patient[] = data.map((cliente: any) => ({
            id: cliente.id,
            name: cliente.nome ?? 'Sem nome',
            cpf: cliente.tax_id ?? '',
            birthDate: '',
            phone: cliente.telefone ?? '',
            insurance: 'N/A',
            status: PatientStatus.WAITING,
            alerts: [],
            history: [],
            lastVisit: '',
            arrivalTime: cliente.criado_em ?? new Date().toISOString(),
            isUrgent: false,
          }))
          set({ patients, isLoading: false, syncStatus: 'success' })
        } else {
          set({ patients: mockPatients, isLoading: false, syncStatus: 'success' })
        }

        setTimeout(() => set({ syncStatus: 'idle' }), 2000)
      } catch (err) {
        console.error('Erro ao carregar dados:', err)
        set({ patients: mockPatients, isLoading: false, syncStatus: 'error' })
        setTimeout(() => set({ syncStatus: 'idle' }), 2000)
      }
    },

    updatePatientStatus: async (id, status) => {
      const previousPatients = get().patients
      set({
        patients: previousPatients.map((p) =>
          p.id === id ? { ...p, status, isSyncing: true } : p
        ),
      })

      try {
        const { error } = await sb<any>(
          supabase.from('clientes').update({ status }).eq('id', id)
        )

        if (error) throw error

        set({
          patients: get().patients.map((p) =>
            p.id === id ? { ...p, isSyncing: false } : p
          ),
        })
        toast.success(`Fluxo atualizado para ${status}`)
      } catch (e: any) {
        console.error('Erro sync status:', e?.message)
        set({ patients: previousPatients })
        toast.error('Erro ao atualizar status.')
      }
    },

    updatePatient: async (updated) => {
      set((state) => ({
        patients: state.patients.map((p) =>
          p.id === updated.id ? updated : p
        ),
      }))

      sbFire(
        supabase.from('clientes').update({
          nome: updated.name,
          telefone: updated.phone,
          status: updated.status,
          tax_id: updated.cpf,
        }).eq('id', updated.id)
      )
    },

    addMedicalRecord: async (patientId, record) => {
      const { error } = await sb<any>(
        supabase.from('atendimentos').insert({
          cliente_id: patientId,
          canal: 'painel',
          responsavel: record.professional,
          status: 'finalizado',
        })
      )

      if (error) {
        toast.error('Erro ao salvar prontuario.')
        return
      }

      toast.success('Prontuario atualizado e assinado')
    },
  }))
)
