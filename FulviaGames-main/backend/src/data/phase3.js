export const PHASE3_SCENARIOS = [
  {
    id: 'market-direction-change',
    input: 'A alta gerência definiu uma nova direção de mercado. Qual atividade deve ser ativada primeiro?',
    correctActivityId: 'plan',
    explanation: 'Mudanças estratégicas iniciam em Planejar, alinhando objetivos, políticas e planos.',
    nextInput: 'Plano Estratégico revisado'
  },
  {
    id: 'major-incident',
    input: 'Um incidente crítico afetou um serviço essencial. Qual atividade deve iniciar a resposta?',
    correctActivityId: 'deliver-support',
    explanation: 'Resposta operacional a incidentes acontece em Entregar e Suportar (Service Desk, Incidentes).',
    nextInput: 'Incidente classificado e priorizado'
  },
  {
    id: 'new-vendor-contract',
    input: 'Um novo contrato com fornecedor precisa ser estabelecido. Por onde começar?',
    correctActivityId: 'engage',
    explanation: 'Relacionamento e acordos com fornecedores são liderados por Engajar.',
    nextInput: 'Requisitos e expectativas alinhados com fornecedor'
  }
];
