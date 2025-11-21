export const PRACTICES = [
  { id: 'incident-management', label: 'Gestão de Incidentes', primaryActivityId: 'deliver-support' },
  { id: 'service-desk', label: 'Central de Serviços (Service Desk)', primaryActivityId: 'deliver-support' },
  { id: 'problem-management', label: 'Gestão de Problemas', primaryActivityId: 'improve' },
  { id: 'change-enable', label: 'Habilitação de Mudança (Change Enablement)', primaryActivityId: 'design-transition' },
  { id: 'release-management', label: 'Gestão de Releases', primaryActivityId: 'design-transition' },
  { id: 'service-validation-testing', label: 'Validação e Testes de Serviço', primaryActivityId: 'design-transition' },
  { id: 'software-dev-mgmt', label: 'Desenvolvimento e Gestão de Software', primaryActivityId: 'obtain-build' },
  { id: 'it-asset-management', label: 'Gestão de Ativos de TI', primaryActivityId: 'obtain-build' },
  { id: 'deployment-management', label: 'Gestão de Deploy', primaryActivityId: 'design-transition' },
  { id: 'risk-management', label: 'Gestão de Riscos', primaryActivityId: 'plan' },
  { id: 'information-security', label: 'Gestão de Segurança da Informação', primaryActivityId: 'plan' },
  { id: 'supplier-management', label: 'Gestão de Fornecedores', primaryActivityId: 'engage' },
  { id: 'relationship-management', label: 'Gestão de Relacionamento', primaryActivityId: 'engage' },
  { id: 'service-level-management', label: 'Gestão de Níveis de Serviço', primaryActivityId: 'engage' },
  { id: 'continual-improvement', label: 'Melhoria Contínua', primaryActivityId: 'improve' },
  { id: 'measurement-reporting', label: 'Medição e Relato', primaryActivityId: 'improve' }
];

export const PRACTICE_BY_ID = Object.fromEntries(
  PRACTICES.map(p => [p.id, p])
);
