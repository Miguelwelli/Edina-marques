import React, { useMemo, useState } from 'react';
import {
  Search,
  CheckSquare,
  Square,
  Users,
  UserPlus,
  RefreshCw,
  X,
  ChevronDown,
  Trash2,
} from 'lucide-react';
import { Contact } from '../types.ts';

interface ContactSelectorProps {
  contacts: Contact[];
  selectedNumbers: Set<string>;
  onToggleContact: (number: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  searchTerm: string;
  onChangeSearchTerm: (term: string) => void;
  onOpenAddModal: () => void;
  onRefreshContacts: () => void;
  onRemoveContact?: (number: string) => void;
  isLoadingContacts: boolean;
}

export const ContactSelector: React.FC<ContactSelectorProps> = ({
  contacts,
  selectedNumbers,
  onToggleContact,
  onSelectAll,
  onClearSelection,
  searchTerm,
  onChangeSearchTerm,
  onOpenAddModal,
  onRefreshContacts,
  onRemoveContact,
  isLoadingContacts,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'selected'>('all');
  const [visibleCount, setVisibleCount] = useState<number>(80);

  // Filter contacts by search query and mode
  const filteredContacts = useMemo(() => {
    let result = contacts;

    if (filterMode === 'selected') {
      result = result.filter((c) => selectedNumbers.has(c.number));
    }

    const term = searchTerm.toLowerCase().trim();
    if (!term) return result;

    const termDigits = term.replace(/\D/g, '');
    return result.filter((c) => {
      const nameMatch = c.name?.toLowerCase().includes(term);
      const numberMatch = termDigits ? c.number.includes(termDigits) : false;
      return nameMatch || numberMatch;
    });
  }, [contacts, searchTerm, filterMode, selectedNumbers]);

  const displayedContacts = useMemo(() => {
    return filteredContacts.slice(0, visibleCount);
  }, [filteredContacts, visibleCount]);

  // Formata telefone para visualização brasileira limpa: (62) 99126-2754
  const formatPhoneNumber = (num: string) => {
    const clean = num.replace(/\D/g, '');
    if (clean.startsWith('55') && clean.length === 13) {
      return `(${clean.slice(2, 4)}) ${clean.slice(4, 9)}-${clean.slice(9)}`;
    }
    if (clean.startsWith('55') && clean.length === 12) {
      return `(${clean.slice(2, 4)}) ${clean.slice(4, 8)}-${clean.slice(8)}`;
    }
    if (clean.length === 11) {
      return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
    }
    return `+${clean}`;
  };

  // Iniciais do contato
  const getInitials = (name: string, number: string) => {
    if (!name || name.startsWith('+')) {
      return number.slice(-2);
    }
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-7 shadow-xs flex flex-col h-full w-full min-w-0 max-w-full overflow-hidden">
      {/* Topo da Lista */}
      <div className="flex flex-col gap-3.5 pb-4 border-b border-slate-100 min-w-0 w-full">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-[#6B21A8]" />
            <h2 className="text-base font-bold text-slate-900">
              Contatos do WhatsApp
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRefreshContacts}
              disabled={isLoadingContacts}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              title="Atualizar lista de contatos"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isLoadingContacts ? 'animate-spin text-[#6B21A8]' : ''}`}
              />
              <span>Atualizar contatos</span>
            </button>
            <button
              type="button"
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#6B21A8] hover:bg-[#581c87] rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Adicionar número</span>
            </button>
          </div>
        </div>

        {/* Contadores e Seleções com texto escrito */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="text-sm text-slate-600">
            <strong className="text-[#6B21A8] font-bold text-base">
              {selectedNumbers.size}
            </strong>{' '}
            de{' '}
            <strong className="text-slate-800 font-semibold">
              {contacts.length}
            </strong>{' '}
            contatos selecionados
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={onSelectAll}
              className="px-3 py-1.5 text-[#6B21A8] bg-purple-50 hover:bg-[#E9D5FF] rounded-lg transition-colors font-semibold cursor-pointer border border-purple-200"
            >
              Selecionar todos ({filteredContacts.length})
            </button>
            <button
              type="button"
              onClick={onClearSelection}
              disabled={selectedNumbers.size === 0}
              className="px-3 py-1.5 text-slate-600 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-40 font-semibold cursor-pointer"
            >
              Limpar seleção
            </button>
          </div>
        </div>

        {/* Barra de Busca e Filtro de Visualização */}
        <div className="flex flex-col sm:flex-row gap-2.5 mt-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                onChangeSearchTerm(e.target.value);
                setVisibleCount(80);
              }}
              placeholder="Digite o nome ou número para buscar..."
              className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#6B21A8] focus:ring-2 focus:ring-[#E9D5FF] rounded-xl pl-10 pr-9 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => onChangeSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Abas com texto */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs shrink-0 self-start sm:self-auto font-medium">
            <button
              type="button"
              onClick={() => {
                setFilterMode('all');
                setVisibleCount(80);
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-white text-[#6B21A8] font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos os contatos ({contacts.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setFilterMode('selected');
                setVisibleCount(80);
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filterMode === 'selected'
                  ? 'bg-white text-[#6B21A8] font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Selecionados ({selectedNumbers.size})
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Contatos */}
      <div className="flex-1 overflow-y-auto mt-2 pr-1 space-y-1.5 max-h-[480px] w-full min-w-0">
        {filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500">
            <Users className="w-12 h-12 text-slate-300 mb-3" />
            {searchTerm ? (
              <>
                <p className="text-base font-medium text-slate-800">
                  Nenhum contato encontrado para "{searchTerm}"
                </p>
                <button
                  type="button"
                  onClick={() => onChangeSearchTerm('')}
                  className="mt-2 text-sm text-[#6B21A8] font-semibold hover:underline cursor-pointer"
                >
                  Limpar busca
                </button>
              </>
            ) : filterMode === 'selected' ? (
              <p className="text-base font-medium text-slate-700">
                Você ainda não selecionou nenhum contato
              </p>
            ) : (
              <>
                <p className="text-base font-semibold text-slate-800 mb-1">
                  Nenhum contato carregado
                </p>
                <p className="text-sm text-slate-500 max-w-xs mb-4">
                  Os contatos são obtidos diretamente do seu WhatsApp ou você pode cadastrar manualmente.
                </p>
                <button
                  type="button"
                  onClick={onOpenAddModal}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-[#6B21A8] hover:bg-[#581c87] rounded-xl transition-colors cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Adicionar número de telefone</span>
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            {displayedContacts.map((contact) => {
              const isSelected = selectedNumbers.has(contact.number);
              const initials = getInitials(contact.name, contact.number);

              return (
                <div
                  key={contact.number}
                  onClick={() => onToggleContact(contact.number)}
                  className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-[#E9D5FF]/60 border-[#6B21A8]/40 text-slate-900 shadow-xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200/80 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Checkbox */}
                    <div className="shrink-0">
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-[#6B21A8] fill-[#6B21A8]/20" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-300" />
                      )}
                    </div>

                    {/* Avatar com fundo lilás se selecionado */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                        isSelected
                          ? 'bg-[#6B21A8] text-white'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {initials}
                    </div>

                    {/* Informações do Contato - Letra normal 16px para excelente leitura */}
                    <div className="min-w-0">
                      <span className="block text-base font-semibold truncate text-slate-900">
                        {contact.name || contact.number}
                      </span>
                      <span className="block text-xs text-slate-500 font-medium truncate">
                        {formatPhoneNumber(contact.number)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {isSelected && (
                      <span className="text-xs text-[#6B21A8] font-bold px-2.5 py-1 rounded-full bg-white/80 border border-[#6B21A8]/30">
                        Marcado
                      </span>
                    )}
                    {onRemoveContact && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Remover "${contact.name || contact.number}" da lista de contatos?`)) {
                            onRemoveContact(contact.number);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Remover contato da lista"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Carregar mais contatos */}
            {filteredContacts.length > displayedContacts.length && (
              <div className="pt-3 pb-1 text-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + 100)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-[#6B21A8] bg-purple-50 hover:bg-[#E9D5FF] border border-purple-200 rounded-xl transition-colors cursor-pointer"
                >
                  <ChevronDown className="w-4 h-4" />
                  <span>
                    Mostrar mais contatos ({displayedContacts.length} de {filteredContacts.length})
                  </span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
