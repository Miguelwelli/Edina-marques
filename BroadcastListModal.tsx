import React, { useState, useMemo, useEffect } from 'react';
import {
  ListPlus,
  X,
  Search,
  CheckSquare,
  Square,
  Check,
  Users,
} from 'lucide-react';
import { Contact, BroadcastList } from '../types.ts';

interface BroadcastListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveList: (name: string, contactNumbers: string[], id?: string) => Promise<void>;
  contacts: Contact[];
  editingList: BroadcastList | null;
}

export const BroadcastListModal: React.FC<BroadcastListModalProps> = ({
  isOpen,
  onClose,
  onSaveList,
  contacts,
  editingList,
}) => {
  const [name, setName] = useState('');
  const [selectedNumbers, setSelectedNumbers] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingList) {
      setName(editingList.name);
      setSelectedNumbers(new Set(editingList.contactNumbers));
    } else {
      setName('');
      setSelectedNumbers(new Set());
    }
    setSearchTerm('');
    setError(null);
  }, [editingList, isOpen]);

  const filteredContacts = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return contacts;
    const termDigits = term.replace(/\D/g, '');
    return contacts.filter((c) => {
      const nameMatch = c.name?.toLowerCase().includes(term);
      const numberMatch = termDigits ? c.number.includes(termDigits) : false;
      return nameMatch || numberMatch;
    });
  }, [contacts, searchTerm]);

  if (!isOpen) return null;

  const handleToggle = (num: string) => {
    setSelectedNumbers((prev) => {
      const next = new Set(prev);
      if (next.has(num)) {
        next.delete(num);
      } else {
        next.add(num);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedNumbers((prev) => {
      const next = new Set(prev);
      filteredContacts.forEach((c) => next.add(c.number));
      return next;
    });
  };

  const handleClearSelection = () => {
    setSelectedNumbers(new Set());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Por favor, informe o nome da lista de transmissão.');
      return;
    }

    if (selectedNumbers.size === 0) {
      setError('Por favor, selecione pelo menos 1 contato para esta lista.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSaveList(name.trim(), Array.from(selectedNumbers), editingList?.id);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Erro ao salvar lista.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-xl overflow-hidden animate-fade-in my-auto flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#E9D5FF] text-[#6B21A8] flex items-center justify-center shrink-0">
              <ListPlus className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                {editingList ? 'Editar lista de transmissão' : 'Criar lista de transmissão'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Organize grupos de contatos frequentes
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 transition-colors p-1.5 rounded-lg cursor-pointer shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs sm:text-sm font-medium">
                {error}
              </div>
            )}

            {/* Nome da Lista */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-1.5">
                Nome da lista:
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Exemplo: Clientes VIP, Família, Fornecedores..."
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#6B21A8] focus:ring-2 focus:ring-[#E9D5FF] rounded-2xl px-4 py-2.5 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 outline-none transition-all"
                autoFocus
              />
            </div>

            {/* Barra de Busca de Contatos */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                <label className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#6B21A8]" />
                  <span>Marcar contatos da lista:</span>
                </label>
                <span className="text-xs text-[#6B21A8] font-bold">
                  {selectedNumbers.size} de {contacts.length} marcados
                </span>
              </div>

              <div className="relative mb-2">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar contato por nome ou número..."
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#6B21A8] focus:ring-1 focus:ring-[#E9D5FF] rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 text-xs mb-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-2.5 py-1 text-[#6B21A8] bg-purple-50 hover:bg-[#E9D5FF] rounded-lg transition-colors font-semibold cursor-pointer border border-purple-200"
                >
                  Selecionar todos ({filteredContacts.length})
                </button>
                <button
                  type="button"
                  onClick={handleClearSelection}
                  disabled={selectedNumbers.size === 0}
                  className="px-2.5 py-1 text-slate-600 hover:text-rose-600 bg-slate-100 rounded-lg transition-colors disabled:opacity-40 font-semibold cursor-pointer"
                >
                  Limpar
                </button>
              </div>

              {/* Lista com scroll e itens */}
              <div className="border border-slate-200 rounded-2xl p-1 bg-slate-50/50 max-h-48 sm:max-h-56 overflow-y-auto space-y-1">
                {filteredContacts.length === 0 ? (
                  <div className="py-8 text-center text-xs sm:text-sm text-slate-500">
                    Nenhum contato encontrado.
                  </div>
                ) : (
                  filteredContacts.map((c) => {
                    const isSelected = selectedNumbers.has(c.number);
                    return (
                      <div
                        key={c.number}
                        onClick={() => handleToggle(c.number)}
                        className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border ${
                          isSelected
                            ? 'bg-[#E9D5FF]/70 border-[#6B21A8]/40 text-slate-900'
                            : 'bg-white hover:bg-slate-100 border-transparent text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="shrink-0">
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-[#6B21A8]" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-300" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="block text-xs sm:text-sm font-semibold truncate text-slate-900">
                              {c.name || c.number}
                            </span>
                            <span className="block text-[11px] text-slate-500 font-medium truncate">
                              +{c.number}
                            </span>
                          </div>
                        </div>

                        {isSelected && (
                          <span className="text-[10px] text-[#6B21A8] font-bold px-2 py-0.5 rounded-full bg-white/90 border border-purple-200 shrink-0 ml-2">
                            Na lista
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Rodapé com botões com texto por extenso */}
          <div className="px-5 sm:px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#6B21A8] hover:bg-[#581c87] transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Salvando...' : 'Salvar lista de transmissão'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
