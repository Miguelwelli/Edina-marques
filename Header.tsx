import React from 'react';
import { LogOut, RefreshCw, MessageSquare, Download } from 'lucide-react';
import { ConnectionStatus, UserInfo } from '../types.ts';

interface HeaderProps {
  status: ConnectionStatus;
  user: UserInfo | null;
  onLogoutClick: () => void;
  onReconnectClick: () => void;
  isConnecting?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  user,
  onLogoutClick,
  onReconnectClick,
  isConnecting,
}) => {
  const isConnected = status === 'conectado';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs w-full max-w-full overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full min-w-0">
        {/* Brand Zone - Edna Marques com logo vetorial e acabamento suave */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#6B21A8] text-white flex items-center justify-center font-bold text-lg shadow-xs border border-purple-200 shrink-0 overflow-hidden">
            <img
              src="/logo.svg"
              alt="Logo Edna Marques"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-[#6B21A8] truncate">
              Edna Marques
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium truncate">
              Designer de Sobrancelhas · Envio no WhatsApp
            </p>
          </div>
        </div>

        {/* Right Zone: Status e Ações com texto escrito */}
        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 flex-wrap min-w-0">
          {/* Status Indicator */}
          {isConnected ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="font-semibold text-slate-800">
                WhatsApp conectado
              </span>
              {user?.phone && (
                <span className="text-xs text-slate-500 font-medium hidden md:inline">
                  (+{user.phone})
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="font-medium text-amber-900">
                {status === 'aguardando QR'
                  ? 'Aguardando leitura do código'
                  : 'Desconectado'}
              </span>
            </div>
          )}

          {/* Action Buttons - Always with text */}
          <a
            href="/api/download-projeto"
            download="projeto-whatsapp-edna-marques.zip"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-[#6B21A8] bg-purple-50 hover:bg-[#E9D5FF] border border-purple-200 rounded-xl transition-colors cursor-pointer"
            title="Baixar todos os arquivos do site em um arquivo ZIP"
          >
            <Download className="w-4 h-4 text-[#6B21A8]" />
            <span className="hidden sm:inline">Baixar arquivos (.ZIP)</span>
            <span className="sm:hidden">Baixar .ZIP</span>
          </a>

          {!isConnected && (
            <button
              type="button"
              onClick={onReconnectClick}
              disabled={isConnecting}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-[#6B21A8] bg-purple-50 hover:bg-[#E9D5FF] border border-purple-200 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw
                className={`w-4 h-4 ${isConnecting ? 'animate-spin' : ''}`}
              />
              <span>Tentar reconectar</span>
            </button>
          )}

          {isConnected && (
            <button
              type="button"
              onClick={onLogoutClick}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Desconectar WhatsApp</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
