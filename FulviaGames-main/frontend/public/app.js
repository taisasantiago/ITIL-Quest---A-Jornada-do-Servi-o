const API_BASE = 'http://localhost:3000/api';

// ============================================
// ESTADO GLOBAL
// ============================================
const state = {
  playerId: localStorage.getItem('itil-quest-player-id'),
  playerData: null,
  meta: null,
  p1Questions: [],
  p1Answer: [],
  p2Data: { activities: [], practices: [] },
  p3Scenarios: [],
  p3Choice: null,
  currentQuestion: null,
  currentActivity: null,
  currentScenario: null,
};

// ============================================
// FUNÇÕES AUXILIARES
// ============================================
async function getJson(path, options = {}) {
  console.log('Fazendo requisição para:', `${API_BASE}${path}`, options);
  try {
    const res = await fetch(`${API_BASE}${path}`, options);
    console.log('Status da resposta:', res.status, res.statusText);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const json = await res.json();
    console.log('Dados recebidos:', json);
    return json;
  } catch (error) {
    console.error('Erro em getJson:', error);
    throw error;
  }
}

// Handler dedicado para o botão "Começar Aventura"
async function handleStartGameClick(e) {
  e?.preventDefault?.();
  console.log('[handleStartGameClick] Disparado');

  const modal = document.getElementById('welcome-modal');
  const input = document.getElementById('player-name-input');
  const playerName = input?.value?.trim() || 'Jogador Anônimo';

  console.log('[handleStartGameClick] Nome do jogador:', playerName);

  try {
    console.log('[handleStartGameClick] POST /player/init');
    const response = await getJson('/player/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerName })
    });

    console.log('[handleStartGameClick] Resposta recebida:', response);
    state.playerId = response.session.id;
    state.playerData = response.session;
    localStorage.setItem('itil-quest-player-id', state.playerId);

    console.log('[handleStartGameClick] Ocultando modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
    showGlobalMessage(response.welcome, 'success', '🎉');
    updatePlayerUI();
    // Abrir fase inicial por padrão
    showView('phase1');
  } catch (error) {
    console.error('[handleStartGameClick] Erro na requisição:', error);
    showGlobalMessage('Erro ao criar sessão. Verifique se o servidor está rodando!', 'error', '❌');
  }
}

function showView(viewId) {
  // Prevent navigation to locked phases
  if (viewId && viewId.startsWith('phase')) {
    const minForView = viewId === 'phase1' ? 1 : viewId === 'phase2' ? 2 : viewId === 'phase3' ? 3 : 1;
    const level = state.playerData?.level || 1;
    if (level < minForView) {
        showGlobalMessage(`Acesso bloqueado: alcance nível ${minForView} para desbloquear ${viewId}.`, 'warning', '🔒');
      return;
    }
  }
  console.log('[showView] chamado com:', viewId);
  const views = document.querySelectorAll('.view');
  console.log('[showView] total de views:', views.length);
  views.forEach(view => {
    if (!view.classList.contains('hidden')) {
      console.log('[showView] ocultando:', view.id);
    }
    view.classList.add('hidden');
    // Apenas force inline display para elementos de view
    if (view.classList.contains('view')) {
      view.style.display = 'none';
    }
  });

  const targetView = document.getElementById(viewId);
  if (targetView) {
  console.log('[showView] exibindo alvo:', targetView.id, 'classes:', [...targetView.classList]);
  targetView.classList.remove('hidden');
  // Apenas force inline display para elementos de view; para modal, deixe o CSS cuidar
  if (targetView.classList.contains('view')) {
    targetView.style.display = 'block';
  } else if (viewId === 'welcome-modal') {
    targetView.style.display = 'flex';
  }
    // Se alguém chamar showView para o modal de boas-vindas,
    // garantimos que o botão esteja com handler ligado
    if (viewId === 'welcome-modal') {
      console.log('[showView] garantindo binding do botão de começar...');
      const startBtn = document.getElementById('start-game-btn');
      if (startBtn && startBtn.dataset.bound !== '1') {
        console.log('[showView] (re)ligando handler do botão de começar via showView');
        startBtn.addEventListener('click', handleStartGameClick);
        startBtn.onclick = handleStartGameClick;
        startBtn.dataset.bound = '1';
      }
    }
  } else {
    console.error(`[showView] View com ID '${viewId}' não encontrada.`);
  }
}

function showGlobalMessage(message, type = 'info', emoji = '💬') {
  const messageDiv = document.getElementById('global-message');
  messageDiv.innerHTML = `
    <div class="message-content ${type} animate-slide-in">
      <span class="message-emoji">${emoji}</span>
      <span class="message-text">${message}</span>
    </div>
  `;
  messageDiv.classList.add('show');
  
  setTimeout(() => messageDiv.classList.remove('show'), 5000);
}

