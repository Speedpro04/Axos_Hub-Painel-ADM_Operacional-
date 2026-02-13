
import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';

interface AILoadingIndicatorProps {
  message?: string;
  variant?: 'default' | 'compact' | 'inline';
}

export const AILoadingIndicator: React.FC<AILoadingIndicatorProps> = ({ 
  message = 'Processando...', 
  variant = 'default' 
}) => {
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2 text-blue-500 text-xs">
        <Loader2 size={14} className="animate-spin" />
        <span className="font-medium">{message}</span>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="inline-flex items-center gap-2 text-blue-600 text-[10px] font-semibold uppercase tracking-wider">
        <div className="relative w-3 h-3">
          <div className="absolute inset-0 border-2 border-blue-200 rounded-full"></div>
          <div className="absolute inset-0 border-2 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
        {message}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 bg-blue-50 px-4 py-2.5 rounded-xl border border-blue-200 animate-pulse-glow">
      <div className="relative w-5 h-5">
        <div className="absolute inset-0 border-2 border-blue-200 rounded-full"></div>
        <div className="absolute inset-0 border-2 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
      </div>
      <div className="flex items-center gap-2">
        <Sparkles size={14} className="fill-[#00A3FF] text-[#00A3FF]" />
        <span className="text-blue-700 text-xs font-semibold uppercase tracking-wider">{message}</span>
      </div>
    </div>
  );
};

export const ProgressIndicator: React.FC<{ progress: number; message?: string }> = ({ 
  progress, 
  message = 'Processando' 
}) => (
  <div className="w-full">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">{message}</span>
      <span className="text-xs font-bold text-blue-600">{Math.round(progress)}%</span>
    </div>
    <div className="w-full h-2 bg-blue-100 rounded-full overflow-hidden">
      <div 
        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out rounded-full"
        style={{ width: `${progress}%` }}
      />
    </div>
  </div>
);
