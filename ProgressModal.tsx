import React from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  X,
  Send,
  Loader2,
} from 'lucide-react';
import { BroadcastJob } from '../types.ts';

interface ProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: BroadcastJob;
  onCancelBroadcast: () => void;
}

export const ProgressModal: React.FC<ProgressModalProps> = ({
  isOpen,
  onClose,
  job,
  onCancelBroadcast,
}) => {
  if (!isOpen) return null;

  const isCompleted = job.status === 'concluido';
  const isCancelled = job.status === 'cancelado';
  const isSending = job.status === 'enviando';

  const processed = job.sent + job.failed;
  const percentage = job.total > 0 ? Math.round((processed / job.total) * 100) : 0;

  // Exportar relatório em CSV
  const handleExportCSV = () => {
    const headers = 'Nome,Numero,Status,Horario,Observacao\n';
    const rows = job.logs
      .map(
        (l) =>
          `"${l.name}","+${l.number}","${
            l.status === 'enviado' ? 'Enviado com sucesso' : l.status === 'falhou' ? 'Falha no envio' : 'Pendente'
          }","${l.timestamp}","${
            l.error ? l.error.replace(/"/g, '""') : 'Entregue'
          }"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `relatorio_envio_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden my-auto min-w-0">
        {/* Topo do Modal */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                isCompleted
                  ? 'bg-emerald-100 text-emerald-700'
                  : isCancelled
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-[#E9D5FF] text-[#6B21A8]'
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : isCancelled ? (
                <XCircle className="w-5 h-5" />
              ) : (
                <Send className="w-5 h-5 animate-pulse" />
              )}
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {isSending
                  ? 'Enviando mensagens...'
                  : isCompleted
                  ? 'Envio concluído com sucesso!'
                  : 'Envio interrompido'}
              </h3>
              <span className="text-sm text-slate-500">
                {isSending
                  ? 'Aguardando intervalo seguro entre cada mensagem'
                  : `Total de ${job.sent} mensagens enviadas`}
              </span>
            </div>
          </div>

          {!isSending && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Conteúdo */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Barra de Progresso */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm font-semibold">
              <span className="text-slate-700">
                Progresso: <strong className="text-[#6B21A8]">{percentage}%</strong>
              </span>
              <span className="text-slate-600">
                {processed} de {job.total} contatos atendidos
              </span>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden p-0.5 border border-slate-200">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isCompleted
                    ? 'bg-emerald-600'
                    : isCancelled
                    ? 'bg-rose-600'
                    : 'bg-[#6B21A8]'
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          {/* Faixa de Status Ativo */}
          {isSending && (
            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
              <div className="flex items-center gap-2.5 text-slate-800">
                <Loader2 className="w-4 h-4 text-[#6B21A8] animate-spin shrink-0" />
                {job.currentContact ? (
                  <span>
                    Enviando agora para:{' '}
                    <strong className="text-[#6B21A8] font-bold">
                      {job.currentContact.name}
                    </strong>
                  </span>
                ) : (
                  <span>Iniciando envio...</span>
                )}
              </div>

              {typeof job.nextSendInSec === 'number' && (
                <div className="flex items-center gap-1.5 text-[#6B21A8] font-semibold bg-white border border-purple-200 px-3 py-1.5 rounded-xl shrink-0">
                  <Clock className="w-4 h-4" />
                  <span>Próximo envio em {job.nextSendInSec} segundos</span>
                </div>
              )}
            </div>
          )}

          {/* Cartões com Contadores */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
              <span className="text-xs font-semibold text-emerald-800 block mb-1">
                Enviadas
              </span>
              <span className="text-2xl font-bold text-emerald-700">
                {job.sent}
              </span>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-center">
              <span className="text-xs font-semibold text-rose-800 block mb-1">
                Não enviadas
              </span>
              <span className="text-2xl font-bold text-rose-700">
                {job.failed}
              </span>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 text-center">
              <span className="text-xs font-semibold text-[#6B21A8] block mb-1">
                Faltam enviar
              </span>
              <span className="text-2xl font-bold text-[#6B21A8]">
                {job.remaining}
              </span>
            </div>
          </div>

          {/* Tabela de Histórico por Contato */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Lista de envios por pessoa
            </span>

            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50 max-h-56 overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-600 sticky top-0 border-b border-slate-200 font-semibold text-xs">
                  <tr>
                    <th className="py-2.5 px-4">Nome do contato</th>
                    <th className="py-2.5 px-4">Número</th>
                    <th className="py-2.5 px-4 text-right">Situação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {job.logs.map((log) => {
                    return (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-4 text-slate-900 font-medium truncate max-w-[160px]">
                          {log.name}
                        </td>
                        <td className="py-2.5 px-4 text-slate-500 text-xs">
                          +{log.number}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          {log.status === 'enviado' && (
                            <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold text-xs bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Enviado</span>
                            </span>
                          )}
                          {log.status === 'enviando' && (
                            <span className="inline-flex items-center gap-1.5 text-[#6B21A8] font-semibold text-xs bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Enviando...</span>
                            </span>
                          )}
                          {log.status === 'pendente' && (
                            <span className="text-slate-400 text-xs font-medium">
                              Aguardando vez
                            </span>
                          )}
                          {log.status === 'falhou' && (
                            <span
                              className="inline-flex items-center gap-1.5 text-rose-700 font-semibold text-xs bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200"
                              title={log.error}
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Não foi possível enviar</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Rodapé com Botões de Texto por Extenso */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
          <div>
            {!isSending && job.logs.length > 0 && (
              <button
                type="button"
                onClick={handleExportCSV}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Baixar relatório em arquivo</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {isSending ? (
              <button
                type="button"
                onClick={onCancelBroadcast}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
              >
                Cancelar envio agora
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-[#6B21A8] hover:bg-[#581c87] transition-colors cursor-pointer shadow-sm"
              >
                Fechar janela
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
