require('dotenv').config();
const cron = require('node-cron');
const { executar } = require('./index');

const HORARIOS = process.env.BOT_HORARIOS || '0 8,12,18 * * *';
const TIMEZONE  = 'America/Sao_Paulo';

async function rodar() {
  const agora = new Date().toLocaleString('pt-BR', { timeZone: TIMEZONE });
  console.log(`\n${'═'.repeat(50)}\n🕐 Execução agendada — ${agora}\n${'═'.repeat(50)}`);
  await executar();
}

async function main() {
  console.log('');
  console.log('📅 BOT DE OFERTAS — MODO AGENDADO');
  console.log('═'.repeat(50));
  console.log(`   Horários: ${HORARIOS}`);
  console.log(`   Fuso:     ${TIMEZONE}`);
  console.log('   Parar:    Ctrl+C');
  console.log('');

  // Executa imediatamente ao iniciar
  await rodar();

  // Agenda as próximas execuções
  cron.schedule(HORARIOS, rodar, { timezone: TIMEZONE });
  console.log('✅ Agendador ativo. Aguardando próximo horário...\n');
}

process.on('SIGINT',  () => { console.log('\nEncerrando...'); process.exit(0); });
process.on('SIGTERM', () => { console.log('\nEncerrando...'); process.exit(0); });

main().catch(err => {
  console.error('❌ Erro no agendador:', err.message);
  process.exit(1);
});
