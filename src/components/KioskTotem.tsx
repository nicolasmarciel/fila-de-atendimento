import React, { useState } from 'react';
import { useQueue } from '../context/QueueContext';
import { Ticket, ServiceCategory } from '../types/queue';
import { TicketModal } from './TicketModal';
import {
  HeartPulse,
  Users,
  Zap,
  Briefcase,
  ChevronRight,
  ShieldCheck,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';

export const KioskTotem: React.FC = () => {
  const { categories, createTicket, settings, metrics, tickets } = useQueue();

  const [customerName, setCustomerName] = useState<string>('');
  const [customerDoc, setCustomerDoc] = useState<string>('');
  const [showIdentityForm, setShowIdentityForm] = useState<boolean>(false);
  const [issuedTicket, setIssuedTicket] = useState<Ticket | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'heart-pulse':
        return <HeartPulse className="w-8 h-8 text-emerald-400" />;
      case 'users':
        return <Users className="w-8 h-8 text-blue-400" />;
      case 'zap':
        return <Zap className="w-8 h-8 text-amber-400" />;
      case 'briefcase':
        return <Briefcase className="w-8 h-8 text-violet-400" />;
      default:
        return <Sparkles className="w-8 h-8 text-emerald-400" />;
    }
  };

  const handleIssueTicket = async (category: ServiceCategory) => {
    const ticket = await createTicket(category.code, customerName, customerDoc);
    setIssuedTicket(ticket);
    setSelectedCategory(category);
    // Reset optional fields
    setCustomerName('');
    setCustomerDoc('');
    setShowIdentityForm(false);
  };

  // Calculate people ahead for the newly issued ticket
  const peopleAhead = issuedTicket
    ? tickets.filter(
        (t) =>
          t.status === 'waiting' &&
          t.categoryCode === issuedTicket.categoryCode &&
          t.createdAt < issuedTicket.createdAt
      ).length
    : 0;

  const estimatedMinutes = selectedCategory
    ? Math.max(selectedCategory.targetWaitMinutes, (peopleAhead + 1) * 6)
    : 15;

  return (
    <div className="min-h-[calc(100vh-68px)] bg-slate-950 p-6 md:p-12 flex flex-col justify-between max-w-5xl mx-auto">
      {/* Totem Header */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-medium text-slate-400 mb-3">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Totem de Autoatendimento • Toque na opção desejada</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
          Retire sua Senha de Atendimento
        </h1>
        <p className="text-sm md:text-base text-slate-400 mt-2">
          Bem-vindo ao {settings.businessName}. Selecione o serviço que melhor atende à sua necessidade.
        </p>
      </div>

      {/* Identity Option (Optional identification) */}
      <div className="max-w-2xl mx-auto w-full mb-6">
        <button
          type="button"
          onClick={() => setShowIdentityForm(!showIdentityForm)}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors mx-auto py-1 px-3 rounded-lg hover:bg-slate-900/60"
        >
          <Info className="w-3.5 h-3.5 text-indigo-400" />
          <span>{showIdentityForm ? 'Ocultar identificação opcional' : 'Deseja informar seu nome ou documento na senha? (Opcional)'}</span>
        </button>

        {showIdentityForm && (
          <div className="mt-3 p-4 bg-slate-900/80 border border-slate-800 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Nome Completo (Opcional)
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Ex: João da Silva"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                CPF ou Documento (Opcional)
              </label>
              <input
                type="text"
                value={customerDoc}
                onChange={(e) => setCustomerDoc(e.target.value)}
                placeholder="000.000.000-00"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>
        )}
      </div>

      {/* Category Cards Grid (Touch Kiosk) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 flex-1 items-stretch">
        {categories.map((cat) => {
          const waitingCount = metrics.waitingByCategory[cat.code] || 0;

          return (
            <button
              key={cat.id}
              onClick={() => handleIssueTicket(cat)}
              className={`group text-left p-6 sm:p-8 rounded-3xl border transition-all duration-200 flex flex-col justify-between relative overflow-hidden active:scale-[0.98] ${
                cat.code === 'SP'
                  ? 'bg-slate-900/90 border-emerald-500/40 hover:border-emerald-400 hover:shadow-2xl hover:shadow-emerald-950/40'
                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:shadow-xl hover:bg-slate-900'
              }`}
            >
              {/* Category Header */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 group-hover:scale-105 transition-transform">
                    {getIcon(cat.iconName)}
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-mono text-2xl font-black tracking-tight text-white">
                      {cat.code}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {cat.badge}
                    </span>
                  </div>
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-2 group-hover:text-amber-300 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  {cat.description}
                </p>
              </div>

              {/* Category Footer metadata & CTA */}
              <div className="pt-6 mt-4 border-t border-slate-800/60 flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>~{cat.targetWaitMinutes} min</span>
                  </span>
                  <span>•</span>
                  <span className="font-mono text-slate-400">{waitingCount} na fila</span>
                </div>

                <span className="flex items-center gap-1 text-xs font-semibold text-white group-hover:translate-x-1 transition-transform">
                  Emitir Senha <ChevronRight className="w-4 h-4 text-amber-400" />
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Priority Law Notice Footer */}
      <div className="mt-8 text-center border-t border-slate-900 pt-6">
        <p className="text-xs text-slate-500 max-w-xl mx-auto">
          O atendimento prioritário é garantido pela Lei Federal nº 10.048/2000 e Lei nº 14.626/2023. Acompanhe a chamada pelo painel eletrônico ou com o atendente.
        </p>
      </div>

      {/* Ticket Printable Modal */}
      {issuedTicket && (
        <TicketModal
          ticket={issuedTicket}
          category={selectedCategory || undefined}
          businessName={settings.businessName}
          unitName={settings.unitName}
          peopleAhead={peopleAhead}
          estimatedWaitMinutes={estimatedMinutes}
          onClose={() => setIssuedTicket(null)}
        />
      )}
    </div>
  );
};
