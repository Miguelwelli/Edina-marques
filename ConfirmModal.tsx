import React from 'react';
import { Send, X, Clock, Users, ShieldAlert } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  recipientCount: number;
  message: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  recipientCount,
  message,
}) => {
  if (!isOpen) return null;

  // Média de ~7.5 segundos por mensagem (intervalo de 5 a 10s)
  const avgSeconds = recipientCount * 7.5;
  const estimatedMinutes = Math.max(1, Math.ceil(avgSeconds / 60));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-xl overflow-hidden animate-fade-in my-auto min-w-0">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3 text-slate-900 font-bold text-lg">
            <div className="w-9 h-9 rounded-xl bg-[#E9D5FF] text-[#6B21A8] flex items-center justify-center">
              <Send className="w-5 h-5" />
            </div>
            <span>Confirmar envio da mensagem</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-6 space-y-5 text-base text-slate-700">
          <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-[#6B21A8]" />
                Total de pessoas que vão receber:
              </span>
              <strong className="text-slate-900 font-bold text-base">
                {recipientCount} contatos
              </strong>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-600 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#6B21A8]" />
                Tempo estimado:
              </span>
              <strong className="text-slate-900 font-bold text-base">
                Cerca de {estimatedMinutes} {estimatedMinutes === 1 ? 'minuto' : 'minutos'}
              </strong>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-600 text-sm flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#6B21A8]" />
                Pausa de segurança:
              </span>
              <span className="text-slate-800 text-sm font-semibold">
                5 a 10 segundos entre mensagens
              </span>
            </div>
          </div>

          {/* Prévia da Mensagem */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Mensagem que será enviada:
            </label>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm text-slate-800 max-h-36 overflow-y-auto leading-relaxed whitespace-pre-wrap">
              {message}
            </div>
          </div>
        </div>

        {/* Rodapé com botões de texto por extenso */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 flex-wrap">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Voltar e revisar
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onConfirm();
            }}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-[#6B21A8] hover:bg-[#581c87] transition-colors shadow-sm cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Sim, iniciar envio</span>
          </button>
        </div>
      </div>
    </div>
  );
};
