# ZapDisparador - Envio em Massa WhatsApp

Aplicativo web full-stack (Front-end **React + Tailwind CSS** + Backend **Node.js/Express**) para envio automatizado de mensagens para múltiplos contatos do WhatsApp utilizando a biblioteca `@whiskeysockets/baileys`.

---

## 🚀 Funcionalidades

### Backend (Node.js + Express + Baileys)
- **Conexão via QR Code**: Conexão com WhatsApp Web como dispositivo vinculado.
- **Sessão Persistente**: Salva os dados na pasta local `auth_info/` para não precisar escanear o QR Code toda vez que iniciar o servidor.
- **Sincronização de Contatos**: Obtém automaticamente a lista de contatos do WhatsApp ordenados por nome, além de permitir adicionar contatos manualmente ou colar listas de números (lote).
- **Intervalo Inteligente Anti-Bloqueio**: No envio em lote, aguarda um intervalo aleatório de **5 a 15 segundos** entre cada mensagem, reduzindo drasticamente o risco de bloqueio pelo WhatsApp.
- **Transmissão em Tempo Real (Server-Sent Events - SSE)**: Envia atualizações em tempo real do progresso (`enviados`, `falhas`, `restantes`, contagem regressiva para o próximo envio e log por contato).
- **Tratamento de Quedas e Reconexão Automática**: Se a conexão oscilar, tenta reconectar automaticamente com backoff progressivo.
- **Logout Seguro**: Desconecta o socket e apaga a pasta de autenticação `auth_info/`.

### Endpoints da API
- `GET /api/status`: Retorna o estado atual da conexão (`"desconectado"`, `"aguardando QR"` ou `"conectado"`), usuário logado e número de telefone.
- `GET /api/qr`: Retorna o QR Code atualizado em formato de imagem Base64 e string raw.
- `GET /api/contatos`: Retorna a lista completa de contatos sincronizados e em cache, ordenada alfabeticamente.
- `POST /api/contatos`: Permite adicionar números avulsos ou uma lista em lote colada no formato `número, nome`.
- `POST /api/enviar`: Recebe `{ mensagem: string, numeros: string[] }` e inicia o disparo em lote com atraso inteligente de 5 a 15 segundos.
- `POST /api/cancelar`: Interrompe imediatamente o disparo em andamento.
- `POST /api/conectar`: Força o início do protocolo de conexão Baileys.
- `POST /api/logout`: Encerra a sessão e apaga as credenciais salvas em disco.
- `GET /api/progresso`: Stream SSE para atualizações em tempo real de status, QR Code, contatos e progresso do disparo.

---

### Front-End (React + Tailwind CSS)
1. **Tema Escuro Moderno e Responsivo**: Projetado para dispositivos móveis e desktops, com fontes contemporâneas e estética profissional.
2. **Tela de Conexão**:
   - Exibição de QR Code com animação de leitura.
   - Instruções detalhadas passo a passo para conectar no WhatsApp pelo celular.
   - Transição automática instantânea para a tela principal assim que a conexão é estabelecida.
   - Botão para recarregar QR Code manualmente caso expire.
3. **Tela Principal**:
   - **Editor de Mensagem**: Caixa de texto com contador de caracteres e palavras, atalhos de formatação rápida (*negrito*, _itálico_, ~riscado~, ```código```).
   - **Prévia do WhatsApp em Tempo Real**: Balão de mensagem estilizado idêntico ao aplicativo oficial do WhatsApp.
   - **Lista de Contatos**:
     - Checkbox individual por contato.
     - Barra de pesquisa por nome ou número.
     - Botões rápidos "Selecionar todos" e "Limpar seleção".
     - Contador de selecionados vs total.
     - Botão para adicionar/colar novos contatos.
   - **Modal de Confirmação**: Exibe resumo com total de destinatários, estimativa de tempo e aviso de segurança antes de disparar.
   - **Painel de Progresso em Tempo Real**:
     - Barra de progresso percentual.
     - Cartões com contadores: Enviados, Falhas e Restantes.
     - Contagem regressiva em segundos do intervalo de segurança para o próximo envio.
     - Tabela de logs por contato com status (`Pendente`, `Enviando`, `Enviado`, `Falha`).
     - Botão de cancelamento de envio a qualquer momento.
     - Opção de exportação do relatório completo em `.csv`.
   - **Desconexão**: Botão de logout no cabeçalho com confirmação.

---

## ⚙️ Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto (ou baseie-se no `.env.example`):

```bash
# Porta do servidor (padrão 3000)
PORT=3000

# Ambiente de execução (development ou production)
NODE_ENV=development

# Opcional (injetado automaticamente pelo Google AI Studio se aplicável)
APP_URL=http://localhost:3000
```

---

## 🛠️ Como Executar

### 1. Instalar as dependências
```bash
npm install
```

### 2. Iniciar em modo de Desenvolvimento
```bash
npm run dev
```
O servidor Express inicializará o serviço Baileys e montará os middlewares do Vite na porta **3000**:
Acesse no navegador: `http://localhost:3000`

### 3. Build para Produção
```bash
npm run build
npm start
```

---

## 📁 Estrutura de Pastas

```
├── auth_info/             # Pasta gerada automaticamente com as chaves de autenticação do Baileys e cache de contatos
├── server/
│   └── whatsappService.ts # Gerenciador de conexão Baileys, fila de envio e delay anti-bloqueio
├── server.ts              # Servidor Express com endpoints da API, SSE e integração Vite
├── src/
│   ├── components/
│   │   ├── Header.tsx            # Cabeçalho com status, perfil e logout
│   │   ├── ConnectionScreen.tsx  # Tela de escaneamento de QR Code
│   │   ├── MessageComposer.tsx   # Editor de mensagem com prévia do WhatsApp
│   │   ├── ContactSelector.tsx   # Seleção, busca e filtros de contatos
│   │   ├── ConfirmModal.tsx      # Modal de confirmação antes do disparo
│   │   ├── ProgressModal.tsx     # Modal de progresso em tempo real e logs
│   │   └── AddContactsModal.tsx  # Modal para colar lista de números
│   ├── App.tsx                   # Estado global e consumo de SSE
│   ├── types.ts                  # Interfaces TypeScript
│   ├── main.tsx                  # Ponto de entrada React
│   └── index.css                 # Configuração Tailwind CSS
├── package.json
└── README.md
```

---

## ⚠️ Boas Práticas e Recomendações
- Utilize o disparo responsável e respeite a privacidade dos usuários.
- O atraso automático de 5 a 15 segundos entre cada mensagem foi implementado propositalmente para mitigar o risco de restrições ou bloqueios temporários de conta.
