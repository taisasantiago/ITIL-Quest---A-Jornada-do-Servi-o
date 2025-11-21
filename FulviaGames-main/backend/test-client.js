#!/usr/bin/env node

/**
 * 🎮 Cliente de Teste para o Backend Lúdico do ITIL Quest
 * 
 * Este script demonstra todas as funcionalidades interativas do backend!
 * Execute com: node test-client.js
 */

const BASE_URL = 'http://localhost:3000/api';

// Cores para o terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(`🎯 ${title}`, 'bright');
  console.log('='.repeat(60) + '\n');
}

async function makeRequest(endpoint, options = {}) {
  try {
    const url = `${BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    return await response.json();
  } catch (error) {
    log(`❌ Erro na requisição: ${error.message}`, 'red');
    return null;
  }
}

async function demonstrateHealthCheck() {
  logSection('1. Health Check - Status do Servidor');
  
  const health = await makeRequest('/health');
  if (health) {
    log(`Status: ${health.status}`, 'green');
    log(`Mood: ${health.mood}`, 'yellow');
    log(`Uptime: ${health.uptime}s`, 'cyan');
    log(`Jogadores ativos: ${health.activePlayers}`, 'blue');
    log(`Mensagem: ${health.message}`, 'magenta');
  }
}

async function demonstratePlayerSystem() {
  logSection('2. Sistema de Jogador - Criando Sessão');
  
  const initResponse = await makeRequest('/player/init', {
    method: 'POST',
    body: JSON.stringify({
      playerName: 'Alice (Teste Automático)'
    })
  });
  
  if (initResponse) {
    log(`${initResponse.welcome}`, 'green');
    log(`Dica: ${initResponse.tip}`, 'yellow');
    log(`\nID do Jogador: ${initResponse.session.id}`, 'cyan');
    log(`Level: ${initResponse.session.level}`, 'blue');
    log(`XP: ${initResponse.session.xp}`, 'blue');
    return initResponse.session;
  }
  
  return null;
}

async function demonstratePhase1(playerId) {
  logSection('3. Fase 1 - Sequência de Fluxo');
  
  // Buscar questões
  log('📚 Buscando questões...', 'cyan');
  const questionsData = await makeRequest('/phase1/questions');
  
  if (questionsData && questionsData.questions) {
    const question = questionsData.questions[0];
    log(`\n${question.title}`, 'bright');
    log(`${question.description}`, 'yellow');
    log(`Dificuldade: ${question.difficulty}`, 'blue');
    
    // Buscar dica
    log('\n💡 Buscando dica...', 'cyan');
    const hintData = await makeRequest(`/phase1/hint/${question.id}?playerId=${playerId}`);
    if (hintData) {
      log(hintData.hint, 'yellow');
      log(hintData.encouragement, 'green');
    }
    
    // Responder corretamente
    log('\n✅ Enviando resposta correta...', 'cyan');
    const correctAnswer = ['plan', 'engage', 'design-transition', 'obtain-build', 'deliver-support', 'improve'];
    const result = await makeRequest('/phase1/validate', {
      method: 'POST',
      body: JSON.stringify({
        questionId: question.id,
        answer: correctAnswer,
        playerId: playerId
      })
    });
    
    if (result) {
      log(`\n${result.feedback} ${result.emoji}`, 'green');
      log(`Precisão: ${result.accuracy}`, 'blue');
      log(`Pontuação: ${result.score}`, 'yellow');
      if (result.bonus) log(result.bonus, 'magenta');
      if (result.xpGained) log(`XP Ganho: +${result.xpGained}`, 'cyan');
      if (result.points !== undefined) log(`Pontos Ganhos: +${result.points}`, 'magenta');
      if (result.combo) log(`${result.comboMessage}`, 'red');
      
      if (result.achievements && result.achievements.length > 0) {
        log('\n🏆 CONQUISTAS DESBLOQUEADAS:', 'magenta');
        result.achievements.forEach(ach => {
          if (ach.unlocked) {
            log(`  ${ach.message}`, 'yellow');
          }
        });
      }
      
      if (result.levelUp && result.levelUp.leveledUp) {
        log(`\n🎊 ${result.levelUp.message}`, 'bright');
      }
    }
  }
}

async function demonstratePhase2(playerId) {
  logSection('4. Fase 2 - Conexão de Conceitos');
  
  // Buscar opções
  log('📚 Buscando atividades e práticas...', 'cyan');
  const options = await makeRequest(`/phase2/options?playerId=${playerId}`);
  
  if (options) {
    log(`${options.message}`, 'yellow');
    log(`Dica: ${options.tip}`, 'blue');
    
    // Buscar dica geral
    log('\n💡 Buscando dica...', 'cyan');
    const hint = await makeRequest('/phase2/hint');
    if (hint) {
      log(hint.hint, 'yellow');
      log('\nDicas extras:', 'cyan');
      hint.extraTips.forEach(tip => log(`  ${tip}`, 'blue'));
    }
    
    // Testar associação correta
    log('\n✅ Testando associação: Entregar e Suportar...', 'cyan');
    const result = await makeRequest('/phase2/validate', {
      method: 'POST',
      body: JSON.stringify({
        activityId: 'deliver-support',
        selectedPracticeIds: ['incident-management', 'service-desk'],
        playerId: playerId
      })
    });
    
    if (result) {
      log(`\n${result.feedback} ${result.emoji}`, 'green');
      log(`${result.message}`, 'yellow');
      log(`Pontuação: ${result.percentage}`, 'blue');
      if (result.bonus) log(result.bonus, 'magenta');
      if (result.xpGained) log(`XP Ganho: +${result.xpGained}`, 'cyan');
      
      if (result.achievements && result.achievements.length > 0) {
        log('\n🏆 CONQUISTAS DESBLOQUEADAS:', 'magenta');
        result.achievements.forEach(ach => {
          if (ach.unlocked) {
            log(`  ${ach.message}`, 'yellow');
          }
        });
      }
    }
  }
}

async function demonstratePhase3(playerId) {
  logSection('5. Fase 3 - Escolha do Caminho');
  
  // Buscar cenários
  log('📚 Buscando cenários...', 'cyan');
  const scenariosData = await makeRequest(`/phase3/scenarios?playerId=${playerId}`);
  
  if (scenariosData && scenariosData.scenarios) {
    log(`${scenariosData.message}`, 'yellow');
    log(`Dica: ${scenariosData.tip}`, 'blue');
    
    const scenario = scenariosData.scenarios[1]; // Major incident
    log(`\nCenário: ${scenario.input}`, 'bright');
    
    // Buscar dica
    log('\n💡 Buscando dica estratégica...', 'cyan');
    const hint = await makeRequest('/phase3/hint');
    if (hint) {
      log(hint.hint, 'yellow');
      log('\nDicas estratégicas:', 'cyan');
      hint.strategicTips.forEach(tip => log(`  ${tip}`, 'blue'));
    }
    
    // Responder corretamente
    log('\n✅ Escolhendo resposta correta...', 'cyan');
    const result = await makeRequest('/phase3/validate', {
      method: 'POST',
      body: JSON.stringify({
        scenarioId: scenario.id,
        choiceActivityId: 'deliver-support',
        playerId: playerId
      })
    });
    
    if (result) {
      log(`\n${result.feedback} ${result.emoji}`, 'green');
      log(`${result.message}`, 'yellow');
      log(`\nExplicação: ${result.explanation}`, 'cyan');
      if (result.nextInput) log(`Próximo passo: ${result.nextInput}`, 'blue');
      if (result.bonus) log(`\n${result.bonus}`, 'magenta');
      if (result.xpGained) log(`XP Ganho: +${result.xpGained}`, 'cyan');
      if (result.comboMessage) log(result.comboMessage, 'red');
    }
  }
}

async function demonstratePlayerStats(playerId) {
  logSection('6. Estatísticas do Jogador');
  
  const stats = await makeRequest(`/player/${playerId}/stats`);
  
  if (stats) {
    log(`Nome: ${stats.name}`, 'bright');
    log(`Level: ${stats.level} (${stats.ranking})`, 'blue');
    log(`XP: ${stats.xp}/${stats.nextLevel.xpNeeded} (${stats.nextLevel.progress}%)`, 'cyan');
    log(`Pontuação Total: ${stats.totalScore}`, 'yellow');
    log(`Combo Máximo: ${stats.maxCombo}`, 'red');
    log(`Questões Completadas: ${stats.questionsCompleted}`, 'green');
    log(`Tempo de Jogo: ${stats.playTime}`, 'magenta');
    
    log('\n📊 Estatísticas por Fase:', 'bright');
    log(`  Fase 1: ${stats.stats.phase1.correct}/${stats.stats.phase1.attempts} acertos`, 'blue');
    log(`  Fase 2: ${stats.stats.phase2.correct}/${stats.stats.phase2.attempts} acertos (média: ${Math.floor(stats.stats.phase2.avgScore * 100)}%)`, 'blue');
    log(`  Fase 3: ${stats.stats.phase3.correct}/${stats.stats.phase3.attempts} acertos`, 'blue');
  }
}

async function demonstrateAchievements(playerId) {
  logSection('7. Conquistas');
  
  const achievements = await makeRequest(`/player/${playerId}/achievements`);
  
  if (achievements) {
    log(`Progresso: ${achievements.progress} (${achievements.percentage}%)`, 'cyan');
    
    if (achievements.unlocked.length > 0) {
      log('\n🏆 Conquistas Desbloqueadas:', 'green');
      achievements.unlocked.forEach(ach => {
        log(`  ${ach.emoji} ${ach.name}`, 'yellow');
        log(`     ${ach.description}`, 'blue');
      });
    }
    
    if (achievements.locked.length > 0) {
      log('\n🔒 Conquistas Bloqueadas:', 'red');
      achievements.locked.slice(0, 3).forEach(ach => {
        log(`  ${ach.emoji} ${ach.name}`, 'magenta');
        log(`     ${ach.description}`, 'cyan');
      });
    }
  }
}

async function demonstrateEasterEggs() {
  logSection('8. Easter Eggs - Diversão Extra');
  
  // Mensagem motivacional
  log('🌟 Buscando mensagem motivacional...', 'cyan');
  const motivation = await makeRequest('/easteregg/motivate');
  if (motivation) {
    log(`\n${motivation.motivation}`, 'green');
    log(`${motivation.message}`, 'yellow');
    log(`${motivation.bonus}`, 'magenta');
  }
  
  // Piada
  log('\n😄 Buscando piada...', 'cyan');
  const joke = await makeRequest('/easteregg/joke');
  if (joke) {
    log(`\n${joke.setup}`, 'yellow');
    setTimeout(() => {
      log(`${joke.punchline}`, 'green');
      log(`${joke.bonus}`, 'magenta');
      log(`${joke.disclaimer}`, 'blue');
    }, 2000);
  }
  
  // Aguardar a piada aparecer
  await new Promise(resolve => setTimeout(resolve, 3000));
}

async function demonstrateLeaderboard() {
  logSection('9. Ranking - Leaderboard');
  
  const leaderboard = await makeRequest('/leaderboard');
  
  if (leaderboard) {
    log(leaderboard.title, 'bright');
    log(`\n${leaderboard.message}`, 'yellow');
    log(`Total de jogadores: ${leaderboard.totalPlayers}`, 'cyan');
    
    if (leaderboard.leaderboard.length > 0) {
      log('\n🏆 Top Jogadores:', 'magenta');
      leaderboard.leaderboard.forEach(player => {
        log(`\n${player.emoji} #${player.rank} - ${player.name}`, 'bright');
        log(`   Level ${player.level} | Score: ${player.score}`, 'blue');
        log(`   Combo Máximo: ${player.maxCombo} | Conquistas: ${player.achievements}`, 'cyan');
      });
    }
  }
}

