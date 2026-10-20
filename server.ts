import express, { Request, Response } from 'express';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { waManager } from './server/whatsappService.ts';
import { broadcastListService } from './server/broadcastListService.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Iniciar conexão WhatsApp com persistência em auth_info
waManager.startConnection();

// --- Endpoints da API WhatsApp ---

// GET /api/status: retorna "desconectado", "aguardando QR" ou "conectado"
app.get('/api/status', (req: Request, res: Response) => {
  const statusData = waManager.getStatus();
  res.json({
    status: statusData.status,
    user: statusData.user,
    qrAvailable: statusData.qrAvailable,
    isConnected: statusData.status === 'conectado',
  });
});

// GET /api/qr: retorna o QR code atual (imagem base64 e string bruta)
app.get('/api/qr', (req: Request, res: Response) => {
  const qrData = waManager.getQR();
  res.json({
    qr: qrData.qr,
    raw: qrData.raw,
  });
});

// GET /api/contatos: retorna a lista de contatos (nome e número), ordenada por nome
app.get('/api/contatos', (req: Request, res: Response) => {
  const contacts = waManager.getContacts();
  res.json(contacts);
});

// POST /api/contatos: permite adicionar contato avulso ou lista colada
app.post('/api/contatos', (req: Request, res: Response) => {
  try {
    const { contatos } = req.body;
    if (!Array.isArray(contatos)) {
      return res.status(400).json({ error: 'O campo contatos deve ser um array.' });
    }
    const updated = waManager.addCustomContacts(contatos);
    res.json({ success: true, contatos: updated });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Erro ao adicionar contatos.' });
  }
});

// POST /api/contatos/remover: remove contato da lista
app.post('/api/contatos/remover', (req: Request, res: Response) => {
  try {
    const { numero } = req.body;
    if (!numero) {
      return res.status(400).json({ error: 'Número é obrigatório.' });
    }
    const updated = waManager.removeContact(numero);
    res.json({ success: true, contatos: updated });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Erro ao remover contato.' });
  }
});

// POST /api/contatos/limpar: limpa todos os contatos
app.post('/api/contatos/limpar', (req: Request, res: Response) => {
  try {
    const updated = waManager.clearAllContacts();
    res.json({ success: true, contatos: updated });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Erro ao limpar contatos.' });
  }
});

// --- Endpoints de Listas de Transmissão (listas.json) ---

// GET /api/listas: retorna todas as listas salvas
app.get('/api/listas', (req: Request, res: Response) => {
  try {
    const listas = broadcastListService.getAll();
    res.json(listas);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Erro ao buscar listas.' });
  }
});

// POST /api/listas: cria nova lista { name, contactNumbers }
app.post('/api/listas', (req: Request, res: Response) => {
  try {
    const { name, contactNumbers } = req.body;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Nome da lista é obrigatório.' });
    }
    if (!Array.isArray(contactNumbers)) {
      return res.status(400).json({ error: 'contactNumbers deve ser uma lista de números.' });
    }
    const created = broadcastListService.create(name, contactNumbers);
    res.status(201).json(created);
  } catch (error: any) {
    res.status(400).json({ error: error?.message || 'Erro ao criar lista.' });
  }
});

// PUT /api/listas/:id: atualiza lista existente { name, contactNumbers }
app.put('/api/listas/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, contactNumbers } = req.body;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Nome da lista é obrigatório.' });
    }
    if (!Array.isArray(contactNumbers)) {
      return res.status(400).json({ error: 'contactNumbers deve ser uma lista de números.' });
    }
    const updated = broadcastListService.update(id, name, contactNumbers);
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error?.message || 'Erro ao atualizar lista.' });
  }
});

// DELETE /api/listas/:id: remove lista
app.delete('/api/listas/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = broadcastListService.delete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Lista não encontrada.' });
    }
    res.json({ success: true, message: 'Lista excluída com sucesso.' });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Erro ao excluir lista.' });
  }
});

