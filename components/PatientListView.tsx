
import React from 'react';
import { Patient, PatientStatus } from '../types';
import { Search, ChevronRight, Plus, Filter } from 'lucide-react';

interface PatientListViewProps {
  patients: Patient[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onOpenPatient: (id: string) => void;
}

const getStatusStyles = (status: PatientStatus) => {
  switch (status) {
    case PatientStatus.TRIAGE:
      return { bg: 'bg-[#E0F2FE]', text: 'text-[#0369A1]' };
    case PatientStatus.ATTENDING:
      return { bg: 'bg-[#DCFCE7]', text: 'text-[#15803D]' };
    case PatientStatus.CHECKOUT:
      return { bg: 'bg-[#F3E8FF]', text: 'text-[#7E22CE]' };
    case PatientStatus.RESCHEDULE:
      return { bg: 'bg-[#FEF3C7]', text: 'text-[#B45309]' };
    case PatientStatus.DELETED:
      return { bg: 'bg-[#FEE2E2]', text: 'text-[#B91C1C]' };
    default:
      return { bg: 'bg-slate-200', text: 'text-slate-600' };
  }
};

const PatientListView: React.FC<PatientListViewProps> = ({ patients, searchQuery, setSearchQuery, onOpenPatient }) => {
  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500 font-inter">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">Base de Pacientes</h1>
          <p className="text-slate-500 text-sm font-medium">Gestão centralizada Axos Hub.</p>
        </div>
        <button className="bg-[#00A3FF] text-white px-6 py-3.5 rounded-2xl font-semibold flex items-center gap-2 hover:brightness-110 shadow-lg shadow-blue-500/10 w-fit transition-all uppercase text-xs tracking-widest">
          <Plus size={18} /> Cadastrar Paciente
        </button>
      </div>

      <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row gap-6 items-center justify-between bg-slate-50/30">
          <div className="relative w-full md:w-[400px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#00A3FF] text-sm transition-all font-medium text-slate-700"
              placeholder="Buscar por nome ou CPF..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 text-slate-600 font-semibold text-xs uppercase tracking-widest bg-white border border-slate-200 px-5 py-3 rounded-xl hover:bg-slate-50 transition-colors">
            <Filter size={18} /> Filtrar Convênio
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-widest font-semibold border-b border-slate-200">
                <th className="px-8 py-4">Paciente</th>
                <th className="px-8 py-4">Identificação</th>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4">Seguradora</th>
                <th className="px-8 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {patients.map((p) => {
                const styles = getStatusStyles(p.status);
                return (
                  <tr 
                    key={p.id} 
                    className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                    onClick={() => onOpenPatient(p.id)}
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#00A3FF]/10 text-[#00A3FF] flex items-center justify-center font-bold text-base border border-[#00A3FF]/20">
                          {p.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{p.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium">Nasc: {p.birthDate}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-sm text-slate-600 font-medium">{p.cpf}</td>
                    <td className="px-8 py-5">
                      <span className={`text-[9px] font-semibold px-3 py-1 rounded-lg tracking-wider uppercase ${styles.bg} ${styles.text}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-sm text-slate-600 font-semibold uppercase tracking-tight">{p.insurance}</td>
                    <td className="px-8 py-5 text-right">
                      <button className="p-2 text-slate-300 group-hover:text-[#00A3FF] transition-all">
                        <ChevronRight size={20} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PatientListView;
