import React from 'react';
import { Send, CheckCheck, Clock, AlertCircle } from 'lucide-react';

interface MessageComposerProps {
  message: string;
  onChangeMessage: (msg: string) => void;
  selectedCount: number;
  totalContactsCount: number;
  onOpenConfirmModal: () => void;
  isSending: boolean;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  message,
  onChangeMessage,
  selectedCount,
  onOpenConfirmModal,
  isSending,
}) => {
  const charCount = message.length;
  const canSend = message.trim().length > 0 && selectedCount > 0 && !isSending;

  // Insert formatting wrapper
  const applyFormat = (wrapper: string) => {
    const textarea = document.getElementById('message-textarea') as HTMLTextAreaElement | null;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = message.substring(start, end);

    const replacement = `${wrapper}${selectedText || 'palavra'}${wrapper}`;
    const newText = message.substring(0, start) + replacement + message.substring(end);
    onChangeMessage(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + wrapper.length,
        end + wrapper.length + (selectedText ? 0 : 7)
      );
    }, 50);
  };

  // Render WhatsApp preview text com formatação real
  const renderPreview = (text: string) => {
    if (!text.trim()) {
      return (
        <span className="text-slate-400 italic">
          O texto digitado aparecerá aqui como se fosse no WhatsApp...
        </span>
      );
    }

    const formatLine = (line: string) => {
      const parts = line.split(/(\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~)/g);
      return parts.map((part, i) => {
        if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
          return <strong key={i} className="font-bold">{part.slice(1, -1)}</strong>;
        }
        if (part.startsWith('_') && part.endsWith('_') && part.length > 2) {
          return <em key={i} className="italic">{part.slice(1, -1)}</em>;
        }
        if (part.startsWith('~') && part.endsWith('~') && part.length > 2) {
          return <del key={i} className="line-through opacity-80">{part.slice(1, -1)}</del>;
        }
        return part;
      });
    };

    return text.split('\n').map((line, idx) => (
      <p key={idx} className="min-h-[1.25rem] break-words">
        {formatLine(line)}
      </p>
    ));
  };

  return (
    <div className="flex flex-col gap-6 w-full min-w-0 max-w-full">
      {/* Card Principal de Composição */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-7 shadow-xs w-full min-w-0 max-w-full overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <label
            htmlFor="message-textarea"
            className="text-base font-bold text-slate-900"
          >
            Escreva a mensagem
          </label>

          {/* Formatação Rápida com texto por extenso */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => applyFormat('*')}
              className="px-2.5 py-1 text-xs font-semibold text-[#6B21A8] bg-purple-50 hover:bg-[#E9D5FF] rounded-lg transition-colors cursor-pointer"
            >
              *Negrito*
            </button>
            <button
              type="button"
              onClick={() => applyFormat('_')}
              className="px-2.5 py-1 text-xs font-semibold text-[#6B21A8] bg-purple-50 hover:bg-[#E9D5FF] rounded-lg transition-colors cursor-pointer"
            >
              _Itálico_
            </button>
            <button
              type="button"
              onClick={() => applyFormat('~')}
              className="px-2.5 py-1 text-xs font-semibold text-[#6B21A8] bg-purple-50 hover:bg-[#E9D5FF] rounded-lg transition-colors cursor-pointer"
            >
              ~Riscado~
            </button>
          </div>
        </div>

        {/* Caixa de Texto - Tamanho 16px para excelente legibilidade */}
        <div className="relative">
          <textarea
            id="message-textarea"
            value={message}
            onChange={(e) => onChangeMessage(e.target.value)}
            disabled={isSending}
            rows={7}
            placeholder="Olá! Digite aqui a mensagem que deseja enviar para os contatos..."
            className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#6B21A8] focus:ring-2 focus:ring-[#E9D5FF] rounded-2xl p-4 text-base text-slate-800 placeholder:text-slate-400 outline-none transition-all resize-y min-h-[160px] leading-relaxed"
          />
        </div>

        {/* Contador de Caracteres */}
        <div className="mt-2.5 flex items-center justify-between text-sm text-slate-500">
          <span>
            <strong className="text-slate-800 font-semibold">{charCount}</strong> caracteres
          </span>
          <span className="text-xs text-slate-400">
            Você pode colar textos longos com emojis
          </span>
        </div>

        {/* Pré-visualização do Balão de WhatsApp */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
            Pré-visualização da mensagem
          </span>

          <div className="p-4 rounded-2xl bg-[#efeae2] border border-slate-200/80">
            <div className="flex justify-end">
              <div className="max-w-[90%] sm:max-w-[80%] bg-[#d9fdd3] text-slate-900 rounded-xl rounded-tr-none px-4 py-2.5 text-base shadow-xs">
                <div className="space-y-1 text-slate-800 leading-relaxed text-[15px]">
                  {renderPreview(message)}
                </div>
                <div className="mt-1 flex items-center justify-end gap-1 text-[11px] text-slate-500">
                  <span>{new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                  <CheckCheck className="w-4 h-4 text-[#53bdeb]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botão Principal de Envio com Texto Escrito e Roxo #6B21A8 */}
        <div className="mt-6">
          <button
            type="button"
            onClick={onOpenConfirmModal}
            disabled={!canSend}
            className={`w-full py-4 px-6 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-sm ${
              canSend
                ? 'bg-[#6B21A8] hover:bg-[#581c87] text-white shadow-purple-900/10'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
            }`}
          >
            <Send className="w-5 h-5" />
            <span>
              {selectedCount === 0
                ? 'Selecione os contatos para enviar'
                : `Enviar mensagem para ${selectedCount} ${
                    selectedCount === 1 ? 'contato selecionado' : 'contatos selecionados'
                  }`}
            </span>
          </button>

          {!canSend && !isSending && (
            <div className="mt-3 flex items-center justify-center gap-1.5 text-sm text-slate-500 text-center">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>
                {!message.trim()
                  ? 'Escreva a mensagem acima para liberar o envio'
                  : selectedCount === 0
                  ? 'Marque pelo menos 1 contato na lista ao lado'
                  : ''}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Cartão de Aviso Seguro em Português Simples */}
      <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-4 text-sm text-slate-700 flex items-start gap-3">
        <Clock className="w-5 h-5 text-[#6B21A8] shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-900 block font-semibold mb-0.5">
            Envio com pausa automática de 5 a 10 segundos
          </strong>
          O sistema espera alguns segundos entre cada envio para que o WhatsApp não bloqueie o seu número.
        </div>
      </div>
    </div>
  );
};
