import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  type WASocket,
  type Contact,
} from '@whiskeysockets/baileys';
import pino from 'pino';
import QRCode from 'qrcode';
import fs from 'node:fs';
import path from 'node:path';
import { EventEmitter } from 'node:events';

export type ConnectionStatus = 'desconectado' | 'aguardando QR' | 'conectado';

export interface ContactItem {
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

const AUTH_DIR = path.resolve(process.cwd(), 'auth_info');
// Salva contatos fora da auth_info para não perder contatos em logout
const CONTACTS_FILE = path.resolve(process.cwd(), 'contacts_cache.json');
const LEGACY_CONTACTS_FILE = path.join(AUTH_DIR, 'contacts.json');

class WhatsAppManager extends EventEmitter {
  private sock: WASocket | null = null;
  private status: ConnectionStatus = 'desconectado';
  private qrCodeBase64: string | null = null;
  private rawQrCode: string | null = null;
  private userInfo: { id: string; name?: string; phone?: string } | null = null;
  private contactsMap: Map<string, ContactItem> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 20;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isExplicitLogout = false;

  private currentJob: BroadcastJob = {
    id: '',
    status: 'idle',
    message: '',
    total: 0,
    sent: 0,
    failed: 0,
    remaining: 0,
    logs: [],
  };
  private cancelRequested = false;

  constructor() {
    super();
    this.ensureAuthDir();
    this.loadCachedContacts();
  }

  private ensureAuthDir() {
    if (!fs.existsSync(AUTH_DIR)) {
      fs.mkdirSync(AUTH_DIR, { recursive: true });
    }
  }

  private loadCachedContacts() {
    try {
      const fileToLoad = fs.existsSync(CONTACTS_FILE)
        ? CONTACTS_FILE
        : fs.existsSync(LEGACY_CONTACTS_FILE)
        ? LEGACY_CONTACTS_FILE
        : null;

      if (fileToLoad) {
        const data = fs.readFileSync(fileToLoad, 'utf-8');
        const list: ContactItem[] = JSON.parse(data);
        for (const item of list) {
          if (item && item.number) {
            this.contactsMap.set(item.number, item);
          }
        }
      }
    } catch (err) {
      console.warn('Não foi possível carregar contatos em cache:', err);
    }
  }

  private saveCachedContacts() {
    try {
      const list = Array.from(this.contactsMap.values());
      fs.writeFileSync(CONTACTS_FILE, JSON.stringify(list, null, 2), 'utf-8');
    } catch (err) {
      console.warn('Erro ao salvar contatos no disco:', err);
    }
  }

  public getStatus(): {
    status: ConnectionStatus;
    user: { id: string; name?: string; phone?: string } | null;
    qrAvailable: boolean;
  } {
    return {
      status: this.status,
      user: this.userInfo,
      qrAvailable: !!this.qrCodeBase64,
    };
  }

  public getQR(): { qr: string | null; raw: string | null } {
    return {
      qr: this.qrCodeBase64,
      raw: this.rawQrCode,
    };
  }

  public getContacts(): ContactItem[] {
    const list = Array.from(this.contactsMap.values());
    return list.sort((a, b) =>
      (a.name || a.number).localeCompare(b.name || b.number, 'pt-BR', { sensitivity: 'base' })
    );
  }

  public getBroadcastJob(): BroadcastJob {
    return this.currentJob;
  }

  public addCustomContacts(items: Array<{ name?: string; number: string }>): ContactItem[] {
    for (const item of items) {
      const cleanNumber = item.number.replace(/\D/g, '');
      if (cleanNumber.length >= 8) {
        const id = `${cleanNumber}@s.whatsapp.net`;
        const existing = this.contactsMap.get(cleanNumber);
        const contactName = item.name?.trim() || existing?.name || `+${cleanNumber}`;
        const newContact: ContactItem = {
          id,
          name: contactName,
          number: cleanNumber,
        };
        this.contactsMap.set(cleanNumber, newContact);
      }
    }
    this.saveCachedContacts();
    this.emit('contacts_updated', this.getContacts());
    return this.getContacts();
  }

  public removeContact(number: string): ContactItem[] {
    const cleanNumber = number.replace(/\D/g, '');
    this.contactsMap.delete(cleanNumber);
    this.saveCachedContacts();
    this.emit('contacts_updated', this.getContacts());
    return this.getContacts();
  }