function labelOf(activityId) {
  const act = (state.meta?.activities || []).find(a => a.id === activityId);
  return act ? act.label : activityId;
}

// ============================================
// SISTEMA DE JOGADOR
// ============================================
async function initPlayer() {
  console.log('Iniciando initPlayer...');
  console.log('state.playerId do localStorage:', localStorage.getItem('itil-quest-player-id'));
  console.log('state.playerId atual:', state.playerId);
  
  const modal = document.getElementById('welcome-modal');
  const input = document.getElementById('player-name-input');
  const startBtn = document.getElementById('start-game-btn');

  console.log('Elementos encontrados:', { modal, input, startBtn });

  if (state.playerId) {
    console.log('Jogador já existe, ocultando modal...');
    modal.classList.add('hidden');
    await loadPlayerData();
    return;
  }

  console.log('Novo jogador, mostrando modal de boas-vindas...');
  modal.classList.remove('hidden');
  
  if (!startBtn) {
    console.error('startBtn não encontrado! Verifique o HTML.');
  } else {
    if (startBtn.dataset.bound !== '1') {
      console.log('Ligando handler do botão de começar...');
      startBtn.addEventListener('click', handleStartGameClick);
      // Fallback extra por segurança
      startBtn.onclick = handleStartGameClick;
      startBtn.dataset.bound = '1';
      startBtn.disabled = false;
      startBtn.style.cursor = 'pointer';
    } else {
      console.log('Handler do botão de começar já estava ligado.');
    }
  }
  
  input.addEventListener('keypress', (e) => {
    console.log('[initPlayer] keypress no input:', e.key);
    if (e.key === 'Enter') startBtn.click();
  });
}

async function loadPlayerData() {
  if (!state.playerId) return;
  
  try {
    const stats = await getJson(`/player/${state.playerId}/stats`);
    state.playerData = stats;
    updatePlayerUI();
  } catch (error) {
    console.error('Erro ao carregar dados do jogador:', error);
  }
}

function updatePlayerUI() {
  if (!state.playerData) return;
  
  const data = state.playerData;
  
  document.getElementById('player-name').textContent = data.name;
  document.getElementById('player-level-badge').textContent = `Nível ${data.level}`;
  document.getElementById('player-ranking').textContent = data.ranking || '🌱 Aprendiz';
  
  const xpNeeded = data.nextLevel?.xpNeeded || data.level * 100;
  const xpCurrent = data.nextLevel?.xpCurrent ?? data.xp;
  const xpProgress = data.nextLevel?.progress || Math.floor((xpCurrent / xpNeeded) * 100);
  
  document.getElementById('xp-bar').style.width = `${xpProgress}%`;
  document.getElementById('xp-text').textContent = `${xpCurrent}/${xpNeeded}`;
  document.getElementById('total-score').textContent = data.totalScore.toLocaleString();
  
  const achievementsCount = data.achievements?.length || 0;
  document.getElementById('achievements-count').textContent = `${achievementsCount}/8`;
  
  if (data.combo > 0) {
    document.getElementById('combo-indicator').innerHTML = `
      <div class="combo-fire pulse-animation">
        🔥 COMBO x${data.combo}!
      </div>
    `;
  } else {
    document.getElementById('combo-indicator').innerHTML = '';
  }

  // Phase gating: allow phases based on minimum player level (cumulative unlocking)
  const phaseMinLevel = { phase1: 1, phase2: 2, phase3: 3 };
  document.querySelectorAll('nav button[data-view]').forEach(btn => {
    const view = btn.getAttribute('data-view');
    const required = phaseMinLevel[view] || 1;
    if (data.level >= required) {
      btn.removeAttribute('disabled');
      btn.classList.remove('locked');
      btn.title = '';
    } else {
      btn.setAttribute('disabled', 'disabled');
      btn.classList.add('locked');
      btn.title = `Bloqueado — alcance nível ${required} para desbloquear`;
    }
  });
}

// ============================================
// ANIMAÇÕES E MODAIS
// ============================================
function showAchievementModal(achievementData) {
  if (!achievementData.unlocked) return;
  
  const modal = document.getElementById('achievement-modal');
  modal.innerHTML = `
    <div class="achievement-content animate-zoom-in">
      <div class="achievement-glow"></div>
      <div class="achievement-emoji">${achievementData.achievement.emoji}</div>
      <h2>🎉 Conquista Desbloqueada!</h2>
      <h3>${achievementData.achievement.name}</h3>
      <p>${achievementData.achievement.description}</p>
      <button class="btn-primary close-modal">Incrível! ✨</button>
    </div>
  `;
  modal.classList.remove('hidden');
  // Close button handled via modal delegation (see DOMContentLoaded handlers)
  // Removed auto-hide: user must close achievements manually by pressing the button
}

