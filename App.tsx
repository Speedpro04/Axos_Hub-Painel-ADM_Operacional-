import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Kanban,
  Bell,
  Search,
  Menu,
  LogOut
} from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { useAxosStore } from './store';
import DashboardView from './components/DashboardView';
import KanbanView from './components/KanbanView';
import PatientListView from './components/PatientListView';
import PatientDetailView from './components/PatientDetailView';
import AgendaView from './components/AgendaView';
import { CommandPalette } from './components/CommandPalette';
import LoginPage from './components/LoginPage';
import { AuthUser, onAuthStateChange, logout } from './services/auth';
import { mockAppointments } from './mockData';

const SolaraLogo: React.FC<{ collapsed?: boolean }> = ({ collapsed }) => (
  <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-4'} transition-all duration-300 font-inter`}>
    <div className="relative w-12 h-10 shrink-0">
      <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full filter drop-shadow-[0_0_8px_rgba(0,163,255,0.4)]" aria-hidden="true">
        <path d="M15 20L45 50L15 80H35L55 60L75 80H95L65 50L95 20H75L55 40L35 20H15Z" fill="url(#metal_gradient)" />
        <path d="M10 70C5 50 15 20 100 35" stroke="url(#blue_swoosh)" strokeWidth="5" strokeLinecap="round" />
        <defs>
          <linearGradient id="metal_gradient" x1="15" y1="20" x2="95" y2="80" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset="0.5" stopColor="#94A3B8" />
            <stop offset="1" stopColor="#475569" />
          </linearGradient>
          <linearGradient id="blue_swoosh" x1="10" y1="70" x2="100" y2="35" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#00A3FF" stopOpacity="0" />
            <stop offset="0.6" stopColor="#00A3FF" />
            <stop offset="1" stopColor="#60E0FF" />
          </linearGradient>
        </defs>
      </svg>
    </div>
    {!collapsed && (
      <div className="flex font-semibold tracking-tight text-2xl leading-none">
        <span className="text-[#F1F5F9]">SOLARA</span>
        <span className="text-[#00A3FF] ml-1.5">CONNECT</span>
      </div>
    )}
  </div>
);

const App: React.FC = () => {
  const {
    activeTab, setActiveTab,
    isSidebarOpen, setSidebarOpen,
    patients,
    selectedPatientId, setSelectedPatientId,
    updatePatientStatus, updatePatient,
    isLoading, loadCustomers
  } = useAxosStore();

  const [authenticated, setAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Auth listener
  useEffect(() => {
    const { data } = onAuthStateChange((user) => {
      setAuthenticated(!!user);
      setCurrentUser(user);
      if (user) loadCustomers();
    });

    // Cleanup
    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Command palette keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = async () => {
    await logout();
    setAuthenticated(false);
    setCurrentUser(null);
  };

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  const renderView = () => {
    if (selectedPatientId && selectedPatient) {
      return (
        <PatientDetailView
          patient={selectedPatient}
          onBack={() => setSelectedPatientId(null)}
          onUpdate={updatePatient}
        />
      );
    }
    switch (activeTab) {
      case 'dashboard': return <DashboardView patients={patients} onOpenPatient={setSelectedPatientId} />;
      case 'kanban': return <KanbanView patients={patients} onUpdateStatus={updatePatientStatus} onOpenPatient={setSelectedPatientId} />;
      case 'patients': return (
        <PatientListView
          patients={patients.filter(p => p.name.toLowerCase().includes(debouncedQuery.toLowerCase()) || p.cpf.includes(debouncedQuery))}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onOpenPatient={setSelectedPatientId}
        />
      );
      case 'agenda': return <AgendaView appointments={mockAppointments} />;
    }
  };

  // Se nao autenticado, mostra pagina de login
  if (!authenticated) {
    return <LoginPage onLogin={(user) => {
      setAuthenticated(true);
      setCurrentUser(user);
    }} />;
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-inter text-slate-900">
      <Toaster position="top-right" />
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        patients={patients}
        onSelectPatient={setSelectedPatientId}
      />

      <aside
        className={`${isSidebarOpen ? 'w-72' : 'w-24'} premium-gradient text-white transition-all duration-500 flex flex-col z-50 border-r border-white/5`}
        aria-label="Menu principal"
      >
        <div className="p-8 h-28 flex items-center overflow-hidden">
          <SolaraLogo collapsed={!isSidebarOpen} />
        </div>
        <nav className="flex-1 mt-6 px-5 space-y-3">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Resumo Clínica' },
            { id: 'kanban', icon: Kanban, label: 'Fluxo Atendimento' },
            { id: 'patients', icon: Users, label: 'Pacientes' },
            { id: 'agenda', icon: Calendar, label: 'Agenda Médica' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              aria-label={item.label}
              className={`w-full flex items-center gap-4 p-4.5 rounded-[22px] transition-all group ${
                activeTab === item.id ? 'bg-[#00A3FF] text-white shadow-xl shadow-blue-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon size={22} className={activeTab === item.id ? 'text-white' : 'text-slate-500 group-hover:text-[#00A3FF]'} />
              {isSidebarOpen && <span className="font-semibold text-sm uppercase tracking-wider">{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-8 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 p-4 text-slate-500 hover:text-red-400 transition-all font-semibold uppercase text-xs tracking-widest"
            aria-label="Sair do sistema"
          >
            <LogOut size={22} />
            {isSidebarOpen && <span>Encerrar Painel</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden bg-[#F8FAFC]">
        <header className="h-28 bg-white border-b border-slate-200 px-12 flex items-center justify-between shadow-sm z-40">
          <div className="flex items-center gap-8">
            <button
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              aria-label="Recolher menu"
              className="p-3 hover:bg-slate-50 rounded-xl text-slate-400 border border-slate-200 transition-all hover:border-[#00A3FF]"
            >
              <Menu size={24} />
            </button>
            <div
              onClick={() => setIsCommandPaletteOpen(true)}
              className="hidden lg:flex items-center bg-slate-50 px-6 py-3.5 rounded-[22px] w-[500px] gap-4 border border-slate-200 hover:border-[#00A3FF] cursor-text transition-all group"
            >
              <Search size={20} className="text-slate-400 group-hover:text-[#00A3FF]" />
              <span className="text-sm font-medium text-slate-400 w-full">Pesquisar... (⌘+K)</span>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <button className="relative p-3 text-slate-400 hover:text-[#00A3FF] transition-all" aria-label="Notificações">
              <Bell size={24} />
              <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-10 w-px bg-slate-200"></div>
            <div className="flex items-center gap-4 cursor-pointer group">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-900 group-hover:text-[#00A3FF] transition-colors">{currentUser?.nome || 'Administração'}</p>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mt-0.5">Gestão Central Solara</p>
              </div>
              <div className="w-12 h-12 bg-[#2D3436] rounded-[18px] flex items-center justify-center text-white font-bold shadow-lg border-2 border-white">
                {currentUser?.nome?.charAt(0)?.toUpperCase() || 'SC'}
              </div>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-12 h-12 border-3 border-[#00A3FF]/20 border-t-[#00A3FF] rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-400 text-sm font-medium">Carregando dados...</p>
              </div>
            </div>
          ) : renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;
