# Guia para Desenvolvedores — ITIL Quest v2.0

Este guia explica como rodar, editar e expandir o back-end (API) e o front-end do ITIL Quest - Edição Lúdica.

## 📋 Estrutura do Projeto

```text
FulviaGames/
├── backend/              # API Express (Node.js)
│   ├── package.json
│   ├── test-client.js    # Cliente de teste da API
│   └── src/
│       ├── server.js     # Servidor principal com todas as rotas
│       └── data/
│           ├── activities.js    # 6 atividades ITIL
│           ├── practices.js     # Práticas ITIL e mapeamentos
│           ├── phase1.js        # Questões de ordenação
│           └── phase3.js        # Cenários de decisão
│
├── frontend/             # Front-end (HTML/CSS/JS)
│   ├── package.json
│   ├── public/
│   │   ├── index.html    # Interface principal
│   │   ├── styles.css    # Estilos modernos e responsivos
│   │   └── app.js        # Lógica do jogo e integração com API
│   └── scripts/
│       └── server.js     # Servidor estático para desenvolvimento
│
├── .gitignore
├── README.md             # Visão geral do projeto (público)
├── DEV_README.md         # Este arquivo (desenvolvedores)
├── RELATORIO_FINAL.md    # Relatório de entrega para o PO
└── COMO_USAR.md          # Guia do usuário final
```

## ⚙️ Requisitos

- **Node.js 18+** recomendado
- **npm** ou **yarn**
- Navegador moderno (Chrome, Firefox, Edge)

## 🚀 Como Rodar em Desenvolvimento

### Opção 1: Execução Rápida (PowerShell/Windows)

Abra dois terminais:

**Terminal 1 — Backend (API na porta 3000):**
```powershell
cd backend
npm install
npm start
# API disponível em http://localhost:3000
```

**Terminal 2 — Frontend (porta 8080):**
```powershell
cd frontend
npm install
npm run dev
# Interface disponível em http://localhost:8080
```

### Opção 2: Usando o Test Client

Para testar a API sem o frontend:
```powershell
cd backend
npm install
npm start    # Terminal 1
npm test     # Terminal 2 (executa test-client.js)
```

### Verificação Rápida

Acesse no navegador:
- **Frontend**: http://localhost:8080
- **API Health**: http://localhost:3000/api/meta
- **Motivação**: http://localhost:3000/api/easteregg/motivate

## 🔧 Editando o Backend

### Arquivos Principais

- **`backend/src/server.js`**: Define todos os endpoints da API
- **`backend/src/data/activities.js`**: Define as 6 atividades ITIL
- **`backend/src/data/practices.js`**: Define práticas e mapeamentos
- **`backend/src/data/phase1.js`**: Questões da Fase 1 (ordenação)
- **`backend/src/data/phase3.js`**: Cenários da Fase 3 (decisão)

### Sistema de Gamificação Incluído

- **Sistema de Sessões**: Armazena progresso em memória
- **XP e Níveis**: Calculados automaticamente
- **Conquistas**: 8 conquistas desbloqueáveis
- **Combos**: Rastreia acertos consecutivos
- **Rankings**: Títulos baseados em nível

### Adicionar Nova Questão (Fase 1)

1. Edite `backend/src/data/phase1.js`
2. Adicione um objeto ao array `PHASE1_QUESTIONS`:

```javascript
{
  id: 'nova-questao',
  title: '🎯 Título',
  description: 'Contexto...',
  difficulty: '⭐⭐ Intermediário',
  correctOrder: ['plan', 'design-transition', ...]
}
```

3. Reinicie o backend

### Adicionar/Ajustar Práticas (Fase 2)

1. Edite `backend/src/data/practices.js`
2. Ajuste `primaryActivityId` (id de uma das 6 atividades)
3. A validação usa esse mapeamento

### Adicionar Novo Cenário (Fase 3)

1. Edite `backend/src/data/phase3.js`
2. Adicione ao array `PHASE3_SCENARIOS`:

```javascript
{
  id: 'novo-cenario',
  input: '🎭 Situação...',
  correctActivityId: 'improve',
  explanation: 'Por quê...',
  nextInput: 'Depois...'
}
```

### Boas Práticas

- Mantenha IDs estáveis (snake-case, inglês)
- Labels em PT-BR para usuário final
- Reinicie o servidor após mudanças em `data/`

## 🎨 Editando o Frontend

### Arquivos Principais

- **`frontend/public/index.html`**: Interface e estrutura HTML
- **`frontend/public/styles.css`**: Estilos modernos e responsivos
- **`frontend/public/app.js`**: Lógica do jogo e integração com API

### Logo do Projeto

Coloque a imagem `logo.png` na pasta `frontend/public/assets/` — o frontend exibirá automaticamente no topo do site.