function showLevelUpModal(levelUpData) {
  const modal = document.getElementById('levelup-overlay');
  modal.innerHTML = `
    <div class="levelup-content animate-scale-in">
      <div class="levelup-sparkles">✨✨✨</div>
      <h1 class="levelup-text">LEVEL UP!</h1>
      <div class="new-level">
        <span class="level-number">${levelUpData.newLevel}</span>
      </div>
      <p>${levelUpData.message}</p>
      <div class="levelup-rays"></div>
    </div>
  `;
  modal.classList.remove('hidden');
  setTimeout(() => modal.classList.add('hidden'), 3000);
}

function displayFeedback(result, targetElement) {
  const isSuccess = result.correct || result.score === 1;
  const emoji = result.emoji || (isSuccess ? '🌟' : '🤔');
  
  let html = `
    <div class="feedback-card ${isSuccess ? 'success' : 'partial'} animate-slide-in">
      <div class="feedback-emoji">${emoji}</div>
      <h3>${result.feedback || result.message || ''}</h3>
  `;
  
  if (result.accuracy) html += `<div class="feedback-stat">📊 Precisão: <strong>${result.accuracy}</strong></div>`;
  if (result.percentage) html += `<div class="feedback-stat">📈 Pontuação: <strong>${result.percentage}</strong></div>`;
  // Prefer server-provided points (normalized). Fallback to older score display if not present.
  if (result.points !== undefined && typeof result.points === 'number') {
    html += `<div class="feedback-stat">⭐ Pontos: <strong>+${result.points}</strong></div>`;
    // Immediately show points delta in the header for snappy feedback
    try {
      const totalEl = document.getElementById('total-score');
      const cur = parseInt(totalEl.textContent.replace(/\D/g, '')) || 0;
      const newTotal = cur + result.points;
      // smooth numeric counter
      animateNumber(totalEl, cur, newTotal, 700);
      // keep frontend state in sync while server stats are fetched
      if (state.playerData) state.playerData.totalScore = newTotal;
      // visual cue + floating token
      totalEl.classList.add('points-added');
      setTimeout(() => totalEl.classList.remove('points-added'), 900);
      showFloatingPoints(result.points, totalEl);
    } catch (e) {
      console.warn('[displayFeedback] não foi possível animar pontos', e);
    }
  } else if (result.score !== undefined && typeof result.score === 'number') {
    // legacy: some endpoints return fractional score; multiply to show relative points
    html += `<div class="feedback-stat">⭐ Pontos: <strong>+${Math.floor(result.score * 100)}</strong></div>`;
  }
  if (result.xpGained) html += `<div class="feedback-stat highlight">✨ XP Ganho: <strong>+${result.xpGained}</strong></div>`;

  // If coming from Phase 1, show expected order and user's order for clarity
  if (result.correctOrder && Array.isArray(result.correctOrder)) {
    const expected = result.correctOrder.map((id, idx) => `<li><strong>${idx + 1}.</strong> ${labelOf(id)}</li>`).join('');
    html += `<div class="feedback-section"><h4>🧭 Ordem Esperada</h4><ol>${expected}</ol></div>`;
  }
  if (result.diffs && Array.isArray(result.diffs)) {
    // Show a readable map of answers
    const gotList = result.diffs.map(d => `<li>${labelOf(d.got) || '—'} <small class="muted">(esperado: ${labelOf(d.expected)})</small></li>`).join('');
    html += `<div class="feedback-section"><h4>📝 Sua Ordem</h4><ol>${gotList}</ol></div>`;
  }
  if (result.bonus) html += `<div class="feedback-bonus">${result.bonus}</div>`;
  if (result.comboMessage) html += `<div class="feedback-combo">${result.comboMessage}</div>`;
  if (result.tip) html += `<div class="feedback-tip">💡 ${result.tip}</div>`;
  if (result.explanation) html += `<div class="feedback-explanation">${result.explanation}</div>`;
  if (result.correctActivity || result.correctActivityId) {
    html += `<div class="feedback-stat">✅ Resposta correta: <strong>${result.correctActivity || labelOf(result.correctActivityId)}</strong></div>`;
  }
  
  html += `</div>`;
  targetElement.innerHTML = html;
  
  if (result.achievements && result.achievements.length > 0) {
    result.achievements.forEach(ach => {
      if (ach.unlocked) setTimeout(() => showAchievementModal(ach), 500);
    });
    // Refresh achievements panel so unlocked achievements appear immediately
    try { loadAchievements(); } catch (e) { console.warn('[displayFeedback] loadAchievements failed', e); }
  }
  
  if (result.levelUp && result.levelUp.leveledUp) {
    setTimeout(() => showLevelUpModal(result.levelUp), 1000);
  }
  
  if (result.playerStats) {
    state.playerData = { ...state.playerData, ...result.playerStats };
    updatePlayerUI();
    // If player leveled up and now qualifies for additional phases, reload options
    try {
      if (state.playerData.level >= 2) loadPhase2();
      if (state.playerData.level >= 3) loadPhase3();
    } catch (e) {
      console.warn('[displayFeedback] falha ao recarregar fases após level up', e);
    }
  }
}

