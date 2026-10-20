import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header.tsx';
import { ConnectionScreen } from './components/ConnectionScreen.tsx';
import { MessageComposer } from './components/MessageComposer.tsx';
import { ContactSelector } from './components/ContactSelector.tsx';
import { BroadcastListSection } from './components/BroadcastListSection.tsx';
import { BroadcastListModal } from './components/BroadcastListModal.tsx';
import { ConfirmModal } from './components/ConfirmModal.tsx';
import { ProgressModal } from './components/ProgressModal.tsx';
import { AddContactsModal } from './components/AddContactsModal.tsx';
import {
  ConnectionStatus,
  UserInfo,
  Contact,
  BroadcastJob,
  BroadcastList,
} from './types.ts';
import { AlertCircle, LogOut } from 'lucide-react';

export default function App() {
  const [status, setStatus] = useState<ConnectionStatus>('desconectado');
  const [user, setUser] = useState<UserInfo | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Contatos e Seleção
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedNumbers, setSelectedNumbers] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);

  // Listas de Transmissão
  const [broadcastLists, setBroadcastLists] = useState<BroadcastList[]>([]);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [editingList, setEditingList] = useState<BroadcastList | null>(null);

  // Mensagem e Disparo
  const [message, setMessage] = useState('');
  const [broadcastJob, setBroadcastJob] = useState<BroadcastJob>({
    id: '',
    status: 'idle',
    message: '',
    total: 0,
    sent: 0,
    failed: 0,
    remaining: 0,
    logs: [],
  });

  // Modais
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [isAddContactsModalOpen, setIsAddContactsModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);

  // Buscar status inicial e QR Code
  const fetchStatusAndQr = useCallback(async () => {
    try {
      const [statusRes, qrRes] = await Promise.all([
        fetch('/api/status'),
        fetch('/api/qr'),
      ]);

      if (statusRes.ok) {
        const sData = await statusRes.json();
        setStatus(sData.status);
        setUser(sData.user);
      }

      if (qrRes.ok) {
        const qData = await qrRes.json();
        setQrCode(qData.qr);
      }
    } catch (err) {
      console.warn('Erro ao verificar status inicial:', err);
    }
  }, []);

  // Buscar lista de contatos
  const fetchContacts = useCallback(async () => {
    setIsLoadingContacts(true);
    try {
      const res = await fetch('/api/contatos');
      if (res.ok) {
        const list: Contact[] = await res.json();
        setContacts(list);
      }
    } catch (err) {
      console.warn('Erro ao carregar contatos:', err);
    } finally {
      setIsLoadingContacts(false);
    }
  }, []);

  // Buscar listas de transmissão salvas
  const fetchLists = useCallback(async () => {
    try {
      const res = await fetch('/api/listas');
      if (res.ok) {
        const data: BroadcastList[] = await res.json();
        setBroadcastLists(data);
      }
    } catch (err) {
      console.warn('Erro ao carregar listas de transmissão:', err);
    }
  }, []);

  // Conexão em tempo real via Server-Sent Events
  useEffect(() => {
    fetchStatusAndQr();
    fetchLists();

    const connectSSE = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const sse = new EventSource('/api/progresso');
      eventSourceRef.current = sse;

      sse.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);

          if (payload.type === 'init') {
            const rawStatus = payload.data?.status;
            const newStatus = typeof rawStatus === 'string' ? rawStatus : rawStatus?.status;
            if (newStatus) setStatus(newStatus);
            if (rawStatus?.user) setUser(rawStatus.user);

            const rawQr = payload.data?.qr;
            const newQr = typeof rawQr === 'string' ? rawQr : rawQr?.qr;
            if (newQr !== undefined) setQrCode(newQr);

            if (payload.data?.job) {
              setBroadcastJob(payload.data.job);
              if (payload.data.job.status === 'enviando') {
                setIsProgressModalOpen(true);
              }
            }
          } else if (payload.type === 'status') {
            const newStatus = typeof payload.data === 'string' ? payload.data : payload.data?.status;
            if (newStatus) setStatus(newStatus);
            if (payload.data?.user !== undefined) setUser(payload.data.user);
            if (newStatus === 'conectado') {
              fetchContacts();
              fetchLists();
            }
          } else if (payload.type === 'qr') {
            const newQr = typeof payload.data === 'string' ? payload.data : payload.data?.qr;
            setQrCode(newQr || null);
          } else if (payload.type === 'progress') {
            setBroadcastJob(payload.data);
            if (payload.data.status === 'enviando') {
              setIsProgressModalOpen(true);
            }
          } else if (payload.type === 'contacts') {
            if (Array.isArray(payload.data)) {
              setContacts(payload.data);
            }
          }
        } catch {
          // ignore
        }
      };

      sse.onerror = () => {
        sse.close();
        setTimeout(connectSSE, 4000);
      };
    };

    connectSSE();

    const interval = setInterval(() => {
      fetchStatusAndQr();
    }, 5000);

    return () => {
      clearInterval(interval);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [fetchStatusAndQr, fetchContacts, fetchLists]);

  useEffect(() => {
    if (status === 'conectado') {
      fetchContacts();
      fetchLists();
    }
  }, [status, fetchContacts, fetchLists]);

  // Alternar contato individual
  const handleToggleContact = (number: string) => {
    setSelectedNumbers((prev) => {
      const next = new Set(prev);
      if (next.has(number)) {
        next.delete(number);
      } else {
        next.add(number);
      }
      return next;
    });
  };

  // Selecionar todos os filtrados
  const handleSelectAll = () => {
    const term = searchTerm.toLowerCase().trim();
    const termDigits = term.replace(/\D/g, '');
    const targetContacts = term
      ? contacts.filter(
          (c) =>
            c.name?.toLowerCase().includes(term) ||
            (termDigits ? c.number.includes(termDigits) : false)
        )
      : contacts;

    setSelectedNumbers((prev) => {
      const next = new Set(prev);
      targetContacts.forEach((c) => next.add(c.number));
      return next;
    });
  };

  // Limpar seleção
  const handleClearSelection = () => {
    setSelectedNumbers(new Set());
  };

  // Reconectar
  const handleReconnect = async () => {
    setIsConnecting(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/conectar', { method: 'POST' });
      if (res.ok) {
        await fetchStatusAndQr();
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Não foi possível reconectar agora.');
    } finally {
      setIsConnecting(false);
    }
  };

  // Adicionar contatos manuais
  const handleAddContacts = async (
    items: Array<{ name?: string; number: string }>
  ) => {
    const res = await fetch('/api/contatos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contatos: items }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err?.error || 'Erro ao salvar contatos.');
    }

    const data = await res.json();
    setContacts(data.contatos);
    setSelectedNumbers((prev) => {
      const next = new Set(prev);
      items.forEach((item) => {
        const clean = item.number.replace(/\D/g, '');
        if (clean) next.add(clean);
      });
      return next;
    });
  };

  // Remover contato individual da lista
  const handleRemoveContact = async (number: string) => {
    try {
      const res = await fetch('/api/contatos/remover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numero: number }),
      });
      if (res.ok) {
        const data = await res.json();
        setContacts(data.contatos);
        setSelectedNumbers((prev) => {
          const next = new Set(prev);
          next.delete(number);
          return next;
        });
      }
    } catch (err) {
      console.warn('Erro ao remover contato:', err);
    }
  };

  // --- Funções de Listas de Transmissão ---

  // Usar ou desmarcar lista (permite marcar mais de uma lista ao mesmo tempo sem duplicar contatos)
  const handleApplyList = (list: BroadcastList) => {
    setSelectedNumbers((prev) => {
      const next = new Set(prev);
      const isAllSelected =
        list.contactNumbers.length > 0 &&
        list.contactNumbers.every((n) => next.has(n));

      if (isAllSelected) {
        // Desmarca os contatos dessa lista
        list.contactNumbers.forEach((n) => next.delete(n));
      } else {
        // Marca todos os contatos da lista (Set impede duplicatas)
        list.contactNumbers.forEach((n) => next.add(n));
      }
      return next;
    });
  };

  const handleOpenCreateList = () => {
    setEditingList(null);
    setIsListModalOpen(true);
  };

  const handleOpenEditList = (list: BroadcastList) => {
    setEditingList(list);
    setIsListModalOpen(true);
  };

  const handleDeleteList = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir a lista "${name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/listas/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setBroadcastLists((prev) => prev.filter((l) => l.id !== id));
      } else {
        const err = await res.json();
        throw new Error(err?.error || 'Erro ao excluir lista.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Não foi possível excluir a lista.');
    }
  };

  const handleSaveList = async (
    name: string,
    contactNumbers: string[],
    id?: string
  ) => {
    const url = id ? `/api/listas/${id}` : '/api/listas';
    const method = id ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, contactNumbers }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err?.error || 'Erro ao salvar lista.');
    }

    const saved: BroadcastList = await res.json();
    setBroadcastLists((prev) => {
      if (id) {
        return prev.map((l) => (l.id === id ? saved : l));
      }
      return [saved, ...prev];
    });
  };

  // Iniciar disparo
  const handleStartBroadcast = async () => {
    setErrorMessage(null);
    try {
      const numbersArray = Array.from(selectedNumbers);
      const res = await fetch('/api/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensagem: message,
          numeros: numbersArray,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error || 'Não foi possível iniciar o envio.');
      }

      const data = await res.json();
      setBroadcastJob(data.job);
      setIsProgressModalOpen(true);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Ocorreu um erro ao enviar.');
    }
  };

  // Cancelar disparo
  const handleCancelBroadcast = async () => {
    try {
      await fetch('/api/cancelar', { method: 'POST' });
    } catch (err) {
      console.warn('Erro ao solicitar cancelamento:', err);
    }
  };

  // Desconectar WhatsApp
  const handleConfirmLogout = async () => {
    setIsLogoutModalOpen(false);
    try {
      await fetch('/api/logout', { method: 'POST' });
      setStatus('desconectado');
      setUser(null);
      setQrCode(null);
      setContacts([]);
      setSelectedNumbers(new Set());
    } catch (err: any) {
      setErrorMessage(err?.message || 'Não foi possível desconectar agora.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans selection:bg-[#E9D5FF] selection:text-[#6B21A8] w-full max-w-full overflow-x-hidden">
      {/* Topo com o Nome Edna Marques em destaque */}
      <Header
        status={status}
        user={user}
        onLogoutClick={() => setIsLogoutModalOpen(true)}
        onReconnectClick={handleReconnect}
        isConnecting={isConnecting}
      />

      {/* Aviso de erro amigável */}
      {errorMessage && (
        <div className="bg-rose-50 border-b border-rose-200 text-rose-800 text-xs sm:text-sm px-4 py-3 w-full max-w-full">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span className="font-medium truncate">{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-700 hover:text-rose-900 font-bold text-xs px-2 py-1 rounded cursor-pointer shrink-0"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Área Principal de Conteúdo - Zero rolagem horizontal */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6 sm:space-y-8 min-w-0 max-w-full overflow-hidden">
        {status !== 'conectado' ? (
          /* Tela de Conexão */
          <ConnectionScreen
            status={status}
            qrCode={qrCode}
            onRefresh={handleReconnect}
            isLoading={isConnecting}
          />
        ) : (
          <>
            {/* 1. Seção de Listas de Transmissão */}
            <BroadcastListSection
              lists={broadcastLists}
              selectedNumbers={selectedNumbers}
              onApplyList={handleApplyList}
              onEditList={handleOpenEditList}
              onDeleteList={handleDeleteList}
              onOpenCreateModal={handleOpenCreateList}
            />

            {/* 2. Grid de Disparo: Mensagem e Contatos */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start w-full min-w-0">
              {/* Coluna Esquerda: Escrever Mensagem */}
              <div className="lg:col-span-6 w-full min-w-0">
                <MessageComposer
                  message={message}
                  onChangeMessage={setMessage}
                  selectedCount={selectedNumbers.size}
                  totalContactsCount={contacts.length}
                  onOpenConfirmModal={() => setIsConfirmModalOpen(true)}
                  isSending={broadcastJob.status === 'enviando'}
                />
              </div>

              {/* Coluna Direita: Selecionar Contatos */}
              <div className="lg:col-span-6 w-full min-w-0">
                <ContactSelector
                  contacts={contacts}
                  selectedNumbers={selectedNumbers}
                  onToggleContact={handleToggleContact}
                  onSelectAll={handleSelectAll}
                  onClearSelection={handleClearSelection}
                  searchTerm={searchTerm}
                  onChangeSearchTerm={setSearchTerm}
                  onOpenAddModal={() => setIsAddContactsModalOpen(true)}
                  onRefreshContacts={fetchContacts}
                  onRemoveContact={handleRemoveContact}
                  isLoadingContacts={isLoadingContacts}
                />
              </div>
            </div>
          </>
        )}
      </main>

      {/* Modal de Lista de Transmissão */}
      <BroadcastListModal
        isOpen={isListModalOpen}
        onClose={() => setIsListModalOpen(false)}
        onSaveList={handleSaveList}
        contacts={contacts}
        editingList={editingList}
      />

      {/* Modal de Confirmação */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleStartBroadcast}
        recipientCount={selectedNumbers.size}
        message={message}
      />

      {/* Modal de Progresso em Tempo Real */}
      <ProgressModal
        isOpen={isProgressModalOpen}
        onClose={() => setIsProgressModalOpen(false)}
        job={broadcastJob}
        onCancelBroadcast={handleCancelBroadcast}
      />

      {/* Modal de Adicionar Contatos */}
      <AddContactsModal
        isOpen={isAddContactsModalOpen}
        onClose={() => setIsAddContactsModalOpen(false)}
        onAddContacts={handleAddContacts}
      />

      {/* Modal de Desconexão com botões de texto por extenso */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-sm p-6 shadow-xl text-center space-y-4 animate-fade-in my-auto min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shrink-0">
              <LogOut className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-slate-900">
                Desconectar o WhatsApp?
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                Ao desconectar, você precisará apontar a câmera do celular para o código QR novamente para reconectar.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 min-w-0">
              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(false)}
                className="w-full sm:flex-1 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Voltar e continuar
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                className="w-full sm:flex-1 py-2.5 text-xs sm:text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-sm cursor-pointer"
              >
                Sim, desconectar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