async function demonstrateMetadata() {
  logSection('10. Metadados do Jogo');
  
  const meta = await makeRequest('/meta');
  
  if (meta) {
    log(meta.title, 'bright');
    log(meta.subtitle, 'yellow');
    log(`Versão: ${meta.version}`, 'cyan');
    
    log('\n📚 Fases Disponíveis:', 'magenta');
    meta.phases.forEach(phase => {
      log(`\n${phase.icon} ${phase.label}`, 'green');
      log(`   ${phase.subtitle}`, 'yellow');
      log(`   Dificuldade: ${phase.difficulty}`, 'blue');
    });
    
    log(`\n🎯 Total de Atividades: ${meta.activities.length}`, 'cyan');
    log(`🏆 Total de Conquistas: ${meta.achievements.length}`, 'magenta');
  }
}

async function main() {
  console.clear();
  
  log('╔════════════════════════════════════════════════════╗', 'bright');
  log('║                                                    ║', 'bright');
  log('║   🎮 ITIL QUEST - TESTE DO BACKEND LÚDICO 🎮      ║', 'bright');
  log('║                                                    ║', 'bright');
  log('║   Demonstração completa de todas as funcionalidades║', 'bright');
  log('║                                                    ║', 'bright');
  log('╚════════════════════════════════════════════════════╝', 'bright');
  
  log('\n⏳ Aguarde enquanto testamos o backend...\n', 'yellow');
  
  try {
    // 1. Health Check
    await demonstrateHealthCheck();
    await sleep(1000);
    
    // 2. Sistema de Jogador
    const session = await demonstratePlayerSystem();
    if (!session) {
      log('\n❌ Erro ao criar sessão. Verifique se o servidor está rodando!', 'red');
      return;
    }
    await sleep(1000);
    
    const playerId = session.id;
    
    // 3-5. Fases do Jogo
    await demonstratePhase1(playerId);
    await sleep(1000);
    
    await demonstratePhase2(playerId);
    await sleep(1000);
    
    await demonstratePhase3(playerId);
    await sleep(1000);
    
    // 6-7. Estatísticas e Conquistas
    await demonstratePlayerStats(playerId);
    await sleep(1000);
    
    await demonstrateAchievements(playerId);
    await sleep(1000);
    
    // 8. Easter Eggs
    await demonstrateEasterEggs();
    await sleep(1000);
    
    // 9. Leaderboard
    await demonstrateLeaderboard();
    await sleep(1000);
    
    // 10. Metadata
    await demonstrateMetadata();
    
    // Conclusão
    logSection('🎉 Teste Completo!');
    log('Todas as funcionalidades do backend lúdico foram demonstradas!', 'green');
    log('O ITIL Quest está pronto para proporcionar uma experiência incrível! 🚀', 'yellow');
    log('\nDivirta-se jogando! 🎮✨', 'magenta');
    
  } catch (error) {
    log(`\n❌ Erro durante o teste: ${error.message}`, 'red');
    log('Verifique se o servidor está rodando na porta 3000!', 'yellow');
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Executar teste
main().catch(error => {
  console.error('Erro fatal:', error);
  process.exit(1);
});