// Smoothly animate a numeric change in an element from `from` to `to` during `duration` ms
function animateNumber(el, from, to, duration = 600) {
  const start = performance.now();
  const step = (ts) => {
    const now = Math.min(1, (ts - start) / duration);
    const value = Math.floor(from + (to - from) * easeOutQuad(now));
    el.textContent = value.toLocaleString();
    if (now < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function easeOutQuad(t) { return t * (2 - t); }

// Show a floating +{points} token above the `anchorEl` then fade & remove it
function showFloatingPoints(points, anchorEl) {
  if (!points || points <= 0) return;
  const flyer = document.createElement('div');
  flyer.className = 'points-flyer';
  flyer.textContent = `+${points}`;
  document.body.appendChild(flyer);

  const rect = anchorEl.getBoundingClientRect();
  flyer.style.left = `${rect.left + rect.width / 2}px`;
  flyer.style.top = `${rect.top - 6}px`;

  // Force layout to pick up the initial position
  // eslint-disable-next-line no-unused-expressions
  flyer.offsetHeight;

  flyer.classList.add('animate-fly');
  setTimeout(() => flyer.classList.add('fade-out'), 700);
  setTimeout(() => flyer.remove(), 1400);
}

// ============================================
// FASE 1: ORDENAÇÃO
// ============================================
async function loadPhase1() {
  try {
    const response = await getJson('/phase1/questions');
    state.p1Questions = response.questions || response;
    
    if (response.message) showGlobalMessage(response.message, 'info', '🚀');
    
    const select = document.getElementById('p1-question');
    select.innerHTML = '';
    
    state.p1Questions.forEach(q => {
      const option = document.createElement('option');
      option.value = q.id;
      // Show numbered questions for clarity
      const idx = state.p1Questions.indexOf(q);
      option.textContent = `${idx + 1}. ${q.title.replace('🎯 ', '')}`;
      select.appendChild(option);
    });
    
    renderPhase1Question();
  } catch (error) {
    showGlobalMessage('Erro ao carregar questões da Fase 1', 'error', '❌');
  }
}

function renderPhase1Question() {
  const select = document.getElementById('p1-question');
  const question = state.p1Questions.find(q => q.id === select.value) || state.p1Questions[0];
  
  if (!question) return;
  
  state.currentQuestion = question;
  state.p1Answer = [];
  
  document.getElementById('p1-description').textContent = question.description;
  document.getElementById('p1-difficulty').textContent = question.difficulty || '⭐ Iniciante';
  document.getElementById('p1-result').innerHTML = '';
  
  const choicesDiv = document.getElementById('p1-choices');
  choicesDiv.innerHTML = '';
  
  (question.choices || []).forEach(activity => {
    const card = document.createElement('div');
    card.className = 'choice-card';
    card.innerHTML = `
      <span class="choice-emoji">🎯</span>
      <span class="choice-label">${activity.label}</span>
      <button class="btn-add">+</button>
    `;
    
    card.querySelector('.btn-add').onclick = (e) => {
      // prevent the click from also triggering the card's click handler
      e.stopPropagation();
      if (!state.p1Answer.includes(activity.id)) {
        state.p1Answer.push(activity.id);
        renderPhase1Answer();
      }
    };

    // Make the whole card clickable and keyboard-accessible
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.addEventListener('click', () => {
      if (!state.p1Answer.includes(activity.id)) {
        state.p1Answer.push(activity.id);
        renderPhase1Answer();
      }
    });
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        if (!state.p1Answer.includes(activity.id)) {
          state.p1Answer.push(activity.id);
          renderPhase1Answer();
        }
      }
    });
    
    choicesDiv.appendChild(card);
  });
  
  renderPhase1Answer();
}

