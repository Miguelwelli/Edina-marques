export type ConnectionStatus = 'desconectado' | 'aguardando QR' | 'conectado';

export interface UserInfo {
  id: string;
  name?: string;
  phone?: string;
}

export interface Contact {
  id: string;
  name: string;
  number: string;
  notify?: string;
}

export interface BroadcastLog {
  id: string;
  timestamp: string;
  number: string;
  name: string;
  status: 'pendente' | 'enviando' | 'enviado' | 'falhou';
  error?: string;
  delayWaitSec?: number;
}

export interface BroadcastJob {
  id: string;
  status: 'idle' | 'enviando' | 'concluido' | 'cancelado';
  message: string;
  total: number;
  sent: number;
  failed: number;
  remaining: number;
  currentContact?: { name: string; number: string };
  nextSendInSec?: number;
  logs: BroadcastLog[];
  startedAt?: string;
  finishedAt?: string;
}

export interface BroadcastList {
  id: string;
  name: string;
  contactNumbers: string[];
  createdAt: string;
  updatedAt: string;
}
