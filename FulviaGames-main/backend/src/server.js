import express from 'express';
import cors from 'cors';

import { ACTIVITIES, ACTIVITY_BY_ID } from './data/activities.js';
import { PRACTICES } from './data/practices.js';
import { PHASE1_QUESTIONS, shuffledChoicesForQuestion, compareOrder } from './data/phase2.js';
import { PHASE3_SCENARIOS } from './data/phase3.js';

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

// 🎮 Sistema de Sessões e Progresso dos Jogadores
const playerSessions = new Map();

// 🏆 Sistema de Conquistas
const ACHIEVEMENTS = [
  { id: 'first-steps', name: '🚀 Primeiros Passos', description: 'Complete sua primeira questão!', emoji: '🚀' },
  { id: 'perfect-sequence', name: '⭐ Sequência Perfeita', description: 'Acerte a ordem na primeira tentativa!', emoji: '⭐' },
  { id: 'master-connector', name: '🔗 Mestre das Conexões', description: 'Acerte 100% das associações em uma atividade!', emoji: '🔗' },
  { id: 'wise-decision', name: '🎯 Decisão Sábia', description: 'Escolha o caminho correto 5 vezes seguidas!', emoji: '🎯' },
  { id: 'combo-master', name: '🔥 Mestre do Combo', description: 'Alcance um combo de 5 acertos!', emoji: '🔥' },
  { id: 'persistent', name: '💪 Persistente', description: 'Tente novamente após 3 erros!', emoji: '💪' },
  { id: 'speed-runner', name: '⚡ Velocista', description: 'Complete uma fase em menos de 2 minutos!', emoji: '⚡' },
  { id: 'itil-guru', name: '🧙 Guru do ITIL', description: 'Complete todas as fases com 100% de aproveitamento!', emoji: '🧙' }
];

// 💬 Mensagens de Encorajamento
const ENCOURAGEMENT = {
  perfect: [
    '🌟 PERFEITO! Você é um gênio do ITIL!',
    '🎉 UAU! Acerto em cheio! Você está brilhando!',
    '✨ IMPECÁVEL! Continue assim, campeão!',
    '🏆 EXTRAORDINÁRIO! Você domina isso!',
    '🚀 FANTÁSTICO! Rumo ao topo!'
  ],
  good: [
    '👍 Muito bem! Você está no caminho certo!',
    '😊 Bom trabalho! Continue assim!',
    '💪 Legal! Você está evoluindo!',
    '🎯 Boa! Quase perfeito!',
    '⭐ Excelente tentativa!'
  ],
  needsWork: [
    '🤔 Hmm, vamos revisar isso juntos?',
    '💡 Quase lá! Tente pensar no fluxo...',
    '📚 Bom esforço! Que tal uma dica?',
    '🎓 Aprendemos com os erros! Vamos de novo?',
    '🌱 Estamos crescendo! Não desista!'
  ],
  retry: [
    '🔄 Ei, todo mestre errou antes de acertar!',
    '💫 Uma nova chance, um novo aprendizado!',
    '🌈 Cada tentativa nos deixa mais fortes!',
    '🎮 Game não terminou! Vamos nessa!',
    '🦸 Heróis se levantam! Bora tentar de novo!'
  ]
};

// 💡 Sistema de Dicas
const HINTS = {
  phase1: {
    'svc-canonical': [
      'Siga um fluxo simples: Planejar → Engajar → Projetar/Transição → Obter/Construir → Entregar/Suportar → Melhorar.',
      'Este é o fluxo essencial usado para entender um ciclo completo de serviço — é um ótimo ponto de partida.',
      'Considere o objetivo do serviço e ajuste a ordem nas situações especiais.'
    ],
    // removed extra scenario; keep only canonical and service-request hints
    'new-service-request': [
      'Novos serviços geralmente começam com uma demanda do cliente (Engage).',
      'Depois de entender a necessidade, planejamos os detalhes.',
      'Pense: ouvir cliente → planejar → desenhar → construir → entregar → melhorar'
    ]
  },
  phase2: {
    general: [
      'Cada atividade tem práticas específicas que a suportam!',
      'Pense no objetivo da atividade e quais práticas ajudam a alcançá-lo.',
      'Service Desk e Incidentes são operacionais - entregam e suportam!',
      'Gestão de Problemas busca melhoria contínua.',
      'Mudanças e Releases fazem parte do design e transição.'
    ]
  },
  phase3: {
    general: [
      'Leia o cenário com atenção - qual é a necessidade imediata?',
      'Mudanças estratégicas começam no topo: Planejamento!',
      'Problemas operacionais urgentes vão para Entregar e Suportar.',
      'Relacionamentos externos são território do Engajar.'
    ]
  }
};