function renderPhase1Answer() {
  const answerDiv = document.getElementById('p1-answer');
  answerDiv.innerHTML = '';
  
  if (state.p1Answer.length === 0) {
    answerDiv.innerHTML = '<div class="empty-state">Clique em + nas opções para adicionar</div>';
  }
  
  state.p1Answer.forEach((id, index) => {
    const activity = state.meta.activities.find(a => a.id === id);
    const card = document.createElement('div');
    card.className = 'answer-card';
    card.innerHTML = `
      <span class="answer-number">${index + 1}</span>
      <span class="answer-label">${activity?.label || id}</span>
      <div class="answer-controls">
        <button class="btn-icon ${index === 0 ? 'disabled' : ''}" ${index === 0 ? 'disabled' : ''}>↑</button>
        <button class="btn-icon ${index === state.p1Answer.length - 1 ? 'disabled' : ''}" ${index === state.p1Answer.length - 1 ? 'disabled' : ''}>↓</button>
        <button class="btn-icon remove">×</button>
      </div>
    `;
    
    const controls = card.querySelectorAll('.btn-icon');
    controls[0].onclick = () => {
      if (index > 0) {
        [state.p1Answer[index - 1], state.p1Answer[index]] = [state.p1Answer[index], state.p1Answer[index - 1]];
        renderPhase1Answer();
      }
    };
    controls[1].onclick = () => {
      if (index < state.p1Answer.length - 1) {
        [state.p1Answer[index], state.p1Answer[index + 1]] = [state.p1Answer[index + 1], state.p1Answer[index]];
        renderPhase1Answer();
      }
    };
    controls[2].onclick = () => {
      state.p1Answer = state.p1Answer.filter(v => v !== id);
      renderPhase1Answer();
    };
    
    answerDiv.appendChild(card);
  });
  
  document.getElementById('p1-validate').disabled = state.p1Answer.length !== 6;
}

async function validatePhase1() {
  try {
    const result = await getJson('/phase1/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionId: state.currentQuestion.id,
        answer: state.p1Answer,
        playerId: state.playerId
      })
    });
    
    displayFeedback(result, document.getElementById('p1-result'));
    await loadPlayerData();
  } catch (error) {
    showGlobalMessage('Erro ao validar resposta', 'error', '❌');
  }
}

async function showPhase1Hint() {
  try {
    const response = await getJson(`/phase1/hint/${state.currentQuestion.id}?playerId=${state.playerId}`);
    showGlobalMessage(response.hint, 'info', response.emoji);
  } catch (error) {
    showGlobalMessage('Erro ao obter dica', 'error', '❌');
  }
}

// ============================================
// FASE 2: ASSOCIAÇÃO
// ============================================
async function loadPhase2() {
  try {
    const response = await getJson(`/phase2/options?playerId=${state.playerId}`);
    state.p2Data = response;
    
    if (response.message) showGlobalMessage(response.message, 'info', '🧩');
    
    const select = document.getElementById('p2-activity');
    select.innerHTML = '';
    
    response.activities.forEach(activity => {
      const option = document.createElement('option');
      option.value = activity.id;
      option.textContent = activity.label;
      select.appendChild(option);
    });
    
    renderPhase2Practices();
  } catch (error) {
    showGlobalMessage('Erro ao carregar Fase 2', 'error', '❌');
  }
}

function renderPhase2Practices() {
  const practicesDiv = document.getElementById('p2-practices');
  practicesDiv.innerHTML = '';
  document.getElementById('p2-result').innerHTML = '';
  
  state.p2Data.practices.forEach(practice => {
    const card = document.createElement('label');
    card.className = 'practice-card';
    card.innerHTML = `
      <input type="checkbox" value="${practice.id}">
      <span class="practice-emoji">⚙️</span>
      <span class="practice-label">${practice.label}</span>
      <span class="practice-check">✓</span>
    `;
    practicesDiv.appendChild(card);
  });
}

async function validatePhase2() {
  try {
    const activityId = document.getElementById('p2-activity').value;
    const selected = Array.from(document.querySelectorAll('#p2-practices input:checked')).map(i => i.value);
    
    const result = await getJson('/phase2/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activityId,
        selectedPracticeIds: selected,
        playerId: state.playerId
      })
    });
    
    displayFeedback(result, document.getElementById('p2-result'));
    await loadPlayerData();
  } catch (error) {
    showGlobalMessage('Erro ao validar resposta', 'error', '❌');
  }
}

async function showPhase2Hint() {
  try {
    const response = await getJson('/phase2/hint');
    let message = response.hint;
    if (response.extraTips && response.extraTips.length > 0) {
      message += '\n\n' + response.extraTips.slice(0, 3).join('\n');
    }
    showGlobalMessage(message, 'info', response.emoji);
  } catch (error) {
    showGlobalMessage('Erro ao obter dica', 'error', '❌');
  }
}

// ============================================
// FASE 3: DECISÃO
// ============================================
async function loadPhase3() {
  try {
    const response = await getJson(`/phase3/scenarios?playerId=${state.playerId}`);
    state.p3Scenarios = response.scenarios || response;
    
    if (response.message) showGlobalMessage(response.message, 'info', '🗺️');
    
    const select = document.getElementById('p3-scenario');
    select.innerHTML = '';
    
    state.p3Scenarios.forEach(scenario => {
      const option = document.createElement('option');
      option.value = scenario.id;
      option.textContent = scenario.input.replace('🎭 ', '').slice(0, 60) + '...';
      select.appendChild(option);
    });
    
    renderPhase3Scenario();
  } catch (error) {
    showGlobalMessage('Erro ao carregar Fase 3', 'error', '❌');
  }
}

