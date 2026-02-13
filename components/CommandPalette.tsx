
import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Patient } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  onSelectPatient: (id: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ 
  isOpen, 
  onClose, 
  patients,
  onSelectPatient 
}) => {
  const [query, setQuery] = useState('');
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filtered = patients.filter(p => 
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.cpf.includes(query)
  );

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-start justify-center pt-32 px-4" onClick={onClose}>
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-4 bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm">
            <Search size={20} className="text-slate-400" />
            <input
              type="text"
              placeholder="Buscar paciente por nome ou CPF..."
              className="bg-transparent border-none outline-none text-base w-full font-medium text-slate-700"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            <kbd className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-400 border border-slate-200">ESC</kbd>
          </div>
        </div>
        
        <div className="max-h-[400px] overflow-y-auto p-4 custom-scrollbar">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Search size={48} className="mx-auto mb-4 opacity-10" />
              <p className="text-sm font-medium">Nenhum registro encontrado</p>
            </div>
          ) : (
            <div className="grid gap-2">
              {filtered.slice(0, 8).map((patient) => (
                <button
                  key={patient.id}
                  onClick={() => {
                    onSelectPatient(patient.id);
                    onClose();
                  }}
                  className="w-full flex items-center gap-4 p-4 hover:bg-blue-50 rounded-2xl transition-all group text-left border border-transparent hover:border-blue-100"
                >
                  <div className="w-12 h-12 bg-[#00A3FF] rounded-xl flex items-center justify-center text-white font-bold text-lg">
                    {patient.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800 group-hover:text-[#00A3FF]">{patient.name}</p>
                    <p className="text-xs text-slate-400 font-medium">{patient.cpf} • {patient.insurance}</p>
                  </div>
                  {patient.isUrgent && (
                    <div className="bg-red-50 text-red-600 px-3 py-1 rounded-lg text-[10px] font-bold border border-red-100">
                      URGENTE
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
