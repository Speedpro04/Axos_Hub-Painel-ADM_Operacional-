
import React, { useState, useEffect, useRef } from 'react';
import { Patient, PatientStatus } from '../types';
import { Clock, ArrowRight, Info, AlertCircle, GripVertical, Cloud, CheckCircle2 } from 'lucide-react';

interface KanbanViewProps {
  patients: Patient[];
  onUpdateStatus: (id: string, newStatus: PatientStatus) => void;
  onOpenPatient: (id: string) => void;
}

const getStatusStyles = (status: PatientStatus) => {
  switch (status) {
    case PatientStatus.TRIAGE:
      return { bg: 'bg-[#E0F2FE]', text: 'text-[#0369A1]', border: 'border-[#BAE6FD]', dot: '#0369A1' };
    case PatientStatus.ATTENDING:
      return { bg: 'bg-[#DCFCE7]', text: 'text-[#15803D]', border: 'border-[#BBF7D0]', dot: '#15803D' };
    case PatientStatus.CHECKOUT:
      return { bg: 'bg-[#F3E8FF]', text: 'text-[#7E22CE]', border: 'border-[#E9D5FF]', dot: '#7E22CE' };
    case PatientStatus.RESCHEDULE:
      return { bg: 'bg-[#FEF3C7]', text: 'text-[#B45309]', border: 'border-[#FDE68A]', dot: '#B45309' };
    default:
      return { bg: 'bg-slate-200', text: 'text-slate-600', border: 'border-slate-300', dot: '#64748b' };
  }
};

const RealTimeClock: React.FC<{ arrivalTime: string }> = ({ arrivalTime }) => {
  const [mins, setMins] = useState(0);

  useEffect(() => {
    const calculate = () => {
      const start = new Date(arrivalTime).getTime();
      const now = new Date().getTime();
      setMins(Math.max(0, Math.floor((now - start) / 60000)));
    };
    calculate();
    const timer = setInterval(calculate, 30000); 
    return () => clearInterval(timer);
  }, [arrivalTime]);

  return (
    <div className="flex items-center gap-1.5 font-semibold text-slate-500 text-[10px] uppercase tracking-wider">
      <Clock size={12} className="text-[#00A3FF]" />
      <span>Há {mins} min</span>
    </div>
  );
};

