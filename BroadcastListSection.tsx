import React from 'react';
import {
  ListFilter,
  Plus,
  Users,
  CheckCheck,
  Edit2,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { BroadcastList } from '../types.ts';

interface BroadcastListSectionProps {
  lists: BroadcastList[];
  selectedNumbers: Set<string>;
  onApplyList: (list: BroadcastList) => void;
  onEditList: (list: BroadcastList) => void;
  onDeleteList: (id: string, name: string) => void;
  onOpenCreateModal: () => void;
}

export const BroadcastListSection: React.FC<BroadcastListSectionProps> = ({
  lists,
  selectedNumbers,
  onApplyList,
  onEditList,
  onDeleteList,
  onOpenCreateModal,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-xs w-full min-w-0">
      {/* Topo da Seção */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100 min-w-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#E9D5FF] text-[#6B21A8] flex items-center justify-center shrink-0">
            <ListFilter className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
              Listas de transmissão
            </h2>
            <p className="text-xs text-slate-500 font-medium truncate">
              Selecione grupos inteiros com um só toque
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-[#6B21A8] hover:bg-[#581c87] rounded-xl transition-colors cursor-pointer shadow-xs self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Criar lista</span>
        </button>
      </div>

      {/* Cartões das Listas */}
      <div className="mt-4 min-w-0">
        {lists.length === 0 ? (
          <div className="py-8 px-4 text-center rounded-2xl bg-purple-50/50 border border-purple-100/70 flex flex-col items-center justify-center">
            <Sparkles className="w-8 h-8 text-[#6B21A8] mb-2 opacity-80" />
            <p className="text-sm font-bold text-slate-800 mb-1">
              Nenhuma lista de transmissão criada
            </p>
            <p className="text-xs text-slate-500 max-w-sm mb-3">
              Crie listas como "Clientes", "Alunas" ou "Família" para marcar dezenas de contatos com 1 clique.
            </p>
            <button
              type="button"
              onClick={onOpenCreateModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#6B21A8] bg-white border border-purple-200 rounded-xl hover:bg-[#E9D5FF] transition-colors cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Criar minha primeira lista</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 min-w-0">
            {lists.map((list) => {
              // Verifica quantos contatos desta lista já estão marcados na seleção atual
              const markedFromThisList = list.contactNumbers.filter((n) =>
                selectedNumbers.has(n)
              ).length;
              const isFullySelected =
                list.contactNumbers.length > 0 &&
                markedFromThisList === list.contactNumbers.length;
              const isPartiallySelected =
                markedFromThisList > 0 && !isFullySelected;

              return (
                <div
                  key={list.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 min-w-0 ${
                    isFullySelected
                      ? 'bg-purple-50/70 border-purple-300 shadow-2xs'
                      : 'bg-white hover:bg-slate-50/80 border-slate-200'
                  }`}
                >
                  {/* Cabeçalho do Cartão */}
                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-2 min-w-0 mb-1.5">
                      <h3
                        className="text-sm sm:text-base font-bold text-slate-900 truncate"
                        title={list.name}
                      >
                        {list.name}
                      </h3>
                      {isFullySelected ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-800 bg-[#E9D5FF] px-2 py-0.5 rounded-full shrink-0">
                          <CheckCheck className="w-3 h-3" />
                          <span>Em uso</span>
                        </span>
                      ) : isPartiallySelected ? (
                        <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                          {markedFromThisList}/{list.contactNumbers.length}
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                      <Users className="w-3.5 h-3.5 text-[#6B21A8]" />
                      <span>
                        <strong className="text-slate-800 font-semibold">
                          {list.contactNumbers.length}
                        </strong>{' '}
                        {list.contactNumbers.length === 1 ? 'contato salvo' : 'contatos salvos'}
                      </span>
                    </div>
                  </div>

                  {/* Ações com botões com texto por extenso */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => onApplyList(list)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs ${
                        isFullySelected
                          ? 'bg-white text-purple-900 border border-purple-200 hover:bg-purple-100'
                          : 'bg-[#6B21A8] hover:bg-[#581c87] text-white'
                      }`}
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>{isFullySelected ? 'Desmarcar lista' : 'Usar lista'}</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEditList(list)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Editar nome e contatos da lista"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span className="hidden xs:inline">Editar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteList(list.id, list.name)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Excluir lista de transmissão"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden xs:inline">Excluir</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
