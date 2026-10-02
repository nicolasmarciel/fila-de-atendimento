import React, { useState } from 'react';
import { useQueue } from '../context/QueueContext';
import { PriorityStrategy } from '../types/queue';
import {
  BarChart3,
  Settings,
  Volume2,
  Sliders,
  RotateCcw,
  Download,
  Building,
  CheckCircle2,
  Clock,
  Users,
  UserX,
  Sparkles,
  VolumeX,
} from 'lucide-react';

export const AdminMetrics: React.FC = () => {
  const {
    metrics,
    tickets,
    counters,
    categories,
    settings,
    updateSettings,
    resetQueueDay,
    loadScenario,
    playTestChime,
  } = useQueue();

  const [activeTab, setActiveTab] = useState<'metrics' | 'settings'>('metrics');
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setSuccessNotice(msg);
    setTimeout(() => setSuccessNotice(null), 3500);
  };

  const handleExportCSV = () => {
    const headers = [
      'Senha',
      'Categoria',
      'Prioridade',
      'Cliente',
      'Documento',
      'Status',
      'CriadoEm',
      'ChamadoEm',
      'ConcluidoEm',
      'Guiche',
      'Atendente',
      'Observacoes',
    ];

    const rows = tickets.map((t) => [
      t.displayNumber,
      `"${t.categoryName}"`,
      t.priorityType,
      `"${t.customerName || ''}"`,
      `"${t.customerDoc || ''}"`,
      t.status,
      new Date(t.createdAt).toISOString(),
      t.calledAt ? new Date(t.calledAt).toISOString() : '',
      t.completedAt ? new Date(t.completedAt).toISOString() : '',
      `"${t.counterName || ''}"`,
      `"${t.attendantName || ''}"`,
      `"${t.notes || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_fila_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification('Relatório CSV baixado com sucesso!');
  };

  return (
    <div className="min-h-[calc(100vh-68px)] bg-slate-950 p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner and Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Gestão & Indicadores de Atendimento
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitoramento em tempo real, auditoria de SLA e configurações do sistema.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            onClick={() => setActiveTab('metrics')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'metrics'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Métricas e Desempenho</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'settings'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Configurações & Voz</span>
          </button>
        </div>
      </div>

      {successNotice && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* METRICS VIEW */}
      {activeTab === 'metrics' && (
        <div className="space-y-6">
          {/* Top KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <span className="text-xs text-slate-400 flex items-center justify-between font-medium">
                <span>Aguardando na Fila</span>
                <Users className="w-4 h-4 text-indigo-400" />
              </span>
              <div className="mt-2 font-mono text-3xl font-black text-white tabular-nums">
                {metrics.waitingTotal}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">Em espera no totem</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <span className="text-xs text-slate-400 flex items-center justify-between font-medium">
                <span>Atendidos Hoje</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </span>
              <div className="mt-2 font-mono text-3xl font-black text-emerald-400 tabular-nums">
                {metrics.completedToday}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">Concluídos com sucesso</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <span className="text-xs text-slate-400 flex items-center justify-between font-medium">
                <span>Tempo Médio Espera</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </span>
              <div className="mt-2 font-mono text-3xl font-black text-white tabular-nums">
                {metrics.avgWaitMinutes} <span className="text-base font-normal text-slate-400">min</span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">Meta geral: 20 min</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <span className="text-xs text-slate-400 flex items-center justify-between font-medium">
                <span>Duração no Guichê</span>
                <Clock className="w-4 h-4 text-blue-400" />
              </span>
              <div className="mt-2 font-mono text-3xl font-black text-white tabular-nums">
                {metrics.avgServiceMinutes} <span className="text-base font-normal text-slate-400">min</span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">Média por atendimento</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <span className="text-xs text-slate-400 flex items-center justify-between font-medium">
                <span>Não Compareceram</span>
                <UserX className="w-4 h-4 text-rose-400" />
              </span>
              <div className="mt-2 font-mono text-3xl font-black text-rose-400 tabular-nums">
                {metrics.noShowCount}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">Ausentes após chamadas</span>
            </div>
          </div>

          {/* Breakdown Grids */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category breakdown */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center justify-between">
                <span>Distribuição por Categoria</span>
                <span className="text-xs text-slate-500 font-normal">Hoje</span>
              </h3>

              <div className="space-y-4">
                {categories.map((cat) => {
                  const catTickets = tickets.filter((t) => t.categoryCode === cat.code);
                  const total = catTickets.length;
                  const completed = catTickets.filter((t) => t.status === 'completed').length;
                  const waiting = catTickets.filter((t) => t.status === 'waiting').length;

                  return (
                    <div key={cat.code} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-200">
                          [{cat.code}] {cat.name}
                        </span>
                        <span className="font-mono text-slate-400 tabular-nums">
                          {total} total • <span className="text-emerald-400">{completed} concl.</span> •{' '}
                          <span className="text-amber-400">{waiting} fila</span>
                        </span>
                      </div>
                      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden flex">
                        <div
                          className="bg-emerald-500 h-full"
                          style={{ width: `${total ? (completed / total) * 100 : 0}%` }}
                        />
                        <div
                          className="bg-amber-500 h-full"
                          style={{ width: `${total ? (waiting / total) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Counter performance */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center justify-between">
                <span>Desempenho dos Guichês / Operadores</span>
                <span className="text-xs text-slate-500 font-normal">Tempo real</span>
              </h3>

              <div className="space-y-3">
                {counters.map((c) => {
                  const attendedByCounter = tickets.filter(
                    (t) => t.counterId === c.id && t.status === 'completed'
                  ).length;
                  const isBusy = c.currentTicketId !== null;

                  return (
                    <div
                      key={c.id}
                      className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-white text-xs flex items-center gap-2">
                          <span>{c.name}</span>
                          <span
                            className={`w-2 h-2 rounded-full ${
                              c.status === 'paused'
                                ? 'bg-amber-500'
                                : isBusy
                                ? 'bg-indigo-500'
                                : 'bg-emerald-500'
                            }`}
                          />
                        </div>
                        <span className="text-[11px] text-slate-400">{c.attendantName}</span>
                      </div>

                      <div className="text-right">
                        <span className="font-mono text-base font-bold text-white tabular-nums">
                          {attendedByCounter}
                        </span>
                        <span className="text-[10px] text-slate-500 block">atendimentos</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-slate-900 border border-slate-800 rounded-2xl">
            <div>
              <span className="text-sm font-bold text-white block">Auditoria & Exportação de Dados</span>
              <span className="text-xs text-slate-400">
                Exporte todo o histórico de chamadas, senhas, tempos e atendentes em formato CSV compatível com Excel.
              </span>
            </div>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors shadow-lg"
            >
              <Download className="w-4 h-4" />
              <span>Exportar Relatório CSV</span>
            </button>
          </div>
        </div>
      )}

      {/* SETTINGS VIEW */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Institutional Settings */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-400" />
              <span>Identidade Visual & Painel</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nome da Empresa / Órgão
              </label>
              <input
                type="text"
                value={settings.businessName}
                onChange={(e) => updateSettings({ businessName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nome da Unidade / Setor
              </label>
              <input
                type="text"
                value={settings.unitName}
                onChange={(e) => updateSettings({ unitName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Mensagem do Letreiro / Banner da TV
              </label>
              <textarea
                rows={2}
                value={settings.tvBannerMessage}
                onChange={(e) => updateSettings({ tvBannerMessage: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Carregar Cenários de Demonstração Rápidos
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    loadScenario('clinica');
                    showNotification('Cenário Clínica Médica carregado!');
                  }}
                  className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 text-left transition-colors"
                >
                  🏥 Clínica Médica
                </button>
                <button
                  type="button"
                  onClick={() => {
                    loadScenario('banco');
                    showNotification('Cenário Agência Financeira carregado!');
                  }}
                  className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 text-left transition-colors"
                >
                  🏦 Banco & Cooperativa
                </button>
                <button
                  type="button"
                  onClick={() => {
                    loadScenario('cartorio');
                    showNotification('Cenário Cartório carregado!');
                  }}
                  className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 text-left transition-colors"
                >
                  ⚖️ Cartório Notarial
                </button>
                <button
                  type="button"
                  onClick={() => {
                    loadScenario('poupatempo');
                    showNotification('Cenário Poupatempo Cidadão carregado!');
                  }}
                  className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 text-left transition-colors"
                >
                  🏛️ Poupatempo / Serviços
                </button>
              </div>
            </div>
          </div>

          {/* Sound & Dispatch Rules */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <span>Regras de Chamada & Sintetizador de Áudio</span>
            </h3>

            {/* Priority Strategy Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Algoritmo de Intercalação de Prioridade (Lei nº 10.048)
              </label>
              <select
                value={settings.priorityStrategy}
                onChange={(e) =>
                  updateSettings({ priorityStrategy: e.target.value as PriorityStrategy })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="ratio_2_1">
                  Proporção 2:1 (2 Prioritários para 1 Geral) - Recomendado
                </option>
                <option value="ratio_3_1">
                  Proporção 3:1 (3 Prioritários para 1 Geral)
                </option>
                <option value="preferential_first">
                  Prioritário Primeiro Estrito (Chama todos SP antes de SG)
                </option>
                <option value="fifo">
                  Ordem de Chegada Simples (FIFO)
                </option>
              </select>
            </div>

            {/* Audio volume and voice toggles */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">Sinal Sonoro (Chime da Recepção)</span>
                <button
                  type="button"
                  onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    settings.soundEnabled
                      ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {settings.soundEnabled ? 'Ativado' : 'Desativado'}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">Voz em Português (Text-to-Speech)</span>
                <button
                  type="button"
                  onClick={() => updateSettings({ voiceEnabled: !settings.voiceEnabled })}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    settings.voiceEnabled
                      ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {settings.voiceEnabled ? 'Ativado' : 'Desativado'}
                </button>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Volume do Sinal</span>
                  <span className="font-mono">{Math.round(settings.chimeVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={settings.chimeVolume}
                  onChange={(e) => updateSettings({ chimeVolume: parseFloat(e.target.value) })}
                  className="w-full accent-indigo-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Velocidade da Voz</span>
                  <span className="font-mono">{settings.speechRate.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.2"
                  step="0.05"
                  value={settings.speechRate}
                  onChange={(e) => updateSettings({ speechRate: parseFloat(e.target.value) })}
                  className="w-full accent-indigo-500"
                />
              </div>

              <button
                type="button"
                onClick={playTestChime}
                className="w-full py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 transition-colors"
              >
                <Volume2 className="w-4 h-4 text-amber-400" />
                <span>Testar Som da Recepção</span>
              </button>
            </div>

            {/* Danger Zone: Reset Queue Day */}
            <div className="pt-4 border-t border-slate-800">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block mb-1">
                Zerar Fila do Dia
              </span>
              <p className="text-[11px] text-slate-500 mb-3">
                Limpa todas as senhas emitidas e reinicia a contagem diária para o dia seguinte.
              </p>
              {!resetConfirmOpen ? (
                <button
                  type="button"
                  onClick={() => setResetConfirmOpen(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900/60 text-xs font-semibold text-rose-300 transition-colors"
                >
                  Reiniciar Senhas do Dia
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      resetQueueDay();
                      setResetConfirmOpen(false);
                      showNotification('Fila diária reiniciada com sucesso!');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
                  >
                    Confirmar e Zerar
                  </button>
                  <button
                    type="button"
                    onClick={() => setResetConfirmOpen(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>

            {/* Architecture Details: Python + Flask + SQLite */}
            <div className="pt-4 border-t border-slate-800">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                    <span>🐍 Backend Ativo: Python 3 + Flask + SQLite</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                    fila.db ONLINE
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  As senhas, guichês, chamadas e métricas são persistidas no banco relacional <code className="text-slate-200 font-mono">fila.db</code> usando transações SQLite nativas e servidas via endpoints REST em Flask.
                </p>
                <div className="text-[10px] text-slate-500 font-mono bg-slate-900 p-2 rounded border border-slate-800">
                  Execução direta no terminal: <span className="text-amber-300">python3 app.py</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