const KanbanView: React.FC<KanbanViewProps> = ({ patients, onUpdateStatus, onOpenPatient }) => {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [targetCol, setTargetCol] = useState<PatientStatus | null>(null);

  const columns: { title: string; status: PatientStatus }[] = [
    { title: 'Aguardando', status: PatientStatus.WAITING },
    { title: 'Triagem', status: PatientStatus.TRIAGE },
    { title: 'Atendimento', status: PatientStatus.ATTENDING },
    { title: 'Checkout', status: PatientStatus.CHECKOUT },
    { title: 'Remarcar', status: PatientStatus.RESCHEDULE },
  ];

  const onDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.setData('patientId', id);
  };

  const onDrop = (e: React.DragEvent, status: PatientStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('patientId');
    if (id) onUpdateStatus(id, status);
    setDraggedId(null);
    setTargetCol(null);
  };

  return (
    <div className="h-full flex flex-col space-y-8 font-inter select-none">
      <div className="px-4">
        <h1 className="text-2xl font-semibold text-slate-800 tracking-tight flex items-center gap-4">
          Fluxo de Atendimento
          <div className="flex items-center gap-2 bg-blue-50 text-[#00A3FF] px-4 py-1.5 rounded-full text-[10px] border border-blue-200 uppercase tracking-widest font-bold">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            Sincronizado
          </div>
        </h1>
        <p className="text-slate-500 font-medium mt-1 text-xs uppercase tracking-wider">Gestão em tempo real Axos Hub</p>
      </div>

      <div className="flex gap-8 overflow-x-auto pb-10 flex-1 px-2 snap-x">
        {columns.map((col) => {
          const styles = getStatusStyles(col.status);
          const colPatients = patients.filter(p => p.status === col.status);
          return (
            <div 
              key={col.status} 
              className={`flex-1 min-w-[320px] flex flex-col rounded-[32px] transition-all duration-300 border-2 snap-center overflow-hidden ${
                targetCol === col.status ? 'bg-blue-50/50 border-dashed border-[#00A3FF]' : 'bg-slate-100/50 border-transparent'
              }`}
              onDragOver={(e) => { e.preventDefault(); setTargetCol(col.status); }}
              onDrop={(e) => onDrop(e, col.status)}
              onDragLeave={() => setTargetCol(null)}
            >
              <div className="p-5 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: styles.dot }}></div>
                  <h3 className="font-semibold text-slate-700 tracking-wider text-[11px] uppercase">{col.title}</h3>
                </div>
                <span className="bg-slate-50 text-slate-500 text-[10px] font-bold px-3 py-1 rounded-lg border border-slate-200">
                  {colPatients.length}
                </span>
              </div>

              <div className="p-4 flex-1 space-y-4 overflow-y-auto custom-scrollbar">
                {colPatients.map((patient) => {
                  const pStyles = getStatusStyles(patient.status);
                  return (
                    <div 
                      key={patient.id} 
                      className={`bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing group relative ${
                        draggedId === patient.id ? 'opacity-20' : 'opacity-100'
                      } ${patient.isSyncing ? 'animate-pulse' : ''}`}
                      draggable={!patient.isSyncing}
                      onDragStart={(e) => onDragStart(e, patient.id)}
                    >
                      {patient.isSyncing && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] flex items-center justify-center z-10 rounded-[24px]">
                           <div className="flex flex-col items-center gap-2">
                             <Cloud className="text-[#00A3FF] animate-bounce" size={24} />
                             <span className="text-[9px] font-bold text-[#00A3FF] uppercase tracking-wider">Salvando...</span>
                           </div>
                        </div>
                      )}

                      {patient.isUrgent && (
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-red-600 rounded-t-[24px]"></div>
                      )}

                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <GripVertical size={16} className="text-slate-300 group-hover:text-slate-400" />
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{patient.insurance}</span>
                        </div>
                        <button 
                          onClick={() => onOpenPatient(patient.id)} 
                          className="p-1.5 rounded-lg text-slate-300 hover:text-[#00A3FF] hover:bg-blue-50 transition-all"
                        >
                          <Info size={18} />
                        </button>
                      </div>

                      <h4 className="font-semibold text-slate-800 text-base mb-2 tracking-tight">{patient.name}</h4>
                      
                      <div className="mb-4">
                         <RealTimeClock arrivalTime={patient.arrivalTime} />
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className={`text-[8px] font-bold px-2.5 py-1 rounded-md border uppercase tracking-widest ${pStyles.bg} ${pStyles.text} ${pStyles.border}`}>
                          {patient.status}
                        </span>
                        {patient.alerts.map((a, i) => (
                          <span key={i} className="bg-red-50 text-red-600 text-[8px] font-bold px-2.5 py-1 rounded-md border border-red-100 flex items-center gap-1 uppercase tracking-widest">
                            <AlertCircle size={10} /> {a}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                         <p className="text-[10px] font-bold text-slate-300 uppercase">ID: {patient.id.padStart(4, '0')}</p>
                         <button 
                            className="bg-slate-50 text-slate-500 p-2 rounded-xl hover:bg-[#00A3FF] hover:text-white transition-all border border-slate-200"
                            onClick={() => onOpenPatient(patient.id)}
                          >
                            <ArrowRight size={16} />
                          </button>
                      </div>
                    </div>
                  );
                })}

                {colPatients.length === 0 && (
                   <div className="h-48 flex flex-col items-center justify-center text-slate-300 opacity-40 space-y-4 border-2 border-dashed border-slate-200 rounded-[32px]">
                     <CheckCircle2 size={32} />
                     <p className="text-[10px] font-semibold uppercase tracking-widest">Fila Vazia</p>
                   </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default KanbanView;
