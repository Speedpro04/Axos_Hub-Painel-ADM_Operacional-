
import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  ShieldCheck, 
  Phone, 
  Plus, 
  Sparkles,
  MessageCircle,
  Clock,
  ExternalLink,
  Zap,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { useDebouncedCallback } from 'use-debounce';
import { Patient, MedicalRecord } from '../types';
import { useAxosStore } from '../store';
import { useAIAnalysis } from '../hooks/useAIAnalysis';
import { usePageAnalytics } from '../hooks/usePageAnalytics';
import { AILoadingIndicator } from './LoadingStates';
import toast from 'react-hot-toast';

interface PatientDetailViewProps {
  patient: Patient;
  onBack: () => void;
  onUpdate: (patient: Patient) => Promise<void>;
}

const PatientDetailView: React.FC<PatientDetailViewProps> = ({ patient, onBack, onUpdate }) => {
  const { addMedicalRecord, syncStatus } = useAxosStore();
  const { runSymptomAnalysis, runMedicalSummary, isProcessing } = useAIAnalysis();
  
  const [activeTab, setActiveTab] = useState<'records' | 'history' | 'files'>('records');
  const [newNote, setNewNote] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);

  const noteInputRef = useRef<HTMLTextAreaElement>(null);

  // Analytics de Página
  usePageAnalytics('patient-detail', { 
    patientId: patient.id,
    patientName: patient.name,
    hasAlerts: patient.alerts.length > 0
  });

  // Debounce para rascunho de sintomas
  const saveSymptomsDraft = useDebouncedCallback((text: string) => {
    sessionStorage.setItem(`axos-symptoms-draft-${patient.id}`, text);
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 2000);
  }, 1000);

  const handleSymptomsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setSymptoms(value);
    saveSymptomsDraft(value);
    setHasUnsavedChanges(true);
  };

  // Efeitos iniciais e carregamento de rascunhos
  useEffect(() => {
    const draft = sessionStorage.getItem(`axos-symptoms-draft-${patient.id}`);
    if (draft) setSymptoms(draft);

    const hasSeenTip = sessionStorage.getItem('axos-keyboard-tip-seen');
    if (!hasSeenTip) {
      setTimeout(() => {
        toast('💡 Dica: Use Ctrl+Enter para salvar rapidamente!', {
          duration: 5000,
          icon: '⌨️',
          position: 'bottom-right',
        });
        sessionStorage.setItem('axos-keyboard-tip-seen', 'true');
      }, 3000);
    }
  }, [patient.id]);

  useEffect(() => {
    setHasUnsavedChanges(!!newNote || !!symptoms);
  }, [newNote, symptoms]);

  // Bloqueio de saída acidental do navegador
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Atalhos de teclado (Ctrl/Cmd + Enter e Ctrl/Cmd + Shift + A)
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (newNote) handleSaveNote();
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        if (symptoms && !isProcessing) handleSymptomAnalysis();
      }
    };
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [newNote, symptoms, isProcessing]);

  const handleBackWithConfirmation = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('Há rascunhos não salvos. Deseja realmente sair?')) {
        onBack();
      }
    } else {
      onBack();
    }
  };

  const handleSummarize = async (recordId: string) => {
    const record = patient.history.find(h => h.id === recordId);
    if (!record) return;
    const summary = await runMedicalSummary(record.notes, patient.id);
    if (summary) {
      const updatedHistory = patient.history.map(h => 
        h.id === recordId ? { ...h, summary } : h
      );
      await onUpdate({ ...patient, history: updatedHistory });
    }
  };

  const handleSymptomAnalysis = async () => {
    const result = await runSymptomAnalysis(symptoms, patient.id);
    if (result) {
      setAiInsight(result.reasoning);
      if (result.isUrgent) {
        await onUpdate({ 
          ...patient, 
          isUrgent: true, 
          alerts: Array.from(new Set([...patient.alerts, 'URGÊNCIA IA']))
        });
      }
    }
  };

  const handleSaveNote = async () => {
    if (!newNote) return;
    const record: MedicalRecord = {
      id: crypto.randomUUID(),
      date: new Date().toLocaleDateString('pt-BR'),
      professional: 'Administrador Axos',
      notes: newNote
    };
    await addMedicalRecord(patient.id, record);
    setNewNote('');
    setHasUnsavedChanges(false);
  };

  return (
    <div className="animate-in slide-in-from-right-4 duration-500 pb-12 font-inter">
      <div className="flex items-center justify-between mb-8">
        <button onClick={handleBackWithConfirmation} className="flex items-center gap-2 text-slate-500 hover:text-[#00A3FF] transition-all group font-semibold uppercase text-xs tracking-widest">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span>Voltar ao Painel</span>
        </button>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-blue-50 text-[#00A3FF] px-4 py-2 rounded-xl border border-blue-100 shadow-sm">
            <Zap size={14} className="fill-[#00A3FF]" />
            <span className="text-[10px] font-bold uppercase tracking-wider">IA Studio Ativa</span>
          </div>
          
          {syncStatus === 'syncing' && (
            <div className="flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-2 rounded-xl border border-blue-200 animate-pulse">
              <Loader2 className="animate-spin h-3 w-3" />
              <span className="text-[9px] font-bold uppercase tracking-wider">Sync</span>
            </div>
          )}
          
          {syncStatus === 'success' && (
            <div className="flex items-center gap-2 bg-green-50 text-green-600 px-3 py-2 rounded-xl border border-green-200 animate-in zoom-in-95">
              <CheckCircle2 className="w-3 h-3" />
              <span className="text-[9px] font-bold uppercase tracking-wider">Salvo</span>
            </div>
          )}
          
          {syncStatus === 'error' && (
            <div className="flex items-center gap-2 bg-red-50 text-red-600 px-3 py-2 rounded-xl border border-red-200">
              <AlertTriangle size={12} />
              <span className="text-[9px] font-bold uppercase tracking-wider">Erro Sync</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
            <div className="premium-gradient p-10 text-center">
              <div className="w-24 h-24 bg-white/10 rounded-[28px] mx-auto mb-4 flex items-center justify-center text-4xl font-bold text-white backdrop-blur-md border border-white/20">
                {patient.name.charAt(0)}
              </div>
              <h2 className="text-xl font-semibold text-white tracking-tight">{patient.name}</h2>
              <p className="text-blue-300 text-[10px] mt-1 font-bold uppercase tracking-widest">{patient.cpf}</p>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400">
                  <Calendar size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nascimento</p>
                  <p className="text-sm font-semibold text-slate-800">{new Date(patient.birthDate).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400">
                  <Phone size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Contato</p>
                  <p className="text-sm font-semibold text-slate-800">{patient.phone}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-8">
          <nav className="flex border-b border-slate-200 gap-10">
            {['records', 'history', 'files'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex items-center gap-2 pb-5 text-[10px] font-bold transition-all relative tracking-wider uppercase ${
                  activeTab === tab ? 'text-[#00A3FF]' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab === 'records' && <Activity size={16} />}
                {tab === 'history' && <Clock size={16} />}
                {tab === 'files' && <ExternalLink size={16} />}
                {tab === 'records' ? 'Evolução Clínica' : tab === 'history' ? 'Histórico' : 'Arquivos'}
                {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#00A3FF] rounded-t-full"></div>}
              </button>
            ))}
          </nav>

          {activeTab === 'records' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
              <div className="bg-slate-900 p-8 rounded-[32px] shadow-lg relative overflow-hidden border border-white/5">
                <div className="flex items-center justify-between mb-6 relative z-10">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-[#00A3FF] rounded-xl flex items-center justify-center border border-blue-400/20">
                       <Zap size={18} className="text-white fill-white" />
                     </div>
                     <h3 className="font-semibold text-white tracking-tight text-lg">Triagem Inteligente Axos</h3>
                   </div>
                   {isProcessing && <AILoadingIndicator message="Axos AI Analisando..." />}
                </div>
                <div className="flex flex-col gap-4 relative z-10">
                   <textarea 
                    className="w-full h-24 p-5 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-[#00A3FF] text-white transition-all font-medium text-sm placeholder:text-slate-600 resize-none"
                    placeholder="Quais sintomas o paciente apresenta?"
                    value={symptoms}
                    onChange={handleSymptomsChange}
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex-1 mr-6 flex items-center gap-4">
                       {draftSaved && (
                         <div className="text-[10px] text-green-400 flex items-center gap-1.5 animate-in fade-in">
                           <CheckCircle2 className="w-3 h-3" />
                           Rascunho salvo
                         </div>
                       )}
                       {aiInsight && (
                         <div className="text-[10px] text-blue-300 font-semibold italic border-l-2 border-blue-500/50 pl-4 py-0.5 animate-in fade-in">
                           "Insights IA: {aiInsight}"
                         </div>
                       )}
                    </div>
                    <button 
                      onClick={handleSymptomAnalysis}
                      disabled={isProcessing || !symptoms}
                      className="bg-[#00A3FF] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:brightness-110 transition-all disabled:opacity-30 text-[10px] uppercase tracking-wider"
                    >
                      {isProcessing ? <Sparkles className="animate-spin" size={16} /> : <Zap size={16} />}
                      Analisar Caso
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                <h3 className="font-semibold text-slate-800 text-lg mb-6">Novo Registro de Atendimento</h3>
                <textarea 
                  ref={noteInputRef}
                  className="w-full h-40 p-6 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-[#00A3FF] text-slate-700 transition-all font-medium text-sm leading-relaxed resize-none shadow-inner"
                  placeholder="Relatório clínico detalhado... (Ctrl+Enter para salvar)"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                />
                <div className="flex justify-end mt-6">
                  <button 
                    onClick={handleSaveNote}
                    className="bg-[#00A3FF] text-white px-8 py-3.5 rounded-2xl font-bold flex items-center gap-3 hover:brightness-110 transition-all text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20"
                  >
                    <Plus size={18} /> Salvar Evolução
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {patient.history.length === 0 ? (
                  <div className="text-center py-20 animate-in fade-in">
                    <div className="w-24 h-24 bg-slate-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                      <Activity size={40} className="text-slate-300" />
                    </div>
                    <h3 className="text-slate-700 font-bold text-lg mb-2">Sem registros</h3>
                    <p className="text-slate-500 text-sm mb-6">Inicie a primeira evolução clínica deste paciente.</p>
                    <button 
                      onClick={() => noteInputRef.current?.focus()}
                      className="bg-[#00A3FF] text-white px-8 py-3 rounded-2xl text-[10px] uppercase tracking-widest font-bold hover:brightness-110 transition-all"
                    >
                      Adicionar Primeiro Registro
                    </button>
                  </div>
                ) : (
                  patient.history.map((record, index) => (
                    <article 
                      key={record.id} 
                      className="bg-white rounded-[44px] border border-slate-300 shadow-md overflow-hidden border-l-[16px] border-l-[#00A3FF] card-hover-lift animate-stagger-item"
                      style={{ 
                        animationDelay: `${index * 120}ms`,
                        animationFillMode: 'backwards' 
                      }}
                    >
                      <div className="p-10">
                        <div className="flex justify-between items-center mb-8">
                          <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-500 shadow-inner">
                              <User size={32} />
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-lg">{record.professional}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{record.date}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleSummarize(record.id)}
                            disabled={isProcessing}
                            className="text-[10px] font-bold text-[#00A3FF] bg-blue-50 px-6 py-3 rounded-xl border border-blue-100 hover:bg-blue-100 transition-all flex items-center gap-2 uppercase tracking-widest"
                          >
                            <Sparkles size={16} className={isProcessing ? "animate-spin" : ""} />
                            IA Summarize
                          </button>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-2xl text-slate-700 text-sm leading-relaxed border border-slate-100 font-medium italic">
                          "{record.notes}"
                        </div>
                        {record.summary && (
                          <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6 mt-6 animate-in zoom-in-95 shadow-sm">
                            <h4 className="text-[#00A3FF] text-[9px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                              <Zap size={14} className="fill-[#00A3FF]" /> Insights IA Axos
                            </h4>
                            <div className="text-slate-800 text-sm font-medium leading-relaxed border-l-4 border-blue-200 pl-4">
                              {record.summary}
                            </div>
                          </div>
                        )}
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientDetailView;
