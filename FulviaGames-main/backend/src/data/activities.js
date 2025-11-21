export const ACTIVITIES = [
  { id: 'plan', label: 'Planejar' },
  { id: 'engage', label: 'Engajar' },
  { id: 'design-transition', label: 'Projetar e Transicionar' },
  { id: 'obtain-build', label: 'Obter/Construir' },
  { id: 'deliver-support', label: 'Entregar e Suportar' },
  { id: 'improve', label: 'Melhorar' }
];

export const ACTIVITY_BY_ID = Object.fromEntries(
  ACTIVITIES.map(a => [a.id, a])
);
