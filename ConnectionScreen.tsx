import React from 'react';
import { Smartphone, RefreshCw, CheckCircle2, ShieldCheck } from 'lucide-react';
import { ConnectionStatus } from '../types.ts';

interface ConnectionScreenProps {
  status: ConnectionStatus;
  qrCode: string | null;
  onRefresh: () => void;
  isLoading: boolean;
}

export const ConnectionScreen: React.FC<ConnectionScreenProps> = ({
  status,
  qrCode,
  onRefresh,
  isLoading,
}) => {
  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-6 sm:py-12 w-full min-w-0">
      {/* Title e Logo */}
      <div className="text-center mb-6 sm:mb-8 flex flex-col items-center w-full min-w-0">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-[#6B21A8] text-white flex items-center justify-center font-bold text-xl shadow-xs border border-purple-200 mb-3 overflow-hidden">
          <img
            src="/logo.svg"
            alt="Logo Edna Marques"
            className="w-full h-full object-cover"
          />
        </div>
        <h2 className="text-xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-1">
          Conectar seu WhatsApp
        </h2>
        <p className="text-slate-600 text-sm sm:text-base max-w-md mx-auto">
          Aponte a câmera do WhatsApp no seu celular para o código na tela.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-10 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-center w-full min-w-0">
        {/* Passo a Passo */}
        <div className="md:col-span-7 space-y-6">
          <div className="flex items-center gap-2 text-[#6B21A8] font-bold text-base">
            <Smartphone className="w-5 h-5 text-[#6B21A8]" />
            <span>Como conectar no seu celular:</span>
          </div>

          <ol className="space-y-4 text-base text-slate-700">
            <li className="flex items-start gap-3.5">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#E9D5FF] text-[#6B21A8] font-bold text-sm shrink-0 mt-0.5">
                1
              </span>
              <div>
                <strong className="text-slate-900 block font-semibold">
                  Abra o WhatsApp
                </strong>
                <span className="text-slate-600 text-sm">
                  Abra o aplicativo normalmente no seu celular.
                </span>
              </div>
            </li>

            <li className="flex items-start gap-3.5">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#E9D5FF] text-[#6B21A8] font-bold text-sm shrink-0 mt-0.5">
                2
              </span>
              <div>
                <strong className="text-slate-900 block font-semibold">
                  Toque em Aparelhos conectados
                </strong>
                <span className="text-slate-600 text-sm">
                  No Android toque nos 3 pontinhos no topo. No iPhone toque em Configurações. Depois escolha <strong>Aparelhos conectados</strong>.
                </span>
              </div>
            </li>

            <li className="flex items-start gap-3.5">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#E9D5FF] text-[#6B21A8] font-bold text-sm shrink-0 mt-0.5">
                3
              </span>
              <div>
                <strong className="text-slate-900 block font-semibold">
                  Toque em Conectar um aparelho
                </strong>
                <span className="text-slate-600 text-sm">
                  A câmera do seu celular será aberta para escanear o código.
                </span>
              </div>
            </li>

            <li className="flex items-start gap-3.5">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#E9D5FF] text-[#6B21A8] font-bold text-sm shrink-0 mt-0.5">
                4
              </span>
              <div>
                <strong className="text-slate-900 block font-semibold">
                  Aponte para o código ao lado
                </strong>
                <span className="text-slate-600 text-sm">
                  Assim que a leitura for feita, a tela mudará automaticamente para o painel de envio.
                </span>
              </div>
            </li>
          </ol>

          <div className="pt-4 border-t border-slate-100 flex items-center gap-2 text-sm text-slate-500">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              A conexão fica salva automaticamente. Você não precisará ler o código toda vez.
            </span>
          </div>
        </div>

        {/* QR Code Container */}
        <div className="md:col-span-5 flex flex-col items-center justify-center w-full min-w-0">
          <div className="p-3 sm:p-4 bg-white border-2 border-[#E9D5FF] rounded-2xl shadow-sm flex flex-col items-center justify-center w-full max-w-[270px] sm:max-w-[290px] aspect-square overflow-hidden">
            {qrCode ? (
              <img
                src={qrCode}
                alt="Código QR do WhatsApp"
                className="w-full h-full object-contain rounded-lg"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-4">
                <RefreshCw className="w-8 h-8 text-[#6B21A8] animate-spin mb-3" />
                <span className="text-sm font-medium text-slate-800">
                  Gerando código de conexão...
                </span>
                <span className="text-xs text-slate-500 mt-1">
                  Aguarde um instante
                </span>
              </div>
            )}
          </div>

          <div className="mt-4 w-full max-w-xs flex items-center justify-center">
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#6B21A8] bg-[#E9D5FF]/60 hover:bg-[#E9D5FF] rounded-xl transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Atualizar código QR</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
