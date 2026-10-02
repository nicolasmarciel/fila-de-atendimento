import React, { useState, useEffect } from 'react';
import { useQueue } from '../context/QueueContext';
import { Ticket } from '../types/queue';
import { TransferModal } from './TransferModal';
import {
  BellRing,
  Play,
  CheckCircle,
  UserX,
  ArrowRightLeft,
  Search,
  Filter,
  Clock,
  User,
  Plus,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export const AttendantPanel: React.FC = () => {
  const {
    tickets,
    counters,
    categories,
    selectedCounterId,
    setSelectedCounterId,
    callNextTicket,
    callSpecificTicket,
    recallTicket,
    startService,
    finishService,
    markNoShow,
    transferTicket,
    updateCounter,
    createTicket,
  } = useQueue();

  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [completionNotes, setCompletionNotes] = useState<string>('');
  const [ticketToTransfer, setTicketToTransfer] = useState<Ticket | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);
  const [manualCat, setManualCat] = useState<string>('SP');
  const [manualName, setManualName] = useState<string>('');
  const [manualDoc, setManualDoc] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // Tick timer every second for live elapsed wait and service calculations
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const activeCounter = counters.find((c) => c.id === selectedCounterId) || counters[0];

  // Find the ticket currently being handled by this counter
  const currentTicket = tickets.find(
    (t) =>
      t.counterId === activeCounter?.id &&
      (t.status === 'called' || t.status === 'in_service')
  );

  const formatElapsed = (startTimestamp?: number) => {
    if (!startTimestamp) return '00:00';
    const elapsedSeconds = Math.max(0, Math.floor((currentTime - startTimestamp) / 1000));
    const mins = Math.floor(elapsedSeconds / 60);
    const secs = elapsedSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Waiting tickets list
  const waitingTickets = tickets
    .filter((t) => t.status === 'waiting')
    .filter((t) => (activeFilter === 'all' ? true : t.categoryCode === activeFilter))
    .filter((t) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        t.displayNumber.toLowerCase().includes(q) ||
        (t.customerName && t.customerName.toLowerCase().includes(q)) ||
        (t.customerDoc && t.customerDoc.includes(q))
      );
    })
    .sort((a, b) => a.createdAt - b.createdAt);

  const handleCallNext = async () => {
    if (activeCounter) {
      await callNextTicket(activeCounter.id);
    }
  };

  const handleFinish = () => {
    if (currentTicket) {
      finishService(currentTicket.id, completionNotes);
      setCompletionNotes('');
    }
  };

  const handleCreateManual = async (e: React.FormEvent) => {
    e.preventDefault();
    await createTicket(manualCat, manualName, manualDoc);
    setManualName('');
    setManualDoc('');
    setIsManualModalOpen(false);
  };

  return (
    <div className="min-h-[calc(100vh-68px)] bg-slate-950 p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Station Selector & Guichê Configuration */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-950/60 border border-indigo-700/40 flex items-center justify-center font-bold text-indigo-400">
            {activeCounter?.number || 1}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <label htmlFor="counter-select" className="text-xs uppercase font-bold text-slate-400">
                Ponto de Atendimento:
              </label>
              <select
                id="counter-select"
                value={selectedCounterId}
                onChange={(e) => setSelectedCounterId(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-sm font-semibold text-white focus:outline-none focus:border-indigo-500"
              >
                {counters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.attendantName})
                  </option>
                ))}
              </select>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Operador logado: <span className="text-slate-300 font-medium">{activeCounter?.attendantName}</span>
              {activeCounter?.room && <span> • {activeCounter.room}</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status badge & pause toggle */}
          <button
            onClick={() =>
              updateCounter(activeCounter.id, {
                status: activeCounter.status === 'paused' ? 'available' : 'paused',
              })
            }
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
              activeCounter.status === 'paused'
                ? 'bg-amber-950/40 border-amber-800 text-amber-300'
                : 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
            }`}
          >
            {activeCounter.status === 'paused' ? 'Guichê em Pausa' : 'Guichê Disponível'}
          </button>

          {/* New manual ticket button */}
          <button
            onClick={() => setIsManualModalOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-400" />
            <span>Gerar Senha Manual</span>
          </button>
        </div>
      </div>

      {/* Main Attendant Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Active Ticket & Controls (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                  Atendimento em Curso
                </span>
                {currentTicket && (
                  <span
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                      currentTicket.status === 'in_service'
                        ? 'bg-emerald-900/40 text-emerald-400 border-emerald-700/50'
                        : 'bg-amber-900/40 text-amber-400 border-amber-700/50'
                    }`}
                  >
                    {currentTicket.status === 'in_service' ? 'Em Atendimento' : 'Chamada Realizada'}
                  </span>
                )}
              </div>

              {currentTicket ? (
                <div className="py-6 space-y-4">
                  {/* Big Ticket Display */}
                  <div className="text-center">
                    <span className="font-mono text-5xl sm:text-6xl font-black text-white tracking-tight tabular-nums block">
                      {currentTicket.displayNumber}
                    </span>
                    <span className="inline-block mt-2 text-xs font-semibold px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-slate-300">
                      {currentTicket.categoryName}
                    </span>
                  </div>

                  {/* Customer Information */}
                  {currentTicket.customerName && (
                    <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 mb-0.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>Nome do Cidadão / Paciente</span>
                      </div>
                      <div className="font-semibold text-slate-200 text-sm">
                        {currentTicket.customerName}
                      </div>
                      {currentTicket.customerDoc && (
                        <div className="font-mono text-xs text-slate-500 mt-0.5">
                          {currentTicket.customerDoc}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Service stopwatch timer */}
                  <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex items-center justify-around text-center">
                    <div>
                      <span className="text-[11px] uppercase text-slate-500 block">Tempo de Espera</span>
                      <span className="font-mono text-sm font-bold text-slate-300 tabular-nums">
                        {Math.round(((currentTicket.calledAt || currentTime) - currentTicket.createdAt) / 60000)} min
                      </span>
                    </div>
                    <div className="h-6 w-px bg-slate-800" />
                    <div>
                      <span className="text-[11px] uppercase text-slate-500 block">Duração no Guichê</span>
                      <span className="font-mono text-sm font-bold text-emerald-400 tabular-nums">
                        {formatElapsed(currentTicket.serviceStartedAt || currentTicket.calledAt)}
                      </span>
                    </div>
                    <div className="h-6 w-px bg-slate-800" />
                    <div>
                      <span className="text-[11px] uppercase text-slate-500 block">Chamadas</span>
                      <span className="font-mono text-sm font-bold text-amber-400 tabular-nums">
                        #{currentTicket.callCount}
                      </span>
                    </div>
                  </div>

                  {/* Optional notes for completion */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      Observações de Encerramento (Opcional)
                    </label>
                    <input
                      type="text"
                      value={completionNotes}
                      onChange={(e) => setCompletionNotes(e.target.value)}
                      placeholder="Ex: Documentação conferida, certidão entregue"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-500">
                  <Clock className="w-12 h-12 mx-auto mb-3 text-slate-700" />
                  <p className="font-semibold text-slate-300 text-base">Nenhum atendimento ativo</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    Clique no botão abaixo para chamar o próximo cliente prioritário ou convencional da fila.
                  </p>
                </div>
              )}
            </div>

            {/* Operator Primary Action Buttons */}
            <div className="pt-4 border-t border-slate-800 space-y-2.5">
              {!currentTicket ? (
                <button
                  onClick={handleCallNext}
                  className="w-full py-4 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/50 transition-all active:scale-[0.99]"
                >
                  <BellRing className="w-5 h-5 text-amber-300" />
                  <span>Chamar Próximo da Fila</span>
                </button>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2.5">
                    {currentTicket.status === 'called' ? (
                      <button
                        onClick={() => startService(currentTicket.id)}
                        className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        <span>Iniciar Atendimento</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleFinish}
                        className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Concluir</span>
                      </button>
                    )}

                    <button
                      onClick={() => recallTicket(currentTicket.id)}
                      className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-900/40 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <BellRing className="w-4 h-4" />
                      <span>Chamar Novamente</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <button
                      onClick={() => markNoShow(currentTicket.id)}
                      className="py-2.5 px-3 rounded-xl bg-slate-950 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-900/60 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      <span>Não Compareceu</span>
                    </button>

                    <button
                      onClick={() => setTicketToTransfer(currentTicket)}
                      className="py-2.5 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>Transferir Fila</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Waiting Queue Management Table (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col">
          {/* Queue Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Fila de Espera</span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300">
                  {waitingTickets.length} pessoas
                </span>
              </h2>
            </div>

            {/* Live Search input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por senha, nome..."
                className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 w-full sm:w-56"
              />
            </div>
          </div>

          {/* Segmented Filter Buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl mb-4 overflow-x-auto">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                activeFilter === 'all'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Todas ({tickets.filter((t) => t.status === 'waiting').length})
            </button>
            {categories.map((cat) => {
              const count = tickets.filter(
                (t) => t.status === 'waiting' && t.categoryCode === cat.code
              ).length;
              return (
                <button
                  key={cat.code}
                  onClick={() => setActiveFilter(cat.code)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    activeFilter === cat.code
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  [{cat.code}] {cat.badge} ({count})
                </button>
              );
            })}
          </div>

          {/* Table of Waiting Tickets */}
          <div className="flex-1 overflow-x-auto min-h-[300px]">
            {waitingTickets.length > 0 ? (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Senha</th>
                    <th className="py-2.5 px-3">Categoria</th>
                    <th className="py-2.5 px-3">Identificação</th>
                    <th className="py-2.5 px-3">Espera</th>
                    <th className="py-2.5 px-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {waitingTickets.map((ticket, index) => {
                    const waitMin = Math.round((currentTime - ticket.createdAt) / 60000);
                    const isOverTarget =
                      waitMin >
                      (categories.find((c) => c.code === ticket.categoryCode)?.targetWaitMinutes || 20);

                    return (
                      <tr
                        key={ticket.id}
                        className="hover:bg-slate-950/60 transition-colors group"
                      >
                        <td className="py-3 px-3">
                          <span className="font-mono text-sm font-bold text-white tabular-nums">
                            {ticket.displayNumber}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-block font-medium px-2 py-0.5 rounded text-[11px] border ${
                              ticket.categoryCode === 'SP'
                                ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/40'
                                : ticket.categoryCode === 'SE'
                                ? 'bg-amber-950/50 text-amber-300 border-amber-800/40'
                                : ticket.categoryCode === 'SC'
                                ? 'bg-violet-950/50 text-violet-300 border-violet-800/40'
                                : 'bg-blue-950/50 text-blue-300 border-blue-800/40'
                            }`}
                          >
                            {ticket.categoryName}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {ticket.customerName ? (
                            <div>
                              <span className="text-slate-200 font-medium block truncate max-w-[150px]">
                                {ticket.customerName}
                              </span>
                              {ticket.customerDoc && (
                                <span className="font-mono text-[10px] text-slate-500">
                                  {ticket.customerDoc}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-600 italic">Não identificado</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`font-mono tabular-nums font-semibold flex items-center gap-1 ${
                              isOverTarget ? 'text-rose-400' : 'text-slate-300'
                            }`}
                          >
                            {waitMin} min
                            {isOverTarget && (
                              <span title="Acima da meta de SLA" className="inline-flex">
                                <AlertCircle className="w-3 h-3 text-rose-400 shrink-0" />
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => callSpecificTicket(ticket.id, activeCounter.id)}
                            className="px-3 py-1 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white font-medium text-[11px] transition-colors"
                          >
                            Chamar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
                <Sparkles className="w-10 h-10 text-slate-700 mb-2" />
                <p className="text-sm font-medium text-slate-400">
                  {searchQuery ? 'Nenhum resultado para a busca' : 'Fila vazia no momento'}
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  Novas senhas emitidas no totem aparecerão automaticamente aqui.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Manual Ticket Creation Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">Gerar Senha Manual no Guichê</h3>
            <form onSubmit={handleCreateManual} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Categoria de Atendimento
                </label>
                <select
                  value={manualCat}
                  onChange={(e) => setManualCat(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  {categories.map((c) => (
                    <option key={c.code} value={c.code}>
                      [{c.code}] {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome do Cidadão (Opcional)
                </label>
                <input
                  type="text"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="Nome completo"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  CPF ou Documento (Opcional)
                </label>
                <input
                  type="text"
                  value={manualDoc}
                  onChange={(e) => setManualDoc(e.target.value)}
                  placeholder="000.000.000-00"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-lg"
                >
                  Emitir e Enfileirar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Ticket Modal */}
      {ticketToTransfer && (
        <TransferModal
          ticket={ticketToTransfer}
          categories={categories}
          counters={counters}
          onConfirm={(targetCat, targetCnt) => {
            transferTicket(ticketToTransfer.id, targetCat, targetCnt);
            setTicketToTransfer(null);
          }}
          onClose={() => setTicketToTransfer(null)}
        />
      )}
    </div>
  );
};