  public clearAllContacts(): ContactItem[] {
    this.contactsMap.clear();
    this.saveCachedContacts();
    this.emit('contacts_updated', []);
    return [];
  }

  public async startConnection() {
    if (this.sock && this.status === 'conectado') {
      return;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Limpa socket e ouvintes anteriores
    if (this.sock) {
      try {
        this.sock.ev.removeAllListeners('connection.update');
        this.sock.ev.removeAllListeners('creds.update');
        this.sock.ev.removeAllListeners('contacts.upsert');
        this.sock.ev.removeAllListeners('contacts.update');
        this.sock.ev.removeAllListeners('chats.upsert');
        this.sock.ev.removeAllListeners('messaging-history.set');
        this.sock.end(undefined);
      } catch {
        // ignore
      }
      this.sock = null;
    }

    this.ensureAuthDir();
    this.isExplicitLogout = false;

    try {
      const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
      const { version } = await fetchLatestBaileysVersion();

      const logger = pino({ level: 'silent' });

      this.sock = makeWASocket({
        version,
        auth: state,
        logger,
        browser: ['Edna Marques', 'Chrome', '124.0.0'],
        syncFullHistory: false,
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 60000,
        keepAliveIntervalMs: 25000,
      });

      this.sock.ev.on('creds.update', saveCreds);

      this.sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          this.rawQrCode = qr;
          try {
            this.qrCodeBase64 = await QRCode.toDataURL(qr, {
              margin: 2,
              scale: 8,
              color: {
                dark: '#4c1d95',
                light: '#ffffff',
              },
            });
            this.status = 'aguardando QR';
            this.emit('status_change', this.getStatus());
            this.emit('qr_update', { qr: this.qrCodeBase64, raw: this.rawQrCode });
          } catch (qrErr) {
            console.error('Erro ao converter QR Code para base64:', qrErr);
          }
        }

        if (connection === 'open') {
          this.status = 'conectado';
          this.qrCodeBase64 = null;
          this.rawQrCode = null;
          this.reconnectAttempts = 0;

          const user = this.sock?.user;
          const userPhone = user?.id ? user.id.split(':')[0].split('@')[0] : '';
          this.userInfo = {
            id: user?.id || '',
            name: user?.name || user?.notify || 'Edna Marques',
            phone: userPhone,
          };

          this.emit('status_change', this.getStatus());
          this.emit('qr_update', { qr: null, raw: null });
        }

        if (connection === 'close') {
          const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
          const isLoggedOut = statusCode === DisconnectReason.loggedOut;
          const shouldReconnect = !this.isExplicitLogout && !isLoggedOut;

          console.log(`Conexão WhatsApp fechada. Código: ${statusCode}, Desconectado pelo WhatsApp: ${isLoggedOut}`);

          this.status = 'desconectado';
          this.qrCodeBase64 = null;
          this.rawQrCode = null;
          this.userInfo = null;
          this.emit('status_change', this.getStatus());

          if (isLoggedOut) {
            console.log('Sessão expirada ou desvinculada no celular. Limpando credenciais antigas e gerando novo QR code...');
            try {
              if (fs.existsSync(AUTH_DIR)) {
                const files = fs.readdirSync(AUTH_DIR);
                for (const f of files) {
                  fs.rmSync(path.join(AUTH_DIR, f), { recursive: true, force: true });
                }
              }
            } catch (cleanupErr) {
              console.warn('Erro ao limpar arquivos de sessão expirada:', cleanupErr);
            }

            setTimeout(() => {
              this.startConnection();
            }, 1000);
          } else if (shouldReconnect) {
            this.reconnectAttempts++;
            const delay = Math.min(3000 * Math.min(this.reconnectAttempts, 5), 15000);
            console.log(`Tentando reconectar em ${delay / 1000}s (Tentativa ${this.reconnectAttempts})...`);
            if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
            this.reconnectTimer = setTimeout(() => {
              this.startConnection();
            }, delay);
          }
        }
      });

      // Capturar contatos enviados pelo WhatsApp
      this.sock.ev.on('contacts.upsert', (newContacts: Contact[]) => {
        this.processIncomingContacts(newContacts);
      });

      this.sock.ev.on('contacts.update', (updatedContacts: Partial<Contact>[]) => {
        this.processIncomingContacts(updatedContacts as Contact[]);
      });