const GAME_META = {
  title: '🎮 ITIL Quest: A Jornada do Serviço',
  subtitle: 'Aventure-se pelo mundo mágico do gerenciamento de serviços!',
  version: '2.0 - Edição Lúdica',
  phases: [
    { 
      id: 'phase1', 
      label: '🔄 Sequência de Fluxo', 
      subtitle: 'Ordene e conquiste!',
      icon: '🎯',
      difficulty: 'Iniciante'
    },
    { 
      id: 'phase2', 
      label: '🔗 Conexão de Conceitos', 
      subtitle: 'Una os pontos!',
      icon: '🧩',
      difficulty: 'Intermediário'
    },
    { 
      id: 'phase3', 
      label: '🎭 Escolha do Caminho', 
      subtitle: 'Decida sabiamente!',
      icon: '🗺️',
      difficulty: 'Avançado'
    }
  ],
  activities: ACTIVITIES,
  achievements: ACHIEVEMENTS
};

// Config: XP por nível (constante para progressão linear)
const XP_PER_LEVEL = 100;

// 🎲 Funções Auxiliares
function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getPlayerSession(playerId) {
  if (!playerSessions.has(playerId)) {
    playerSessions.set(playerId, {
      id: playerId,
      name: `Jogador ${playerId.slice(0, 6)}`,
      level: 1,
      xp: 0,
      totalScore: 0,
      achievements: [],
      combo: 0,
      maxCombo: 0,
      questionsCompleted: 0,
      perfectAnswers: 0,
      hintsUsed: 0,
      startTime: Date.now(),
      lastActivity: Date.now(),
      stats: {
        phase1: { attempts: 0, correct: 0, avgTime: 0 },
        phase2: { attempts: 0, correct: 0, avgScore: 0 },
        phase3: { attempts: 0, correct: 0, consecutiveCorrect: 0 }
      }
    });
  }
  
  const session = playerSessions.get(playerId);
  session.lastActivity = Date.now();
  return session;
}

function awardAchievement(session, achievementId) {
  if (!session.achievements.includes(achievementId)) {
    session.achievements.push(achievementId);
    const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
    return { 
      unlocked: true, 
      achievement,
      message: `🎉 Conquista desbloqueada: ${achievement.emoji} ${achievement.name}!` 
    };
  }
  return { unlocked: false };
}

function calculateXP(baseXP, combo, perfect) {
  let xp = baseXP;
  if (perfect) xp *= 2;
  xp += combo * 10;
  return Math.floor(xp);
}

// Award XP and return xp awarded, wrapped for safety and consistent checks
function awardXP(session, baseXP, combo = 0, perfect = false) {
  if (!session) return 0;
  const xpGained = calculateXP(baseXP, combo, perfect);
  session.xp += xpGained;
  return xpGained;
}

function checkLevelUp(session) {
  let leveled = false;
  while (session.xp >= XP_PER_LEVEL) {
    session.xp -= XP_PER_LEVEL;
    session.level++;
    leveled = true;
  }
  if (leveled) {
    return {
      leveledUp: true,
      newLevel: session.level,
      message: `🎊 LEVEL UP! Você alcançou o nível ${session.level}!`
    };
  }
  return { leveledUp: false };
}

// Verifica se um jogador tem nível mínimo para acessar uma fase
function ensurePlayerMinLevel(req, minLevel) {
  const playerId = req.body?.playerId || req.query?.playerId || req.params?.playerId;
  if (!playerId) return { ok: false, status: 400, message: 'playerId is required to check level' };
  const session = playerSessions.get(playerId);
  if (!session) return { ok: false, status: 404, message: 'session not found' };
  if ((session.level || 1) < minLevel) return { ok: false, status: 403, message: `Seu nível atual é ${session.level}. Nível ${minLevel} necessário.` };
  return { ok: true, session };
}

