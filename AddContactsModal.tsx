import React, { useState } from 'react';
import { UserPlus, X, Check } from 'lucide-react';

interface AddContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddContacts: (contacts: Array<{ name?: string; number: string }>) => Promise<void>;
}

export const AddContactsModal: React.FC<AddContactsModalProps> = ({
  isOpen,
  onClose,
  onAddContacts,
}) => {
  const [mode, setMode] = useState<'batch' | 'single'>('batch');
  const [singleName, setSingleName] = useState('');
  const [singleNumber, setSingleNumber] = useState('');
  const [batchText, setBatchText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const contactsToAdd: Array<{ name?: string; number: string }> = [];

      if (mode === 'single') {
        const cleanNumber = singleNumber.replace(/\D/g, '');
        if (cleanNumber.length < 8) {
          throw new Error('Por favor, informe um número de telefone com DDD válido.');
        }
        contactsToAdd.push({
          name: singleName.trim() || undefined,
          number: cleanNumber,
        });
      } else {
        const lines = batchText.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          if (trimmed.includes(',')) {
            const [part1, part2] = trimmed.split(',');
            const numCandidate = part1.replace(/\D/g, '');
            if (numCandidate.length >= 8) {
              contactsToAdd.push({
                number: numCandidate,
                name: part2?.trim() || undefined,
              });
            } else {
              const numCandidate2 = part2.replace(/\D/g, '');
              if (numCandidate2.length >= 8) {
                contactsToAdd.push({
                  number: numCandidate2,
                  name: part1?.trim() || undefined,
                });
              }
            }
          } else {
            const cleanNumber = trimmed.replace(/\D/g, '');
            if (cleanNumber.length >= 8) {
              contactsToAdd.push({
                number: cleanNumber,
              });
            }
          }
        }

        if (contactsToAdd.length === 0) {
          throw new Error('Nenhum número válido foi identificado no texto digitado.');
        }
      }

      await onAddContacts(contactsToAdd);
      onClose();
      setSingleName('');
      setSingleNumber('');
      setBatchText('');
    } catch (err: any) {
      setError(err?.message || 'Não foi possível adicionar os contatos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-xl overflow-hidden animate-fade-in my-auto min-w-0">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3 text-slate-900 font-bold text-lg">
            <div className="w-9 h-9 rounded-xl bg-[#E9D5FF] text-[#6B21A8] flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <span>Adicionar contatos</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-sm text-slate-700">
          {/* Abas com texto */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl text-sm font-semibold">
            <button
              type="button"
              onClick={() => setMode('batch')}
              className={`py-2 rounded-xl transition-colors cursor-pointer ${
                mode === 'batch'
                  ? 'bg-white text-[#6B21A8] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Colar vários números
            </button>
            <button
              type="button"
              onClick={() => setMode('single')}
              className={`py-2 rounded-xl transition-colors cursor-pointer ${
                mode === 'single'
                  ? 'bg-white text-[#6B21A8] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Adicionar um único contato
            </button>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm">
              {error}
            </div>
          )}

          {mode === 'batch' ? (
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-800">
                Cole a lista de telefones (um por linha):
              </label>
              <textarea
                value={batchText}
                onChange={(e) => setBatchText(e.target.value)}
                rows={6}
                placeholder="Exemplos:&#10;62991262754, Maria Silva&#10;62992223344, João Carlos&#10;62988887777"
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#6B21A8] focus:ring-2 focus:ring-[#E9D5FF] rounded-2xl p-3.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none leading-relaxed"
              />
              <span className="text-xs text-slate-500 block">
                Você pode colar no formato <code className="text-[#6B21A8] font-bold">número, nome</code> ou apenas o <code className="text-[#6B21A8] font-bold">número com DDD</code>.
              </span>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                  Nome da pessoa (opcional):
                </label>
                <input
                  type="text"
                  value={singleName}
                  onChange={(e) => setSingleName(e.target.value)}
                  placeholder="Exemplo: Maria Silva"
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#6B21A8] focus:ring-2 focus:ring-[#E9D5FF] rounded-2xl px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                  Número de telefone com DDD:
                </label>
                <input
                  type="text"
                  value={singleNumber}
                  onChange={(e) => setSingleNumber(e.target.value)}
                  placeholder="Exemplo: 62991262754"
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#6B21A8] focus:ring-2 focus:ring-[#E9D5FF] rounded-2xl px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none"
                />
              </div>
            </div>
          )}

          {/* Rodapé com botões de texto por extenso */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 flex-wrap">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-[#6B21A8] hover:bg-[#581c87] transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Salvando...' : 'Salvar contatos na lista'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