      this.sock.ev.on('chats.upsert', (newChats) => {
        for (const chat of newChats) {
          if (chat.id && chat.id.endsWith('@s.whatsapp.net')) {
            const number = chat.id.replace('@s.whatsapp.net', '');
            if (!this.contactsMap.has(number)) {
              this.contactsMap.set(number, {
                id: chat.id,
                name: chat.name || `+${number}`,
                number,
              });
            }
          }
        }
        this.saveCachedContacts();
        this.emit('contacts_updated', this.getContacts());
      });

      this.sock.ev.on('messaging-history.set', ({ contacts }) => {
        if (contacts && Array.isArray(contacts)) {
          this.processIncomingContacts(contacts);
        }
      });
    } catch (error: any) {
      console.error('Erro ao inicializar Baileys:', error);
      if (error?.message?.includes('JSON') || error?.code === 'ENOENT') {
        try {
          fs.rmSync(AUTH_DIR, { recursive: true, force: true });
          this.ensureAuthDir();
        } catch {
          // ignore
        }
      }
      this.status = 'desconectado';
      this.emit('status_change', this.getStatus());
    }
  }

  private processIncomingContacts(contacts: Contact[]) {
    let hasChanges = false;
    for (const c of contacts) {
      if (!c.id) continue;
      if (c.id.endsWith('@s.whatsapp.net')) {
        const number = c.id.replace('@s.whatsapp.net', '');
        const displayName = c.name || c.notify || c.verifiedName || `+${number}`;
        const existing = this.contactsMap.get(number);

        if (!existing || (existing.name.startsWith('+') && !displayName.startsWith('+'))) {
          this.contactsMap.set(number, {
            id: c.id,
            name: displayName,
            number,
            notify: c.notify,
          });
          hasChanges = true;
        }
      }
    }

    if (hasChanges) {
      this.saveCachedContacts();
      this.emit('contacts_updated', this.getContacts());
    }
  }

  public async logout(): Promise<void> {
    this.isExplicitLogout = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.sock) {
      try {
        await this.sock.logout();
      } catch (err) {
        console.warn('Erro durante logout socket:', err);
      }
      try {
        this.sock.end(undefined);
      } catch {
        // ignore
      }
      this.sock = null;
    }

    this.status = 'desconectado';
    this.qrCodeBase64 = null;
    this.rawQrCode = null;
    this.userInfo = null;

    try {
      if (fs.existsSync(AUTH_DIR)) {
        fs.rmSync(AUTH_DIR, { recursive: true, force: true });
      }
    } catch (fsErr) {
      console.error('Erro ao deletar pasta auth_info:', fsErr);
    }

    this.emit('status_change', this.getStatus());
    this.emit('qr_update', { qr: null, raw: null });

    setTimeout(() => {
      this.startConnection();
    }, 1000);
  }

  public cancelBroadcast(): void {
    if (this.currentJob.status === 'enviando') {
      this.cancelRequested = true;
      this.currentJob.status = 'cancelado';
      this.currentJob.finishedAt = new Date().toISOString();
      this.emit('progress_update', this.currentJob);
    }
  }

  public async startBroadcast(message: string, numbers: string[]): Promise<BroadcastJob> {
    if (this.status !== 'conectado' || !this.sock) {
      throw new Error('WhatsApp não está conectado. Conecte antes de enviar mensagens.');
    }

    if (this.currentJob.status === 'enviando') {
      throw new Error('Já existe um disparo em andamento.');
    }

    if (!message || message.trim().length === 0) {
      throw new Error('A mensagem não pode estar vazia.');
    }

    const uniqueNumbers = Array.from(new Set(numbers.map((n) => n.replace(/\D/g, '')))).filter(
      (n) => n.length >= 8
    );

    if (uniqueNumbers.length === 0) {
      throw new Error('Nenhum número de contato válido foi fornecido.');
    }

    this.cancelRequested = false;
    const jobId = 'job_' + Date.now();

    const logs: BroadcastLog[] = uniqueNumbers.map((num) => {
      const contact = this.contactsMap.get(num);
      return {
        id: `log_${num}_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('pt-BR'),
        number: num,
        name: contact?.name || `+${num}`,
        status: 'pendente',
      };
    });

    this.currentJob = {
      id: jobId,
      status: 'enviando',
      message,
      total: uniqueNumbers.length,
      sent: 0,
      failed: 0,
      remaining: uniqueNumbers.length,
      logs,
      startedAt: new Date().toISOString(),
    };

    this.emit('progress_update', this.currentJob);
    this.executeBroadcastLoop(uniqueNumbers, message);

    return this.currentJob;
  }

  private async executeBroadcastLoop(numbers: string[], message: string) {
    for (let i = 0; i < numbers.length; i++) {
      if (this.cancelRequested) {
        break;
      }

      const num = numbers[i];
      const log = this.currentJob.logs[i];
      const contact = this.contactsMap.get(num);
      const contactName = contact?.name || `+${num}`;

      log.status = 'enviando';
      log.timestamp = new Date().toLocaleTimeString('pt-BR');
      this.currentJob.currentContact = { name: contactName, number: num };
      this.emit('progress_update', this.currentJob);

      // Normalização inteligente de número para WhatsApp
      let cleanNum = num;
      if ((cleanNum.length === 10 || cleanNum.length === 11) && !cleanNum.startsWith('55')) {
        cleanNum = `55${cleanNum}`;
      }

      let formattedJid = `${cleanNum}@s.whatsapp.net`;

      try {
        if (!this.sock) {
          throw new Error('Conexão perdida durante o envio.');
        }

        let targetJid = formattedJid;

        // Validação inteligente no WhatsApp com fallback de 9º dígito
        try {
          const checkList = await this.sock.onWhatsApp(formattedJid);
          if (checkList && checkList.length > 0 && checkList[0].exists && checkList[0].jid) {
            targetJid = checkList[0].jid;
          } else if (cleanNum.startsWith('55') && cleanNum.length === 12) {
            // Tenta adicionar o 9º dígito: 55 + DDD(2) + 9 + número(8)
            const withNine = `${cleanNum.slice(0, 4)}9${cleanNum.slice(4)}@s.whatsapp.net`;
            const checkNine = await this.sock.onWhatsApp(withNine);
            if (checkNine && checkNine.length > 0 && checkNine[0].exists && checkNine[0].jid) {
              targetJid = checkNine[0].jid;
            }
          } else if (cleanNum.startsWith('55') && cleanNum.length === 13 && cleanNum[4] === '9') {
            // Tenta sem o 9º dígito: 55 + DDD(2) + número(8)
            const withoutNine = `${cleanNum.slice(0, 4)}${cleanNum.slice(5)}@s.whatsapp.net`;
            const checkWithoutNine = await this.sock.onWhatsApp(withoutNine);
            if (checkWithoutNine && checkWithoutNine.length > 0 && checkWithoutNine[0].exists && checkWithoutNine[0].jid) {
              targetJid = checkWithoutNine[0].jid;
            }
          }
        } catch {
          // Em caso de instabilidade na consulta, prossegue com formattedJid
        }

        await this.sock.sendMessage(targetJid, { text: message });

        log.status = 'enviado';
        this.currentJob.sent++;
      } catch (err: any) {
        console.error(`Erro ao enviar mensagem para ${num}:`, err?.message || err);
        log.status = 'falhou';
        log.error = err?.message || 'Falha no envio';
        this.currentJob.failed++;
      }

      this.currentJob.remaining = this.currentJob.total - (this.currentJob.sent + this.currentJob.failed);
      this.emit('progress_update', this.currentJob);

      // Intervalo aleatório de 5 a 10 segundos entre mensagens
      const isLastContact = i === numbers.length - 1;
      if (!isLastContact && !this.cancelRequested) {
        const delaySeconds = Math.floor(Math.random() * (10 - 5 + 1)) + 5;
        log.delayWaitSec = delaySeconds;

        for (let s = delaySeconds; s > 0; s--) {
          if (this.cancelRequested) break;
          this.currentJob.nextSendInSec = s;
          this.emit('progress_update', this.currentJob);
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
        this.currentJob.nextSendInSec = undefined;
      }
    }

    if (!this.cancelRequested) {
      this.currentJob.status = 'concluido';
    }
    this.currentJob.finishedAt = new Date().toISOString();
    this.currentJob.currentContact = undefined;
    this.currentJob.nextSendInSec = undefined;
    this.emit('progress_update', this.currentJob);
  }
}

export const waManager = new WhatsAppManager();
