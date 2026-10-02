import React, { useRef } from 'react';
import { Ticket, ServiceCategory } from '../types/queue';
import { Printer, X, Clock, Users, CheckCircle2, QrCode } from 'lucide-react';

interface TicketModalProps {
  ticket: Ticket | null;
  category?: ServiceCategory;
  businessName: string;
  unitName: string;
  peopleAhead: number;
  estimatedWaitMinutes: number;
  onClose: () => void;
}

export const TicketModal: React.FC<TicketModalProps> = ({
  ticket,
  category,
  businessName,
  unitName,
  peopleAhead,
  estimatedWaitMinutes,
  onClose,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!ticket) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(ticket.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const formattedTime = new Date(ticket.createdAt).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-white text-base">Senha Emitida com Sucesso</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Ticket Receipt Container */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center bg-slate-950/40">
          <div
            ref={receiptRef}
            id="printable-ticket"
            className="w-full max-w-[320px] bg-amber-50 text-slate-900 p-6 rounded-lg shadow-lg border border-amber-200/80 font-sans print:shadow-none print:border-none print:w-full print:max-w-none print:m-0"
          >
            {/* Receipt Header */}
            <div className="text-center border-b border-dashed border-slate-400 pb-3 mb-4">
              <h2 className="font-extrabold text-base tracking-tight text-slate-950 uppercase">{businessName}</h2>
              <p className="text-xs text-slate-600 mt-0.5">{unitName}</p>
              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 font-mono mt-2">
                <span>{formattedDate}</span>
                <span>•</span>
                <span>{formattedTime}</span>
              </div>
            </div>

            {/* Ticket Big Number */}
            <div className="text-center py-2 mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Sua Senha
              </span>
              <div className="font-mono text-5xl font-black tracking-tight text-slate-950">
                {ticket.displayNumber}
              </div>
              <div className="mt-2 text-xs font-semibold text-slate-800">
                {ticket.categoryName}
              </div>
            </div>

            {ticket.customerName && (
              <div className="text-center text-xs text-slate-700 mb-3 bg-white/70 py-1.5 px-3 rounded border border-slate-200">
                <span className="text-[10px] uppercase text-slate-400 block font-medium">Cliente</span>
                <span className="font-semibold text-slate-900">{ticket.customerName}</span>
                {ticket.customerDoc && <span className="block text-[11px] font-mono text-slate-500">{ticket.customerDoc}</span>}
              </div>
            )}

            {/* Queue Details */}
            <div className="border-t border-b border-dashed border-slate-400 py-3 my-2 space-y-1.5 text-xs text-slate-700">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1 text-slate-600">
                  <Users className="w-3.5 h-3.5" /> Pessoas à frente:
                </span>
                <span className="font-mono font-bold text-slate-950">{peopleAhead}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1 text-slate-600">
                  <Clock className="w-3.5 h-3.5" /> Tempo estimado:
                </span>
                <span className="font-mono font-bold text-slate-950">~{estimatedWaitMinutes} min</span>
              </div>
            </div>

            {/* Priority Notice if SP */}
            {ticket.categoryCode === 'SP' && (
              <div className="text-[10px] text-center text-emerald-800 bg-emerald-100/80 p-2 rounded my-2 font-medium">
                Atendimento Prioritário garantido por Lei Federal nº 10.048/2000.
              </div>
            )}

            {/* Barcode & Footer Simulation */}
            <div className="text-center pt-3">
              {/* Simulated barcode */}
              <div className="flex justify-center items-center gap-[2px] h-9 mb-1.5">
                {[2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 1, 2, 3, 1, 2, 1, 3, 2, 1, 4, 2].map((w, idx) => (
                  <div key={idx} className="bg-slate-900 h-full" style={{ width: `${w * 1.5}px` }} />
                ))}
              </div>
              <div className="text-[10px] font-mono text-slate-500 tracking-widest">{ticket.id.slice(0, 16)}</div>
              <p className="text-[10px] text-slate-600 mt-2">
                Acompanhe pelo painel eletrônico de chamadas. Guarde este cupom.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-950/80">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-lg transition-colors"
          >
            Concluir
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors shadow-lg shadow-emerald-950/30"
          >
            <Printer className="w-4 h-4" /> Imprimir Cupom
          </button>
        </div>
      </div>
    </div>
  );
};
