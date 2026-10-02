import React from 'react';
import { useQueue } from '../context/QueueContext';
import {
  Tv,
  UserCheck,
  Ticket as TicketIcon,
  BarChart2,
  Volume2,
  VolumeX,
} from 'lucide-react';

export type ViewMode = 'tv' | 'attendant' | 'kiosk' | 'admin';

interface NavbarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onViewChange }) => {
  const { metrics, settings, updateSettings } = useQueue();

  return (
    <header className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-30">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onViewChange('tv')}
          className="text-lg font-extrabold tracking-tight text-white hover:text-amber-400 transition-colors flex items-center gap-2"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span>FilaExpress</span>
        </button>
      </div>

      {/* Zone 2: 4-6 clean text navigation links / segmented view modes */}
      <nav className="flex items-center gap-1 sm:gap-2">
        <button
          onClick={() => onViewChange('tv')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            currentView === 'tv'
              ? 'bg-amber-400/10 text-amber-400 border border-amber-400/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Tv className="w-3.5 h-3.5" />
          <span>Painel TV</span>
        </button>

        <button
          onClick={() => onViewChange('attendant')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            currentView === 'attendant'
              ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Guichê</span>
        </button>

        <button
          onClick={() => onViewChange('kiosk')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            currentView === 'kiosk'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <TicketIcon className="w-3.5 h-3.5" />
          <span>Totem</span>
        </button>

        <button
          onClick={() => onViewChange('admin')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            currentView === 'admin'
              ? 'bg-violet-500/10 text-violet-400 border border-violet-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Gestão & Métricas</span>
          <span className="md:hidden">Gestão</span>
        </button>
      </nav>

      {/* Zone 3: 1-2 primary actions */}
      <div className="flex items-center gap-3">
        {/* Waiting indicator */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>{metrics.waitingTotal} aguardando</span>
        </div>

        {/* Audio mute quick switch */}
        <button
          onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          title={settings.soundEnabled ? 'Som ativado' : 'Som silenciado'}
        >
          {settings.soundEnabled ? (
            <Volume2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <VolumeX className="w-4 h-4 text-slate-500" />
          )}
        </button>

        {/* Fast Action to emit ticket */}
        <button
          onClick={() => onViewChange('kiosk')}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap shadow-md shadow-amber-950/40"
        >
          <TicketIcon className="w-3.5 h-3.5" />
          <span>Nova Senha</span>
        </button>
      </div>
    </header>
  );
};