function renderPhase3Scenario() {
  const select = document.getElementById('p3-scenario');
  const scenario = state.p3Scenarios.find(s => s.id === select.value) || state.p3Scenarios[0];
  
  if (!scenario) return;
  
  state.currentScenario = scenario;
  state.p3Choice = null;
  
  document.getElementById('p3-input').textContent = scenario.input.replace('🎭 ', '');
  document.getElementById('p3-result').innerHTML = '';
  document.getElementById('p3-validate').disabled = true;
  
  const optionsDiv = document.getElementById('p3-options');
  optionsDiv.innerHTML = '';
  
  (scenario.options || state.meta.activities).forEach(activity => {
    const button = document.createElement('button');
    button.className = 'option-card';
    button.innerHTML = `
      <span class="option-emoji">🎯</span>
      <span class="option-label">${activity.label}</span>
    `;
    
    button.onclick = () => {
      state.p3Choice = activity.id;
      document.getElementById('p3-validate').disabled = false;
      optionsDiv.querySelectorAll('.option-card').forEach(b => b.classList.remove('selected'));
      button.classList.add('selected');
    };
    
    optionsDiv.appendChild(button);
  });
}

async function validatePhase3() {
  try {
    const result = await getJson('/phase3/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenarioId: state.currentScenario.id,
        choiceActivityId: state.p3Choice,
        playerId: state.playerId
      })
    });
    
    displayFeedback(result, document.getElementById('p3-result'));
    await loadPlayerData();
  } catch (error) {
    showGlobalMessage('Erro ao validar resposta', 'error', '❌');
  }
}

async function showPhase3Hint() {
  try {
    const response = await getJson('/phase3/hint');
    let message = response.hint;
    if (response.strategicTips && response.strategicTips.length > 0) {
      message += '\n\n' + response.strategicTips.slice(0, 3).join('\n');
    }
    showGlobalMessage(message, 'info', response.emoji);
  } catch (error) {
    showGlobalMessage('Erro ao obter dica', 'error', '❌');
  }
}

// ============================================
// CONQUISTAS E ESTATÍSTICAS
// ============================================
async function loadAchievements() {
  if (!state.playerId) return;
  
  try {
    const response = await getJson(`/player/${state.playerId}/achievements`);
    const container = document.getElementById('achievements-list');
    const progress = document.getElementById('achievements-progress');
    
    progress.innerHTML = `
      <div class="progress-header">
        <h3>Progresso: ${response.progress} (${response.percentage}%)</h3>
        <div class="progress-bar-full">
          <div class="progress-bar-fill" style="width: ${response.percentage}%"></div>
        </div>
      </div>
    `;
    
    container.innerHTML = '';
    
    if (response.unlocked.length > 0) {
      const unlockedSection = document.createElement('div');
      unlockedSection.className = 'achievements-section';
      unlockedSection.innerHTML = '<h3>✨ Conquistas Desbloqueadas</h3>';
      
      response.unlocked.forEach(ach => {
        const card = document.createElement('div');
        card.className = 'achievement-card unlocked';
        card.innerHTML = `
          <div class="achievement-icon">${ach.emoji}</div>
          <div class="achievement-info">
            <h4>${ach.name}</h4>
            <p>${ach.description}</p>
          </div>
          <div class="achievement-badge">✅</div>
        `;
        unlockedSection.appendChild(card);
      });
      
      container.appendChild(unlockedSection);
    }
    
    if (response.locked.length > 0) {
      const lockedSection = document.createElement('div');
      lockedSection.className = 'achievements-section';
      lockedSection.innerHTML = '<h3>🔒 A Desbloquear</h3>';
      
      response.locked.forEach(ach => {
        const card = document.createElement('div');
        card.className = 'achievement-card locked';
        card.innerHTML = `
          <div class="achievement-icon">${ach.emoji}</div>
          <div class="achievement-info">
            <h4>${ach.name}</h4>
            <p>${ach.description}</p>
          </div>
          <div class="achievement-badge">🔒</div>
        `;
        lockedSection.appendChild(card);
      });
      
      container.appendChild(lockedSection);
    }
  } catch (error) {
    showGlobalMessage('Erro ao carregar conquistas', 'error', '❌');
  }
}

