
import React from 'react';
import { TrendingUp, Users, DollarSign, Clock, ChevronRight, Zap } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area 
} from 'recharts';
import { Patient, PatientStatus } from '../types';

const dataPerformance = [
  { name: 'Seg', v: 4000 },
  { name: 'Ter', v: 3000 },
  { name: 'Qua', v: 2000 },
  { name: 'Qui', v: 2780 },
  { name: 'Sex', v: 1890 },
  { name: 'Sab', v: 2390 },
];

const dataProcedures = [
  { name: 'Limpeza', value: 45 },
  { name: 'Restauração', value: 30 },
  { name: 'Clareamento', value: 15 },
  { name: 'Implante', value: 10 },
];

interface DashboardViewProps {
  patients: Patient[];
  onOpenPatient: (id: string) => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ patients, onOpenPatient }) => {
  const waitingCount = patients.filter(p => p.status === PatientStatus.WAITING).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-inter">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">Painel Executivo</h1>
          <p className="text-slate-500 text-sm font-medium">Gestão inteligente Unidade Axos Hub.</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 flex items-center gap-3 shadow-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-sm"></div>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Status Ativo</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Pacientes Hoje', val: '24', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Em Espera', val: waitingCount.toString(), icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Faturamento Dia', val: 'R$ 4.250', icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Crescimento', val: '+12%', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-7 rounded-[24px] border border-slate-200 shadow-sm hover:shadow-lg transition-all group">
            <div className="flex justify-between items-start mb-5">
              <div className={`${stat.bg} p-3 rounded-xl ${stat.color} transition-transform group-hover:scale-110`}>
                <stat.icon size={22} />
              </div>
              <span className="text-green-600 text-[9px] font-bold bg-green-50 px-2 py-0.5 rounded-full border border-green-100">+4.2%</span>
            </div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-2xl font-semibold text-slate-800 tracking-tight">{stat.val}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[28px] border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wider">Desempenho Semanal</h3>
            <select className="bg-slate-50 border border-slate-200 text-[10px] font-semibold uppercase tracking-widest rounded-lg px-3 py-1.5 outline-none focus:border-axos-blue transition-all">
              <option>Últimos 7 dias</option>
              <option>Últimos 30 dias</option>
            </select>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dataPerformance}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00A3FF" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#00A3FF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 600}} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 600, fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="v" stroke="#00A3FF" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[28px] border border-slate-200 shadow-sm flex flex-col">
          <h3 className="font-semibold text-slate-800 mb-8 uppercase text-sm tracking-wider">Demanda Clínica</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataProcedures} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b', fontWeight: 600}} width={80} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="value" fill="#00A3FF" radius={[0, 6, 6, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/20">
            <h3 className="font-semibold text-slate-800 uppercase tracking-wider text-[11px]">Próximos Pacientes</h3>
            <button className="text-[#00A3FF] text-[9px] font-bold uppercase tracking-widest hover:underline">Ver Todos</button>
          </div>
          <div className="divide-y divide-slate-100">
            {patients.filter(p => p.status === PatientStatus.WAITING).map((p) => (
              <div key={p.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-all cursor-pointer group" onClick={() => onOpenPatient(p.id)}>
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-sm ${p.isUrgent ? 'bg-red-500' : 'bg-slate-800'}`}>
                    {p.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 tracking-tight group-hover:text-[#00A3FF] transition-colors">{p.name}</p>
                    <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-widest">{p.insurance}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {p.isUrgent && <span className="bg-red-50 text-red-600 text-[8px] font-bold px-2 py-0.5 rounded-lg border border-red-100 uppercase tracking-widest">Urgência</span>}
                  <ChevronRight size={18} className="text-slate-300 group-hover:text-[#00A3FF]" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 rounded-[28px] p-10 text-white relative overflow-hidden flex flex-col justify-center shadow-xl border border-white/5">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#00A3FF]/5 blur-[80px] rounded-full"></div>
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="bg-[#00A3FF] p-2.5 rounded-xl">
              <TrendingUp className="text-white" size={20} />
            </div>
            <span className="text-[10px] font-bold tracking-widest uppercase text-[#00A3FF]">Insight Estratégico</span>
          </div>
          <h2 className="text-2xl font-semibold mb-5 tracking-tight leading-tight">Sugestão Axos AI</h2>
          <p className="text-slate-400 font-medium leading-relaxed mb-8 text-base">
            "Sua unidade teve um aumento de <span className="text-white">15%</span> em agendamentos este mês. Recomendamos priorizar atendimentos em espera para manter a meta de agilidade Axos."
          </p>
          <button className="bg-[#00A3FF] text-white px-6 py-3.5 rounded-xl font-semibold hover:brightness-110 transition-all w-fit uppercase tracking-widest text-[10px] shadow-lg shadow-blue-500/20">
            Abrir Relatório
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
