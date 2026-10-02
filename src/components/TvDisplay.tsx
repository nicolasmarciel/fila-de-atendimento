import React, { useState, useEffect } from 'react';
import { useQueue } from '../context/QueueContext';
import {
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Clock,
  Sparkles,
  Users,
  BellRing,
} from 'lucide-react';

export const TvDisplay: React.FC = () => {
  const {
    activeCall,
    callHistory,
    isCallFlashing,
    settings,
    updateSettings,
    metrics,
    playTestChime,
    categories,
  } = useQueue();

  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  const formattedDate = currentTime.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const formattedTime = currentTime.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  // Recent history excluding the active call
  const recentCalls = callHistory
    .filter((call) => !activeCall || call.id !== activeCall.id)
    .slice(0, 4);

  return (
    <div className="relative min-h-[calc(100vh-68px)] bg-slate-950 text-slate-100 flex flex-col justify-between overflow-hidden select-none">
      {/* Visual Flash effect when a call happens */}
      {isCallFlashing && (
        <div className="absolute inset-0 pointer-events-none z-40 bg-amber-400/10 border-4 border-amber-400 animate-pulse" />
      )}

      {/* Top Header of TV Display */}
      <header className="px-6 py-4 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              {settings.businessName}
            </h1>
            <span className="text-xs text-slate-400">{settings.unitName}</span>
          </div>
        </div>

        {/* Center Clock */}
        <div className="hidden md:flex flex-col items-center">
          <div className="font-mono text-2xl font-bold tracking-tight text-slate-100 tabular-nums">
            {formattedTime}
          </div>
          <div className="text-xs text-slate-400 capitalize">{formattedDate}</div>
        </div>

        {/* TV Quick Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
            className={`p-2 rounded-lg border transition-colors ${
              settings.soundEnabled
                ? 'bg-slate-800/80 border-slate-700 text-emerald-400 hover:bg-slate-700'
                : 'bg-rose-950/40 border-rose-800/60 text-rose-400 hover:bg-rose-900/50'
            }`}
            title={settings.soundEnabled ? 'Áudio ativado' : 'Áudio mudo'}
          >
            {settings.soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          <button
            onClick={playTestChime}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-xs text-slate-300 transition-colors"
            title="Testar sinal sonoro de chamada"
          >
            <BellRing className="w-4 h-4 text-amber-400" />
            <span>Testar Som</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Tela cheia"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Main Waiting Display Viewport */}
      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch max-w-[1700px] w-full mx-auto">
        {/* Dominant Visual Anchor: The Current Active Call Box (8 cols) */}
        <div className="lg:col-span-8 flex flex-col">
          <div
            className={`flex-1 rounded-3xl p-8 sm:p-12 flex flex-col justify-between relative overflow-hidden transition-all duration-300 border ${
              isCallFlashing
                ? 'bg-gradient-to-br from-amber-950/60 via-slate-900 to-slate-950 border-amber-400 shadow-2xl shadow-amber-500/20 scale-[1.008]'
                : activeCall?.ticket.categoryCode === 'SP'
                ? 'bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border-emerald-500/40 shadow-xl'
                : 'bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border-slate-800 shadow-xl'
            }`}
          >
            {/* Top Indicator badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-widest font-bold text-amber-400">
                  {isCallFlashing ? 'Chamando Agora' : 'Última Senha Chamada'}
                </span>
                {activeCall?.recalled && (
                  <span className="text-xs text-amber-300/80 font-mono">
                    (Rechamada #{activeCall.ticket.callCount})
                  </span>
                )}
              </div>

              {activeCall && (
                <div
                  className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                    activeCall.ticket.categoryCode === 'SP'
                      ? 'bg-emerald-900/40 text-emerald-300 border-emerald-600/40'
                      : activeCall.ticket.categoryCode === 'SE'
                      ? 'bg-amber-900/40 text-amber-300 border-amber-600/40'
                      : activeCall.ticket.categoryCode === 'SC'
                      ? 'bg-violet-900/40 text-violet-300 border-violet-600/40'
                      : 'bg-blue-900/40 text-blue-300 border-blue-600/40'
                  }`}
                >
                  {activeCall.ticket.categoryName}
                </div>
              )}
            </div>

            {/* Giant Ticket Display */}
            {activeCall ? (
              <div className="py-6 sm:py-10 text-center flex flex-col items-center justify-center">
                <div className="text-xs sm:text-sm font-semibold text-slate-400 uppercase tracking-widest mb-2">
                  Senha de Atendimento
                </div>
                <div
                  className={`font-mono text-7xl sm:text-9xl font-black tracking-tight tabular-nums transition-transform ${
                    isCallFlashing ? 'scale-105 text-amber-300' : 'text-white'
                  }`}
                >
                  {activeCall.ticket.displayNumber}
                </div>

                {activeCall.ticket.customerName && (
                  <div className="mt-4 text-base sm:text-xl font-medium text-slate-300">
                    {activeCall.ticket.customerName}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-16 text-center flex flex-col items-center justify-center text-slate-500">
                <Sparkles className="w-12 h-12 mb-3 text-slate-600" />
                <p className="text-lg font-medium text-slate-400">Aguardando primeira chamada de guichê</p>
                <p className="text-xs text-slate-600 mt-1">As senhas chamadas serão exibidas aqui</p>
              </div>
            )}

            {/* Counter Destination Target */}
            {activeCall && (
              <div className="border-t border-slate-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-950/40 -mx-8 -mb-8 sm:-mx-12 sm:-mb-12 p-6 sm:px-12">
                <div>
                  <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block">
                    Dirija-se ao Local:
                  </span>
                  <span className="text-2xl sm:text-4xl font-extrabold text-amber-400 tracking-tight">
                    {activeCall.counterName}
                  </span>
                </div>

                {activeCall.room && (
                  <div className="text-right">
                    <span className="text-xs text-slate-400 uppercase tracking-wider block">Setor / Sala</span>
                    <span className="text-base sm:text-lg font-semibold text-slate-200">{activeCall.room}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: History of Previous Calls & Waiting Stats (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Recent Calls List */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 flex-1 flex flex-col">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center justify-between">
              <span>Chamadas Anteriores</span>
              <Clock className="w-4 h-4 text-slate-500" />
            </h2>

            <div className="space-y-3 flex-1">
              {recentCalls.length > 0 ? (
                recentCalls.map((call) => (
                  <div
                    key={call.id}
                    className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between hover:border-slate-700 transition-colors"
                  >
                    <div>
                      <div className="font-mono text-2xl font-bold text-white tracking-tight tabular-nums">
                        {call.ticket.displayNumber}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 truncate max-w-[150px]">
                        {call.ticket.categoryName}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-amber-400">{call.counterName}</div>
                      <div className="text-[11px] font-mono text-slate-500 tabular-nums">
                        {new Date(call.timestamp).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-500 p-6 text-center">
                  Nenhuma chamada anterior registrada hoje
                </div>
              )}
            </div>
          </div>

          {/* Current Waiting Overview */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-500" /> Fila Atual na Recepção
              </span>
              <span className="font-mono text-xs font-bold text-emerald-400">
                {metrics.waitingTotal} aguardando
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {categories.map((cat) => {
                const count = metrics.waitingByCategory[cat.code] || 0;
                return (
                  <div
                    key={cat.code}
                    className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex justify-between items-center"
                  >
                    <span className="text-slate-400 font-medium truncate pr-1">[{cat.code}] {cat.badge}</span>
                    <span className="font-mono font-bold text-slate-200 tabular-nums">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Ticker / Information Banner */}
      <footer className="px-6 py-3.5 bg-slate-900 border-t border-slate-800 flex items-center gap-4 text-xs text-slate-300 overflow-hidden">
        <div className="flex items-center gap-1.5 text-amber-400 font-bold uppercase tracking-wider shrink-0">
          <span>Informativo</span>
          <span>•</span>
        </div>
        <div className="truncate flex-1 font-medium">
          {settings.tvBannerMessage}
        </div>
        <div className="hidden sm:flex items-center gap-3 text-slate-500 text-[11px] shrink-0 font-mono">
          <span>FilaExpress TV</span>
          <span>•</span>
          <span>Atualização em tempo real</span>
        </div>
      </footer>
    </div>
  );
};