async function loadStats() {
  if (!state.playerId) return;
  
  try {
    const stats = await getJson(`/player/${state.playerId}/stats`);
    const container = document.getElementById('stats-content');
    
    container.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">👤</div>
          <div class="stat-info">
            <h3>${stats.name}</h3>
            <p>Level ${stats.level} - ${stats.ranking}</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">⭐</div>
          <div class="stat-info">
            <h3>${stats.totalScore.toLocaleString()}</h3>
            <p>Pontuação Total</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">🔥</div>
          <div class="stat-info">
            <h3>x${stats.maxCombo}</h3>
            <p>Combo Máximo</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">✅</div>
          <div class="stat-info">
            <h3>${stats.questionsCompleted}</h3>
            <p>Questões Completadas</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">⏱️</div>
          <div class="stat-info">
            <h3>${stats.playTime}</h3>
            <p>Tempo de Jogo</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">🏆</div>
          <div class="stat-info">
            <h3>${stats.achievements?.length || 0}/8</h3>
            <p>Conquistas</p>
          </div>
        </div>
      </div>
      
      <div class="stats-phases">
        <h3>📊 Estatísticas por Fase</h3>
        
        <div class="phase-stat">
          <h4>🔄 Fase 1 - Sequência de Fluxo</h4>
          <p>Acertos: ${stats.stats.phase1.correct}/${stats.stats.phase1.attempts}</p>
          <p>Taxa de acerto: ${stats.stats.phase1.attempts > 0 ? Math.floor((stats.stats.phase1.correct / stats.stats.phase1.attempts) * 100) : 0}%</p>
        </div>
        
        <div class="phase-stat">
          <h4>🔗 Fase 2 - Conexão de Conceitos</h4>
          <p>Acertos: ${stats.stats.phase2.correct}/${stats.stats.phase2.attempts}</p>
          <p>Pontuação média: ${Math.floor(stats.stats.phase2.avgScore * 100)}%</p>
        </div>
        
        <div class="phase-stat">
          <h4>🎭 Fase 3 - Escolha do Caminho</h4>
          <p>Acertos: ${stats.stats.phase3.correct}/${stats.stats.phase3.attempts}</p>
          <p>Taxa de acerto: ${stats.stats.phase3.attempts > 0 ? Math.floor((stats.stats.phase3.correct / stats.stats.phase3.attempts) * 100) : 0}%</p>
          <p>Acertos consecutivos: ${stats.stats.phase3.consecutiveCorrect}</p>
        </div>
      </div>
    `;
  } catch (error) {
    showGlobalMessage('Erro ao carregar estatísticas', 'error', '❌');
  }
}

// ============================================
// EASTER EGGS
// ============================================
async function showMotivation() {
  try {
    const response = await getJson('/easteregg/motivate');
    const modal = document.getElementById('motivation-modal');
    modal.innerHTML = `
      <div class="motivation-content animate-bounce-in">
        <div class="motivation-emoji">${response.emoji}</div>
        <h2>${response.motivation}</h2>
        <p>${response.message}</p>
        <!-- removed XP bonus from motivation modal: no XP should be awarded for motivation -->
        <button class="btn-primary close-modal">Obrigado! ❤️</button>
      </div>
    `;
    modal.classList.remove('hidden');
    // Close handled by modal delegation
    // Removed auto-hide: the motivation modal stays visible until the user clicks "Obrigado!"
  } catch (error) {
    showGlobalMessage('Erro ao buscar motivação', 'error', '❌');
  }
}

async function showJoke() {
  try {
    const response = await getJson('/easteregg/joke');
    showGlobalMessage(`${response.setup}\n\n${response.punchline}`, 'info', '😄');
  } catch (error) {
    showGlobalMessage('Erro ao buscar piada', 'error', '❌');
  }
}

// ============================================
// INICIALIZAÇÃO
// ============================================
async function init() {
  try {
    console.log('Iniciando função init()...');
    
    console.log('Chamando initPlayer() o mais cedo possível...');
    await initPlayer();
    
    showGlobalMessage('Carregando metadados do jogo...', 'info', '⏳');
    console.log('Carregando metadados...');
    state.meta = await getJson('/meta');
    console.log('Metadados carregados:', state.meta);
    
    console.log('Carregando fases...');
    // Load Phase1 always; Phase2/3 require playerId (level gating)
    if (state.playerId) {
      await Promise.all([
        loadPhase1(),
        loadPhase2(),
        loadPhase3()
      ]);
    } else {
      await loadPhase1();
    }
    
    showGlobalMessage('Tudo pronto! Selecione uma fase e divirta-se! 🎮', 'success', '✅');
    if (!state.playerId) {
      console.log('Garantindo que o modal de boas-vindas esteja visível (novo jogador)...');
      showView('welcome-modal');
    } else {
      console.log('Jogador existente — abrindo Fase 1 por padrão');
      showView('phase1');
    }
    
  } catch (error) {
    console.error('Erro ao inicializar:', error);
    showGlobalMessage('Erro ao carregar. Verifique se o servidor está em execução!', 'error', '❌');
  }
}

// ============================================
// EVENT LISTENERS
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  console.log('[DOMContentLoaded] disparado');
  // Navegação
  document.querySelectorAll('.nav-btn[data-view]').forEach(btn => {
    console.log('Adicionando event listener ao botão:', btn.dataset.view);
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      console.log('Botão de navegação clicado:', view);
      showView(view);
      
      if (view === 'phase1') loadPhase1();
      if (view === 'phase2') loadPhase2();
      if (view === 'phase3') loadPhase3();
      if (view === 'achievements') loadAchievements();
      if (view === 'stats') loadStats();
    });
  });

  // Trocar jogador / resetar sessão
  const resetBtn = document.getElementById('reset-session-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', async () => {
      console.log('[resetSession] Limpando sessão do player...');
      try {
        localStorage.removeItem('itil-quest-player-id');
        state.playerId = null;
        state.playerData = null;
        // Garantir rebind do botão de start
        const startBtn = document.getElementById('start-game-btn');
        if (startBtn) delete startBtn.dataset.bound;
        showView('welcome-modal');
        await initPlayer();
      } catch (e) {
        console.error('[resetSession] erro ao limpar sessão:', e);
      }
    });
  }

  // Bind Fase 1
  const p1Question = document.getElementById('p1-question');
  const p1Reset = document.getElementById('p1-reset');
  const p1Validate = document.getElementById('p1-validate');
  const p1Hint = document.getElementById('p1-hint');
  if (p1Question) {
    console.log('[bind] p1-question change -> renderPhase1Question');
    p1Question.addEventListener('change', renderPhase1Question);
  }
  if (p1Reset) {
    console.log('[bind] p1-reset click -> clear answer');
    p1Reset.addEventListener('click', () => {
      state.p1Answer = [];
      renderPhase1Answer();
      document.getElementById('p1-result').innerHTML = '';
    });
  }
  if (p1Validate) {
    console.log('[bind] p1-validate click -> validatePhase1');
    p1Validate.addEventListener('click', validatePhase1);
  }
  if (p1Hint) {
    console.log('[bind] p1-hint click -> showPhase1Hint');
    p1Hint.addEventListener('click', showPhase1Hint);
  }

  // Bind Fase 2
  const p2Activity = document.getElementById('p2-activity');
  const p2Validate = document.getElementById('p2-validate');
  const p2Hint = document.getElementById('p2-hint');
  if (p2Activity) {
    console.log('[bind] p2-activity change -> renderPhase2Practices');
    p2Activity.addEventListener('change', renderPhase2Practices);
  }
  if (p2Validate) {
    console.log('[bind] p2-validate click -> validatePhase2');
    p2Validate.addEventListener('click', validatePhase2);
  }
  if (p2Hint) {
    console.log('[bind] p2-hint click -> showPhase2Hint');
    p2Hint.addEventListener('click', showPhase2Hint);
  }

  // Bind Fase 3
  const p3Scenario = document.getElementById('p3-scenario');
  const p3Validate = document.getElementById('p3-validate');
  const p3Hint = document.getElementById('p3-hint');
  if (p3Scenario) {
    console.log('[bind] p3-scenario change -> renderPhase3Scenario');
    p3Scenario.addEventListener('change', renderPhase3Scenario);
  }
  if (p3Validate) {
    console.log('[bind] p3-validate click -> validatePhase3');
    p3Validate.addEventListener('click', validatePhase3);
  }
  if (p3Hint) {
    console.log('[bind] p3-hint click -> showPhase3Hint');
    p3Hint.addEventListener('click', showPhase3Hint);
  }

  // Bind Easter Eggs
  const motivateBtn = document.getElementById('motivate-btn');
  const jokeBtn = document.getElementById('joke-btn');
  if (motivateBtn) {
    console.log('[bind] motivate-btn click -> showMotivation');
    motivateBtn.addEventListener('click', showMotivation);
  }
  if (jokeBtn) {
    console.log('[bind] joke-btn click -> showJoke');
    jokeBtn.addEventListener('click', showJoke);
  }

  // Modal overlay delegation: close when clicking overlay or any element with .close-modal
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (ev) => {
      // click on overlay (modal itself) closes it
      if (ev.target === modal) {
        modal.classList.add('hidden');
        return;
      }

      // click on a button or element with .close-modal closes the modal
      const close = ev.target.closest('.close-modal');
      if (close && modal.contains(close)) {
        modal.classList.add('hidden');
      }
    });
  });

  // ESC closes active modals
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') {
      document.querySelectorAll('.modal:not(.hidden)').forEach(m => m.classList.add('hidden'));
    }
  });

  // Inicializar a aplicação
  init();
});