// Verifica se o jogador tem o nível exato (ou permitido) para acessar uma fase
function ensurePlayerAllowedForPhase(req, phase) {
  const playerId = req.body?.playerId || req.query?.playerId || req.params?.playerId;
  if (!playerId) return { ok: false, status: 400, message: 'playerId is required to check access' };
  const session = playerSessions.get(playerId);
  if (!session) return { ok: false, status: 404, message: 'session not found' };
  const mapping = { phase1: [1], phase2: [2], phase3: [3] };
  const allowed = mapping[phase] || [1];
  if (!allowed.includes(session.level)) return { ok: false, status: 403, message: `Seu nível atual é ${session.level}. ${phase} disponível apenas para ${allowed.join(', ')}.` };
  return { ok: true, session };
}

// 🌐 API Endpoints

app.get('/api/health', (req, res) => {
  const activePlayers = playerSessions.size;
  const totalQuestions = Array.from(playerSessions.values())
    .reduce((sum, s) => sum + s.questionsCompleted, 0);
  
  res.json({ 
    status: '✅ Tudo funcionando perfeitamente!',
    uptime: Math.floor(process.uptime()),
    mood: '😊',
    activePlayers,
    totalQuestionsAnswered: totalQuestions,
    message: 'O servidor está animado para jogar! 🎮'
  });
});

app.get('/api/meta', (req, res) => {
  res.json(GAME_META);
});

app.get('/api/activities', (req, res) => {
  res.json(ACTIVITIES);
});