Recomendo um arquivo PNG transparente ou otimizado com 72–150px de altura; o CSS adaptará a largura para telas pequenas. Se sua imagem não aparece após a atualização, limpe o cache do navegador ou renomeie o arquivo para `logo.png?v=2` para forçar o recarregamento.

### Componentes Implementados

- ✅ Modal de boas-vindas com cadastro de jogador
- ✅ Sistema de navegação entre fases
- ✅ Painel de estatísticas do jogador (XP, nível, ranking)
- ✅ Sistema de dicas com penalização
- ✅ Feedback visual para acertos/erros
- ✅ Conquistas e notificações
- ✅ Easter eggs (motivação)
- ✅ Botão "Trocar Jogador" para reset

### Trocar URL da API

Em `frontend/public/app.js`, linha 1:

```javascript
const API_BASE = 'http://localhost:3000/api';
// Para produção: 'https://sua-api.com/api'
```

### Event Listeners Configurados

Todos os botões e controles estão bindados em `DOMContentLoaded`:
- Navegação entre fases
- Botões de Dica, Limpar, Validar
- Seleção de questões/atividades/cenários
- Easter eggs (Motivação)
- Reset de sessão

### Melhorias Sugeridas

- Fase 1: Implementar drag-and-drop nativo
- Fase 2: Animações ao selecionar práticas
- Fase 3: Exibir histórico de escolhas
- PWA: Transformar em Progressive Web App
- Dark Mode: Adicionar tema escuro

## 🧪 Testes e Qualidade

### Testes Manuais Realizados

- ✅ Todas as rotas da API testadas (200 OK)
- ✅ CORS configurado corretamente
- ✅ Frontend funcionando em Chrome/Firefox/Edge
- ✅ Sistema de gamificação validado
- ✅ Navegação entre fases OK
- ✅ Todos os botões respondendo

### Testes Automatizados (Sugestão)

```powershell
cd backend
npm install --save-dev jest
# Adicionar testes para compareOrder() e validações
```

### Linters e Formatadores

Recomendado adicionar:
- **ESLint** para código JavaScript
- **Prettier** para formatação
- **Markdownlint** para documentação

## 🚀 Deploy

### Backend (API)

Opções recomendadas:
- **Render**: Deploy gratuito com auto-deploy
- **Railway**: Simples e com banco de dados incluso
- **Azure App Service**: Escalável para empresas
- **Heroku**: (alternativa paga)

Variáveis de ambiente necessárias:
```
PORT=3000
NODE_ENV=production
```

### Frontend (Estático)

Opções recomendadas:
- **Vercel**: Deploy automático via GitHub
- **Netlify**: CI/CD integrado
- **GitHub Pages**: Gratuito para projetos públicos
- **Azure Static Web Apps**: Integração com Azure

**Importante**: Ajustar `API_BASE` em `app.js` para URL de produção.

### Exemplo de Deploy Completo

1. Backend no Render:
   - Conectar repositório GitHub
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Copiar URL gerada (ex: `https://itil-quest.onrender.com`)

2. Frontend no Vercel:
   - Conectar repositório GitHub
   - Root Directory: `frontend/public`
   - Atualizar `API_BASE` em `app.js` com a URL do Render
   - Deploy automático

## 📝 Convenções e Decisões

- **Fluxos pedagógicos**: ITIL 4 permite múltiplos value streams; as sequências são simplificadas para fins educacionais
- **Mapeamento primário**: Cada prática atribuída à atividade onde contribui mais comumente
- **Dados em memória**: Sessões armazenadas em `Map()` no backend (reiniciar server = perder dados)
- **IDs estáveis**: Usar snake-case em inglês para facilitar manutenção
- **Logs de debug**: Mantidos para facilitar desenvolvimento (podem ser removidos para produção)

## 🐛 Debug e Troubleshooting

### Backend não inicia

```powershell
# Verificar se a porta 3000 está em uso
netstat -ano | findstr :3000
# Matar processo se necessário
taskkill /PID <PID> /F
```

### Frontend não conecta com API

1. Verificar se backend está rodando: `http://localhost:3000/api/meta`
2. Verificar CORS no console do navegador
3. Confirmar `API_BASE` em `app.js`

### Botão não responde

1. Abrir Console do navegador (F12)
2. Verificar logs `[bind] ...` ao carregar página
3. Verificar erros JavaScript no console

### Logs úteis implementados

- `[DOMContentLoaded]` - Inicialização
- `[showView]` - Navegação
- `[handleStartGameClick]` - Cadastro
- `[bind]` - Event listeners
- `[resetSession]` - Troca de jogador

## 📚 Recursos Adicionais

- **ITIL 4 Foundation**: <https://www.axelos.com/certifications/itil-service-management>
- **Express.js Docs**: <https://expressjs.com/>
- **MDN Web Docs**: <https://developer.mozilla.org/>

## 🤝 Contribuindo

Para contribuir com o projeto:

1. Fork o repositório
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto é de código aberto para fins educacionais.
