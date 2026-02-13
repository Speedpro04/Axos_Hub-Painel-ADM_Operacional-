
import React, { useState } from 'react';
import { Appointment } from '../types';
import { Calendar as CalendarIcon, Clock, User, ChevronLeft, ChevronRight, Plus, Sparkles, Phone } from 'lucide-react';

interface AgendaViewProps {
  appointments: Appointment[];
}

const AgendaView: React.FC<AgendaViewProps> = ({ appointments }) => {
  const [selectedDate, setSelectedDate] = useState('15/02/2025');

  return (
    <div className="space-y-8 animate-in slide-in-from-top-4 duration-500 font-inter">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-white border border-slate-200 p-2 rounded-xl flex items-center gap-4 shadow-sm">
            <button className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400"><ChevronLeft size={18} /></button>
            <h2 className="font-semibold text-slate-700 uppercase text-[11px] tracking-widest">{selectedDate}</h2>
            <button className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400"><ChevronRight size={18} /></button>
          </div>
          <button className="bg-white border border-slate-200 p-2.5 rounded-xl text-slate-400 hover:text-[#00A3FF] transition-all">
            <CalendarIcon size={20} />
          </button>
        </div>
        <button className="bg-[#00A3FF] text-white px-6 py-3.5 rounded-2xl font-semibold flex items-center gap-2 hover:brightness-110 shadow-lg shadow-blue-500/10 uppercase text-[10px] tracking-widest transition-all">
          <Plus size={18} /> Agendar Paciente
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
           {['Dr. Ricardo', 'Dra. Luana'].map((doc) => (
             <div key={doc} className="bg-white rounded-[28px] border border-slate-200 shadow-sm overflow-hidden">
               <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
                 <h3 className="font-semibold text-slate-800 text-[11px] uppercase tracking-wider">{doc}</h3>
                 <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest">4 Agendamentos</span>
               </div>
               <div className="p-4 space-y-2">
                 {appointments.filter(a => a.professional === doc).map((app) => (
                   <div key={app.id} className="p-4 bg-white border border-slate-200 rounded-xl hover:border-[#00A3FF] transition-all flex items-center gap-5 group">
                     <div className="w-14 flex flex-col items-center">
                       <span className="font-semibold text-slate-800 text-sm">{app.time}</span>
                       <span className="text-[8px] text-[#00A3FF] font-bold uppercase tracking-tighter">Ok</span>
                     </div>
                     <div className="w-px h-8 bg-slate-100"></div>
                     <div className="flex-1">
                       <h4 className="font-semibold text-slate-700 group-hover:text-[#00A3FF] transition-colors text-sm">{app.patientName}</h4>
                       <p className="text-[9px] text-slate-400 font-medium uppercase tracking-widest">{app.type}</p>
                     </div>
                     <button className="p-2.5 text-slate-300 hover:text-green-500 hover:bg-green-50 rounded-lg transition-all border border-transparent hover:border-green-100">
                       <Phone size={16} />
                     </button>
                   </div>
                 ))}
                 <button className="w-full py-4 text-slate-400 text-[9px] font-bold hover:text-[#00A3FF] transition-all border-2 border-dashed border-slate-100 rounded-xl flex items-center justify-center gap-2 uppercase tracking-widest mt-2">
                   <Plus size={14} /> Adicionar Encaixe
                 </button>
               </div>
             </div>
           ))}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-slate-900 rounded-[28px] p-8 text-white shadow-xl relative overflow-hidden border border-white/5">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#00A3FF]/10 blur-[40px] rounded-full"></div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#00A3FF] mb-6 flex items-center gap-2">
              <Sparkles size={16} /> Lista de Espera IA
            </h3>
            <p className="text-[10px] text-slate-500 mb-6 font-medium leading-relaxed uppercase tracking-tight italic">Window detectada às 10:30. Recomendação:</p>
            
            <div className="space-y-3 relative z-10">
              {[
                { name: 'Ricardo Dias', distance: '15 min', score: '98%' },
                { name: 'Sandra Mello', distance: '25 min', score: '85%' }
              ].map((s, i) => (
                <div key={i} className="bg-white/5 border border-white/10 p-4 rounded-xl hover:bg-white/10 transition-all cursor-pointer group">
                  <div className="flex justify-between items-start">
                    <p className="font-semibold text-xs tracking-tight">{s.name}</p>
                    <span className="text-[8px] bg-[#00A3FF]/20 text-[#00A3FF] px-2 py-0.5 rounded-md font-bold">{s.score}</span>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-[9px] text-slate-500 font-medium">Prox: {s.distance}</span>
                    <button className="text-[9px] font-bold text-[#00A3FF] uppercase tracking-widest hover:underline">Chamar</button>
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full mt-8 bg-white/5 text-slate-400 border border-white/10 py-3 rounded-xl text-[9px] font-bold hover:bg-[#00A3FF] hover:text-white transition-all uppercase tracking-widest">
              Ver Completo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgendaView;