// 🎮 Sistema de Jogador
app.post('/api/player/init', (req, res) => {
  const { playerId, playerName } = req.body || {};
  const id = playerId || `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const session = getPlayerSession(id);
  
  if (playerName) {
    session.name = playerName;
  }
  
  res.json({
    session,
    welcome: `🎮 Bem-vindo(a), ${session.name}! Prepare-se para uma jornada épica pelo ITIL!`,
    tip: '💡 Complete desafios para ganhar XP, subir de nível e desbloquear conquistas!'
  });
});

app.get('/api/player/:playerId/stats', (req, res) => {
  const session = getPlayerSession(req.params.playerId);
  const playTime = Math.floor((Date.now() - session.startTime) / 1000 / 60);
  
  res.json({
    ...session,
    playTime: `${playTime} minutos`,
    nextLevel: {
      level: session.level + 1,
      xpNeeded: XP_PER_LEVEL,
      xpCurrent: session.xp,
      progress: Math.floor((session.xp / XP_PER_LEVEL) * 100)
    },
    ranking: session.level >= 10 ? '🧙 Guru' : 
             session.level >= 7 ? '🏆 Mestre' :
             session.level >= 5 ? '⭐ Especialista' :
             session.level >= 3 ? '🎯 Praticante' : '🌱 Aprendiz'
  });
});

app.get('/api/player/:playerId/achievements', (req, res) => {
  const session = getPlayerSession(req.params.playerId);
  const unlockedAchievements = ACHIEVEMENTS.filter(a => session.achievements.includes(a.id));
  const lockedAchievements = ACHIEVEMENTS.filter(a => !session.achievements.includes(a.id));
  
  res.json({
    unlocked: unlockedAchievements,
    locked: lockedAchievements.map(a => ({ ...a, status: '🔒 Bloqueado' })),
    progress: `${unlockedAchievements.length}/${ACHIEVEMENTS.length}`,
    percentage: Math.floor((unlockedAchievements.length / ACHIEVEMENTS.length) * 100)
  });
});

// 🎯 FASE 1 - Sequência de Fluxo (com sistema lúdico)

app.get('/api/phase1/questions', (req, res) => {
  const payload = PHASE1_QUESTIONS.map(q => ({
    id: q.id,
    title: `🎯 ${q.title}`,
    description: q.description,
    choices: shuffledChoicesForQuestion(q.id),
    difficulty: q.id === 'svc-canonical' ? '⭐ Iniciante' : 
                q.id === 'new-service-request' ? '⭐⭐ Intermediário' : '⭐ Iniciante',
    emoji: '🔄'
  }));
  res.json({
    questions: payload,
    message: '🚀 Vamos começar! Ordene as atividades no fluxo correto!',
    tip: '💡 Use /api/phase1/hint/:questionId se precisar de ajuda!'
  });
});

app.get('/api/phase1/hint/:questionId', (req, res) => {
  const { questionId } = req.params;
  const { playerId } = req.query;
  
  const q = PHASE1_QUESTIONS.find(x => x.id === questionId);
  if (!q) return res.status(400).json({ error: '❌ Questão não encontrada!' });
  
  const hints = HINTS.phase1[questionId] || HINTS.phase1['svc-canonical'];
  const hint = getRandomElement(hints);
  
  if (playerId) {
    const session = getPlayerSession(playerId);
    session.hintsUsed++;
  }
  
  res.json({
    hint: `💡 Dica: ${hint}`,
    emoji: '🤔',
    encouragement: 'Você consegue! Continue tentando!'
  });
});

app.post('/api/phase1/validate', (req, res) => {
  const { questionId, answer, playerId } = req.body || {};
  const q = PHASE1_QUESTIONS.find(x => x.id === questionId);
  
  if (!q) return res.status(400).json({ error: '❌ questionId inválido' });
  if (!Array.isArray(answer) || answer.length !== q.correctOrder.length) {
    return res.status(400).json({ 
      error: '❌ answer deve ser um array com 6 ids de atividades',
      tip: '💡 Verifique se enviou todas as atividades na ordem correta!'
    });
  }
  
  const { isExact, diffs } = compareOrder(q.correctOrder, answer);
  const correctCount = diffs.filter(d => d.expected === d.got).length;
  const accuracy = Math.floor((correctCount / q.correctOrder.length) * 100);
  
  let response = {
    correct: isExact,
    diffs,
    correctOrder: q.correctOrder,
    accuracy: `${accuracy}%`,
    score: correctCount * 10
  };
  
  // Sistema de feedback lúdico
  if (isExact) {
    response.feedback = getRandomElement(ENCOURAGEMENT.perfect);
    response.emoji = '🌟';
    response.bonus = '🎁 +50 pontos de bônus por acerto perfeito!';
  } else if (accuracy >= 70) {
    response.feedback = getRandomElement(ENCOURAGEMENT.good);
    response.emoji = '👍';
    response.tip = 'Quase perfeito! Revise as posições destacadas.';
  } else if (accuracy >= 40) {
    response.feedback = getRandomElement(ENCOURAGEMENT.needsWork);
    response.emoji = '🤔';
    response.tip = `Use /api/phase1/hint/${questionId} para obter uma dica!`;
  } else {
    response.feedback = getRandomElement(ENCOURAGEMENT.retry);
    response.emoji = '💪';
      response.points = 0;
    response.tip = 'Não desista! Todo mestre errou antes de acertar!';
  }
  
  // Sistema de progresso do jogador
  if (playerId) {
    const session = getPlayerSession(playerId);
    session.stats.phase1.attempts++;
    
    if (isExact) {
      session.stats.phase1.correct++;
      session.questionsCompleted++;
      session.combo++;
      session.maxCombo = Math.max(session.maxCombo, session.combo);
      
      // XP e conquistas
      const xpGained = awardXP(session, 50, session.combo, true);
      session.totalScore += response.score + 50;
      
      response.xpGained = xpGained;
      // normalize points to be displayed consistently
      response.points = response.score + 50; // base points (correctCount*10) + perfect bonus
      response.combo = session.combo;
      response.comboMessage = session.combo > 1 ? `🔥 COMBO x${session.combo}!` : null;
      
      // Conquistas
      const achievements = [];
      if (session.questionsCompleted === 1) {
        achievements.push(awardAchievement(session, 'first-steps'));
      }
      if (session.stats.phase1.correct === 1 && session.stats.phase1.attempts === 1) {
        achievements.push(awardAchievement(session, 'perfect-sequence'));
      }
      if (session.combo >= 5) {
        achievements.push(awardAchievement(session, 'combo-master'));
      }
      
      response.achievements = achievements.filter(a => a.unlocked);
      
      // Level up
      const levelUp = checkLevelUp(session);
      if (levelUp.leveledUp) {
        response.levelUp = levelUp;
      }
      
      response.playerStats = {
        level: session.level,
        xp: session.xp,
        combo: session.combo,
        totalScore: session.totalScore
      };
      response.points = response.points || 0;
    } else {
      session.combo = 0;
      if (session.stats.phase1.attempts >= 3 && !session.achievements.includes('persistent')) {
        const achievement = awardAchievement(session, 'persistent');
        if (achievement.unlocked) {
          response.achievements = [achievement];
        }
      }
    }
  }
  
  res.json(response);
});

// 🔗 FASE 2 - Conexão de Conceitos (com sistema lúdico)

app.get('/api/phase2/options', (req, res) => {
  // Block phase 2 for players under level 2
  const check = ensurePlayerMinLevel(req, 2);
  if (!check.ok) return res.status(check.status).json({ error: check.message });

  res.json({ 
    activities: ACTIVITIES.map(a => ({ ...a, emoji: '🎯' })),
    practices: PRACTICES.map(p => ({ ...p, emoji: '⚙️' })),
    message: '🧩 Conecte as práticas com suas atividades principais!',
    tip: '💡 Pense no objetivo de cada prática para encontrar sua atividade!'
  });
});

app.get('/api/phase2/hint', (req, res) => {
  const hints = HINTS.phase2.general;
  const hint = getRandomElement(hints);
  
  res.json({
    hint: `💡 Dica: ${hint}`,
    emoji: '🤔',
    extraTips: [
      '🎯 Operacional = Entregar e Suportar',
      '📈 Melhoria = Improve',
      '🎨 Design e mudanças = Design & Transition',
      '🏗️ Construção = Obtain/Build',
      '📋 Estratégia = Plan',
      '🤝 Relacionamentos = Engage'
    ]
  });
});

app.post('/api/phase2/validate', (req, res) => {
  // Security: only players of level >= 2 can validate phase 2
  const check = ensurePlayerMinLevel(req, 2);
  if (!check.ok) return res.status(check.status).json({ error: check.message });
  const { activityId, selectedPracticeIds, playerId } = req.body || {};
  
  if (!ACTIVITY_BY_ID[activityId]) {
    return res.status(400).json({ error: '❌ activityId inválido' });
  }
  
  const validIds = new Set(PRACTICES.map(p => p.id));
  const submitted = Array.isArray(selectedPracticeIds) ? selectedPracticeIds.filter(id => validIds.has(id)) : [];
  const correctSet = new Set(PRACTICES.filter(p => p.primaryActivityId === activityId).map(p => p.id));

  const correctMatches = submitted.filter(id => correctSet.has(id));
  const wrongSelections = submitted.filter(id => !correctSet.has(id));
  const missed = [...correctSet].filter(id => !submitted.includes(id));
  const score = correctSet.size === 0 ? 0 : (correctMatches.length / correctSet.size);
  const percentage = Math.floor(score * 100);
  
  let response = {
    correctMatches,
    wrongSelections,
    missed,
    score,
    percentage: `${percentage}%`,
    activityLabel: ACTIVITY_BY_ID[activityId].label
  };
  
  // Feedback lúdico
  const isPerfect = score === 1 && wrongSelections.length === 0;
  const isGood = score >= 0.7;
  const needsWork = score < 0.5;
  
  if (isPerfect) {
    response.feedback = getRandomElement(ENCOURAGEMENT.perfect);
    response.emoji = '🌟';
    response.message = `Conexão perfeita com ${ACTIVITY_BY_ID[activityId].label}! 🎯`;
    response.bonus = '🎁 +100 pontos de bônus!';
  } else if (isGood) {
    response.feedback = getRandomElement(ENCOURAGEMENT.good);
    response.emoji = '👍';
    response.message = 'Quase perfeito! Revise as práticas destacadas.';
  } else if (needsWork) {
    response.feedback = getRandomElement(ENCOURAGEMENT.needsWork);
    response.emoji = '🤔';
    response.tip = 'Use /api/phase2/hint para obter dicas gerais!';
  } else {
    response.feedback = getRandomElement(ENCOURAGEMENT.retry);
    response.emoji = '💪';
  }
  
  // Sistema de progresso do jogador
  if (playerId) {
    const session = getPlayerSession(playerId);
    session.stats.phase2.attempts++;
    session.stats.phase2.avgScore = 
      (session.stats.phase2.avgScore * (session.stats.phase2.attempts - 1) + score) / session.stats.phase2.attempts;
    
    if (isPerfect) {
      session.stats.phase2.correct++;
      session.questionsCompleted++;
      session.combo++;
      session.maxCombo = Math.max(session.maxCombo, session.combo);
      
      const xpGained = awardXP(session, 75, session.combo, true);
      session.totalScore += 100;
      response.points = 100;
      
      response.xpGained = xpGained;
      response.combo = session.combo;
      response.comboMessage = session.combo > 1 ? `🔥 COMBO x${session.combo}!` : null;
      
      // Conquistas
      const achievements = [];
      if (!session.achievements.includes('master-connector')) {
        achievements.push(awardAchievement(session, 'master-connector'));
      }
      if (session.combo >= 5) {
        achievements.push(awardAchievement(session, 'combo-master'));
      }
      
      response.achievements = achievements.filter(a => a.unlocked);
      
      // Level up
      const levelUp = checkLevelUp(session);
      if (levelUp.leveledUp) {
        response.levelUp = levelUp;
      }
      
      response.playerStats = {
        level: session.level,
        xp: session.xp,
        combo: session.combo,
        totalScore: session.totalScore
      };
    } else {
      session.combo = 0;
      const xpGained = awardXP(session, Math.floor(score * 30), 0, false);
      response.xpGained = xpGained;
      const levelUp = checkLevelUp(session);
      if (levelUp.leveledUp) response.levelUp = levelUp;
      response.playerStats = {
        level: session.level,
        xp: session.xp,
        combo: session.combo,
        totalScore: session.totalScore
      };
      // award partial points for non-perfect answers to provide continuous feedback
      const partialPoints = Math.floor(score * 100);
      if (partialPoints > 0) {
        session.totalScore += partialPoints;
        response.points = partialPoints;
      }
    }
  }
  
  res.json(response);
});

// 🎭 FASE 3 - Escolha do Caminho (com sistema lúdico)

app.get('/api/phase3/scenarios', (req, res) => {
  // Block Phase 3 for players below level 3
  const check = ensurePlayerMinLevel(req, 3);
  if (!check.ok) return res.status(check.status).json({ error: check.message });

  const payload = PHASE3_SCENARIOS.map(s => ({ 
    id: s.id, 
    input: `🎭 ${s.input}`, 
    options: ACTIVITIES.map(a => ({ ...a, emoji: '🎯' })),
    emoji: '🗺️'
  }));
  
  res.json({
    scenarios: payload,
    message: '🗺️ Escolha sabiamente! Cada decisão importa!',
    tip: '💡 Leia o cenário com atenção e pense na urgência e tipo de ação necessária!'
  });
});

app.get('/api/phase3/hint', (req, res) => {
  const hints = HINTS.phase3.general;
  const hint = getRandomElement(hints);
  
  res.json({
    hint: `💡 Dica: ${hint}`,
    emoji: '🤔',
    strategicTips: [
      '🎯 Estratégico/Alto nível → Plan',
      '🚨 Urgência operacional → Deliver & Support',
      '🤝 Parceiros/Fornecedores → Engage',
      '🎨 Mudanças planejadas → Design & Transition',
      '🏗️ Construção/Aquisição → Obtain/Build',
      '📊 Análise de causas → Improve'
    ]
  });
});

app.post('/api/phase3/validate', (req, res) => {
  // Security: only players of level >= 3 can validate phase 3
  const check = ensurePlayerMinLevel(req, 3);
  if (!check.ok) return res.status(check.status).json({ error: check.message });
  const { scenarioId, choiceActivityId, playerId } = req.body || {};
  const s = PHASE3_SCENARIOS.find(x => x.id === scenarioId);
  
  if (!s) return res.status(400).json({ error: '❌ scenarioId inválido' });
  if (!ACTIVITY_BY_ID[choiceActivityId]) {
    return res.status(400).json({ error: '❌ choiceActivityId inválido' });
  }
  
  const correct = s.correctActivityId === choiceActivityId;
  
  let response = {
    correct,
    correctActivityId: s.correctActivityId,
    correctActivity: ACTIVITY_BY_ID[s.correctActivityId].label,
    chosenActivity: ACTIVITY_BY_ID[choiceActivityId].label,
    explanation: `💬 ${s.explanation}`,
    nextInput: correct ? s.nextInput : undefined
  };
  
  // Feedback lúdico
  if (correct) {
    response.feedback = getRandomElement(ENCOURAGEMENT.perfect);
    response.emoji = '🎯';
    response.message = 'Decisão perfeita! Você entendeu o contexto! 🌟';
    response.bonus = '🎁 +150 pontos!';
    } else {
    response.feedback = getRandomElement(ENCOURAGEMENT.retry);
    response.emoji = '🤔';
    response.tip = 'Analise o tipo de situação: é estratégica, operacional ou relacionada a parcerias?';
    response.encouragement = 'Não desanime! Decisões difíceis fazem parte do aprendizado! 💪';
  }
  
  // Sistema de progresso do jogador
  if (playerId) {
    const session = getPlayerSession(playerId);
    session.stats.phase3.attempts++;
    
    if (correct) {
      session.stats.phase3.correct++;
      session.stats.phase3.consecutiveCorrect++;
      session.questionsCompleted++;
      session.combo++;
      session.maxCombo = Math.max(session.maxCombo, session.combo);
      
      const xpGained = awardXP(session, 100, session.combo, true);
      session.totalScore += 150;
      response.points = 150;
      
      response.xpGained = xpGained;
      response.combo = session.combo;
      response.comboMessage = session.combo > 1 ? `🔥 COMBO x${session.combo}!` : null;
      
      // Conquistas
      const achievements = [];
      if (session.stats.phase3.consecutiveCorrect >= 5) {
        achievements.push(awardAchievement(session, 'wise-decision'));
      }
      if (session.combo >= 5) {
        achievements.push(awardAchievement(session, 'combo-master'));
      }
      
      // Verifica se é um ITIL Guru
      const allPerfect = 
        session.stats.phase1.correct > 0 &&
        session.stats.phase2.correct > 0 &&
        session.stats.phase3.correct > 0 &&
        session.stats.phase1.correct / session.stats.phase1.attempts >= 0.8 &&
        session.stats.phase2.avgScore >= 0.8 &&
        session.stats.phase3.correct / session.stats.phase3.attempts >= 0.8;
      
      if (allPerfect && session.questionsCompleted >= 10) {
        achievements.push(awardAchievement(session, 'itil-guru'));
      }
      
      response.achievements = achievements.filter(a => a.unlocked);
      
      // Level up
      const levelUp = checkLevelUp(session);
      if (levelUp.leveledUp) {
        response.levelUp = levelUp;
      }
      
      response.playerStats = {
        level: session.level,
        xp: session.xp,
        combo: session.combo,
        totalScore: session.totalScore,
        consecutiveCorrect: session.stats.phase3.consecutiveCorrect
      };
    } else {
      session.combo = 0;
      session.stats.phase3.consecutiveCorrect = 0;
      const xpGained = awardXP(session, 20, 0, false);
      response.xpGained = xpGained;
      response.consolation = '💙 +20 XP por tentar! Continue praticando!';
      const levelUp = checkLevelUp(session);
      if (levelUp.leveledUp) response.levelUp = levelUp;
      response.playerStats = {
        level: session.level,
        xp: session.xp,
        combo: session.combo,
        totalScore: session.totalScore
      };
      response.points = 0;
    }
  }
  
  res.json(response);
});

// 🎮 Easter Eggs e Diversão

app.get('/api/easteregg/motivate', (req, res) => {
  const motivations = [
    '🌟 Você é incrível! Continue assim!',
    '🚀 Rumo ao infinito e além!',
    '💪 Cada desafio é uma oportunidade de crescer!',
    '🎯 Foco, força e fé! Você consegue!',
    '✨ Seu potencial é ilimitado!',
    '🦸 Você é o herói da sua própria jornada!',
    '🌈 Depois da tempestade, vem o arco-íris!',
    '🔥 Você está pegando fogo! (no bom sentido!)',
    '🎊 Cada dia é uma nova chance de brilhar!',
    '💎 Você é raro e valioso como um diamante!'
  ];
  
  res.json({
    motivation: getRandomElement(motivations),
    emoji: '😊',
    message: 'Sempre que precisar de ânimo, estou aqui!',
    // NOTE: no XP is awarded here - motivation is just encouragement
  });
});

app.get('/api/easteregg/joke', (req, res) => {
  const jokes = [
    { 
      setup: 'Por que o servidor estava com frio?', 
      punchline: 'Porque deixaram muitas janelas abertas! 🪟' 
    },
    { 
      setup: 'Por que os programadores preferem o modo escuro?', 
      punchline: 'Porque a luz atrai bugs! 🐛' 
    },
    { 
      setup: 'Como o ITIL organiza uma festa?', 
      punchline: 'Com muito planejamento e um service desk para receber os convidados! 🎉' 
    },
    { 
      setup: 'Por que o incident vivia estressado?', 
      punchline: 'Porque todo mundo queria resolvê-lo rapidamente! ⚡' 
    },
    { 
      setup: 'O que o Change Management disse para o problema?', 
      punchline: '"Você precisa passar pelo nosso processo de aprovação!" 📋' 
    }
  ];
  
  const joke = getRandomElement(jokes);
  
  res.json({
    ...joke,
    emoji: '😄',
    message: 'Rir é importante para aprender melhor!',
    bonus: '🎁 +5 XP por rir! (Comprovado cientificamente*)',
    disclaimer: '*Pode não ser comprovado cientificamente 😅'
  });
});

app.get('/api/leaderboard', (req, res) => {
  const players = Array.from(playerSessions.values())
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 10)
    .map((p, index) => ({
      rank: index + 1,
      emoji: index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅',
      name: p.name,
      level: p.level,
      score: p.totalScore,
      maxCombo: p.maxCombo,
      achievements: p.achievements.length
    }));
  
  res.json({
    title: '🏆 Ranking dos Mestres ITIL',
    leaderboard: players,
    totalPlayers: playerSessions.size,
    message: players.length > 0 ? 
      'Esses são os guerreiros que dominam o ITIL Quest!' : 
      'Seja o primeiro no ranking! 🚀'
  });
});

app.use((req, res) => { 
  res.status(404).json({ 
    error: '🤔 Ops! Rota não encontrada!',
    message: 'Parece que você se perdeu na jornada...',
    tip: 'Verifique a documentação da API ou use /api/meta para ver as rotas disponíveis!',
    emoji: '🗺️'
  }); 
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: '😱 Algo deu errado!',
    message: 'Nossos engenheiros já foram notificados!',
    emoji: '🔧',
    encouragement: 'Não se preocupe, vamos resolver isso rapidinho!'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => { 
  console.log(`
  ╔════════════════════════════════════════════════════╗
  ║                                                    ║
  ║   🎮 ITIL QUEST - SERVIDOR LÚDICO INICIADO! 🎮    ║
  ║                                                    ║
  ║   🚀 Porta: ${PORT}                                   ║
  ║   ✨ Status: Pronto para a aventura!              ║
  ║   🎯 Modo: Super Interativo e Divertido           ║
  ║                                                    ║
  ║   Recursos Disponíveis:                           ║
  ║   • 🏆 Sistema de Conquistas                      ║
  ║   • ⭐ Níveis e XP                                 ║
  ║   • 🔥 Combos de Acertos                          ║
  ║   • 💡 Sistema de Dicas                           ║
  ║   • 😊 Feedback Encorajador                       ║
  ║   • 🎭 Easter Eggs                                ║
  ║   • 📊 Estatísticas Detalhadas                    ║
  ║                                                    ║
  ║   Bora jogar? 🎊                                  ║
  ║                                                    ║
  ╚════════════════════════════════════════════════════╝
  `);
});