// POST /api/enviar: recebe { mensagem, numeros[] } e envia para cada número com intervalo 5-15s
app.post('/api/enviar', async (req: Request, res: Response) => {
  try {
    const { mensagem, numeros } = req.body;

    if (!mensagem || typeof mensagem !== 'string' || mensagem.trim() === '') {
      return res.status(400).json({ error: 'Mensagem é obrigatória.' });
    }

    if (!Array.isArray(numeros) || numeros.length === 0) {
      return res.status(400).json({ error: 'Selecione pelo menos um número de contato.' });
    }

    const job = await waManager.startBroadcast(mensagem, numeros);
    res.json({ success: true, job });
  } catch (error: any) {
    res.status(400).json({ error: error?.message || 'Erro ao iniciar disparo.' });
  }
});

// POST /api/cancelar: cancela disparo em andamento
app.post('/api/cancelar', (req: Request, res: Response) => {
  waManager.cancelBroadcast();
  res.json({ success: true, message: 'Disparo cancelado com sucesso.' });
});

// POST /api/conectar: força reconexão se necessário
app.post('/api/conectar', (req: Request, res: Response) => {
  waManager.startConnection();
  res.json({ success: true, message: 'Iniciando conexão...' });
});

// POST /api/logout: desconecta e apaga a sessão
app.post('/api/logout', async (req: Request, res: Response) => {
  try {
    await waManager.logout();
    res.json({ success: true, message: 'Desconectado e sessão apagada com sucesso.' });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Erro ao desconectar.' });
  }
});

// GET /api/download-projeto: download do arquivo ZIP completo do site
app.get('/api/download-projeto', (req: Request, res: Response) => {
  const zipPath = path.resolve(__dirname, 'public', 'projeto-whatsapp-edna-marques.zip');
  if (fs.existsSync(zipPath)) {
    res.download(zipPath, 'projeto-whatsapp-edna-marques.zip');
  } else {
    res.status(404).json({ error: 'Arquivo ZIP não encontrado.' });
  }
});

// GET /api/progresso: Server-Sent Events (SSE) para transmissão em tempo real
app.get('/api/progresso', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // Enviar estado inicial imediatamente
  const initialPayload = {
    status: waManager.getStatus(),
    qr: waManager.getQR(),
    job: waManager.getBroadcastJob(),
  };
  res.write(`data: ${JSON.stringify({ type: 'init', data: initialPayload })}\n\n`);

  const onStatusChange = (status: any) => {
    res.write(`data: ${JSON.stringify({ type: 'status', data: status })}\n\n`);
  };

  const onQrUpdate = (qr: any) => {
    res.write(`data: ${JSON.stringify({ type: 'qr', data: qr })}\n\n`);
  };

  const onProgressUpdate = (job: any) => {
    res.write(`data: ${JSON.stringify({ type: 'progress', data: job })}\n\n`);
  };

  const onContactsUpdated = (contacts: any) => {
    res.write(`data: ${JSON.stringify({ type: 'contacts', data: contacts })}\n\n`);
  };

  waManager.on('status_change', onStatusChange);
  waManager.on('qr_update', onQrUpdate);
  waManager.on('progress_update', onProgressUpdate);
  waManager.on('contacts_updated', onContactsUpdated);

  // Heartbeat para manter conexão aberta através de proxies
  const heartbeatTimer = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeatTimer);
    waManager.off('status_change', onStatusChange);
    waManager.off('qr_update', onQrUpdate);
    waManager.off('progress_update', onProgressUpdate);
    waManager.off('contacts_updated', onContactsUpdated);
  });
});

// Configuração do Vite para desenvolvimento e estático em produção
async function setupApp() {
  const isProduction = process.env.NODE_ENV === 'production';
  const isHmrDisabled = process.env.DISABLE_HMR === 'true';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled ? false : { server },
        watch: isHmrDisabled ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor Edna Marques rodando em http://0.0.0.0:${PORT}`);
  });
}

setupApp().catch((err) => {
  console.error('Falha ao iniciar o servidor:', err);
});
