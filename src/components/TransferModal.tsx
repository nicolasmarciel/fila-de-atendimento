import React, { useState } from 'react';
import { Ticket, ServiceCategory, Counter } from '../types/queue';
import { ArrowRightLeft, X, Check } from 'lucide-react';

interface TransferModalProps {
  ticket: Ticket;
  categories: ServiceCategory[];
  counters: Counter[];
  onConfirm: (targetCategoryCode: string, targetCounterId?: string) => void;
  onClose: () => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  ticket,
  categories,
  counters,
  onConfirm,
  onClose,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(ticket.categoryCode);
  const [selectedCounter, setSelectedCounter] = useState<string>('');

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(selectedCategory, selectedCounter || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-white text-base">Transferir Atendimento</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleTransfer} className="p-6 space-y-4">
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
            <span className="text-xs text-slate-400">Senha a ser transferida:</span>
            <div className="flex items-center justify-between mt-1">
              <span className="font-mono text-xl font-bold text-white">{ticket.displayNumber}</span>
              <span className="text-xs text-slate-300 font-medium">{ticket.categoryName}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Nova Categoria / Fila de Destino
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
            >
              {categories.map((cat) => (
                <option key={cat.code} value={cat.code}>
                  [{cat.code}] {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Direcionar a um Guichê Específico (Opcional)
            </label>
            <select
              value={selectedCounter}
              onChange={(e) => setSelectedCounter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="">Qualquer Guichê da fila</option>
              {counters.map((cnt) => (
                <option key={cnt.id} value={cnt.id}>
                  {cnt.name} - {cnt.attendantName} ({cnt.status === 'available' ? 'Livre' : 'Ocupado'})
                </option>
              ))}
            </select>
          </div>

          <p className="text-xs text-slate-500">
            A senha retornará ao status "Aguardando" com prioridade de entrada na nova fila.
          </p>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-lg shadow-indigo-950/40"
            >
              <Check className="w-4 h-4" /> Confirmar Transferência
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
