# ⚙️ Itens e Respostas - ITIL Quest — Fases 1/2/3

Este documento descreve as perguntas/itens das três fases do jogo e as respostas corretas usadas pelo backend (para referência de desenvolvedores e instrutores). Todo o conteúdo abaixo está em Português (pt-BR).

---

## 🔁 Fase 1 — Sequência de Fluxo (Ordenação)

Cada escolha apresenta 6 atividades que devem ser ordenadas corretamente. As atividades disponíveis são:

- Planejar (`plan`)
- Engajar (`engage`)
- Projetar e Transicionar (`design-transition`)
- Obter/Construir (`obtain-build`)
- Entregar e Suportar (`deliver-support`)
- Melhorar (`improve`)

### Escolha a ordem correta — respostas

1. **Escolha: Fluxo Essencial** (`svc-canonical`)
   - Descrição: Ordene as 6 atividades seguindo um fluxo prático e direto.
   - Ordem correta (IDs / identificadores): `['plan', 'engage', 'design-transition', 'obtain-build', 'deliver-support', 'improve']`
   - Ordem correta (Rótulos): Planejar → Engajar → Projetar e Transicionar → Obter/Construir → Entregar e Suportar → Melhorar

2. **Escolha: Novo serviço ao portfólio** (`new-service-request`)
   - Descrição: Um novo serviço será criado. Monte um fluxo de ponta a ponta.
   - Ordem correta (IDs / identificadores): `['engage', 'plan', 'design-transition', 'obtain-build', 'deliver-support', 'improve']`
   - Ordem correta (Rótulos): Engajar → Planejar → Projetar e Transicionar → Obter/Construir → Entregar e Suportar → Melhorar

---

## 🔗 Fase 2 — Conexão de Conceitos (Associe práticas às atividades)

A Fase 2 pede que o jogador selecione quais práticas são associadas principalmente a cada atividade.
Abaixo está a lista de práticas e a `activity` correta para cada uma (mapeamento `primaryActivityId`).

- `incident-management` — Gestão de Incidentes → Entregar e Suportar (`deliver-support`)
- `service-desk` — Central de Serviços (Service Desk) → Entregar e Suportar (`deliver-support`)
- `problem-management` — Gestão de Problemas → Melhorar (`improve`)
- `change-enable` — Habilitação de Mudança → Projetar e Transicionar (`design-transition`)
- `release-management` — Gestão de Releases → Projetar e Transicionar (`design-transition`)
- `service-validation-testing` — Validação e Testes de Serviço → Projetar e Transicionar (`design-transition`)
- `software-dev-mgmt` — Desenvolvimento e Gestão de Software → Obter/Construir (`obtain-build`)
- `it-asset-management` — Gestão de Ativos de TI → Obter/Construir (`obtain-build`)
- `deployment-management` — Gestão de Deploy → Projetar e Transicionar (`design-transition`)
- `risk-management` — Gestão de Riscos → Planejar (`plan`)
- `information-security` — Gestão de Segurança da Informação → Planejar (`plan`)
- `supplier-management` — Gestão de Fornecedores → Engajar (`engage`)
- `relationship-management` — Gestão de Relacionamento → Engajar (`engage`)
- `service-level-management` — Gestão de Níveis de Serviço → Engajar (`engage`)
- `continual-improvement` — Melhoria Contínua → Melhorar (`improve`)
- `measurement-reporting` — Medição e Relato → Melhorar (`improve`)

Observação: Para o jogo, a validação da Fase 2 usa `primaryActivityId` para verificar se as práticas selecionadas pertencem à atividade escolhida.

⚠️ **Desbloqueio por nível**: Cada fase é desbloqueada pelo nível do jogador (1 → Fase 1, 2 → Fase 2, 3 → Fase 3). Jogadores só podem acessar fases com o nível mínimo requerido.

---

## 🎭 Fase 3 — Cenários de Decisão (Escolha a atividade correta)

A Fase 3 apresenta cenários (situações) e pergunta qual atividade deve responder primeiro.

### Cenários e respostas corretas

1. **Cenário: market-direction-change**
   - Enunciado: "A alta gerência definiu uma nova direção de mercado. Qual atividade deve ser ativada primeiro?"
   - Resposta correta: `plan` — Planejar
   - Explicação: Mudanças estratégicas iniciam com Planejar (definição de objetivos, políticas e planos).

2. **Cenário: major-incident**
   - Enunciado: "Um incidente crítico afetou um serviço essencial. Qual atividade deve iniciar a resposta?"
   - Resposta correta: `deliver-support` — Entregar e Suportar
   - Explicação: Respostas operacionais a incidentes acontecem em Entregar e Suportar (Service Desk, Resolução de Incidentes, etc.).

3. **Cenário: new-vendor-contract**
   - Enunciado: "Um novo contrato com fornecedor precisa ser estabelecido. Por onde começar?"
   - Resposta correta: `engage` — Engajar
   - Explicação: Gestão de relacionamento e acordos com fornecedores são iniciadas pela atividade Engajar.

---

## 🛠️ Instruções para Desenvolvedores

- Arquivos fonte (onde o conteúdo acima está definido):
   - `backend/src/data/activities.js` — atividades e rótulos
   - `backend/src/data/phase1.js` — questões/ordens corretas
   - `backend/src/data/practices.js` — mapeamento de práticas → atividade
   - `backend/src/data/phase3.js` — cenários e respostas corretas

