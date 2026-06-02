require('dotenv').config();

const readline = require('readline');

const { buscarOfertas }                                    = require('./scraper');
const { filtrarEsportes, filtrarPorPlataforma,
        filtrarDesconto, detectarPilar,
        ordenarPorPrioridade }                             = require('./filtro');
const { formatarParaWhatsApp }                             = require('./formatador');
const { gerarLinkAfiliado, statusAfiliados }               = require('./afiliados');
const { filtrarNovos, adicionarPendentes,
        marcarComoEnviadas, resetar,
        estatisticas, mostrarResumo }                      = require('./historico');
const fs   = require('fs');
const path = require('path');

const PILARES = [
  { id: 'corrida',      label: '🏃 PILAR 1 — CORRIDA'           },
  { id: 'academia',     label: '🏋️ PILAR 2 — ACADEMIA & FITNESS' },
  { id: 'complementos', label: '🏋️ PILAR 3 — COMPLEMENTOS'       },
];

async function aplicarAfiliados(ofertas) {
  const prontas = [];
  for (let i = 0; i < ofertas.length; i++) {
    const oferta = ofertas[i];
    const link   = await gerarLinkAfiliado(oferta.sourceUrl || oferta.link, oferta.loja);
    if (link) {
      oferta.linkAfiliado = link;
      prontas.push(oferta);
    }
    if ((i + 1) % 5 === 0) await new Promise(r => setTimeout(r, 300));
  }
  return prontas;
}

function confirmar(pergunta) {
  return new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.on('close', () => resolve('n'));
    rl.question(pergunta, ans => { rl.close(); resolve(ans.trim().toLowerCase()); });
  });
}

async function executar() {
  console.log('');
  console.log('🏃 BOT DE OFERTAS ESPORTIVAS — WhatsApp');
  console.log('═'.repeat(50));
  console.log('🔗 Plataformas:');
  console.log(statusAfiliados());
  console.log(`\n📋 Histórico: ${await estatisticas()}`);
  console.log('\n🔍 Buscando no Pelando.com.br...\n');

  try {
    const todas       = await buscarOfertas();
    const esportivas  = filtrarEsportes(todas);
    const comPlat     = filtrarPorPlataforma(esportivas);
    const comDesconto = filtrarDesconto(comPlat, 10);

    const comPilar = comDesconto.map(o => ({ ...o, ...detectarPilar(o) }));
    const novas    = await filtrarNovos(comPilar);

    const grupos = {};
    for (const { id } of PILARES) {
      grupos[id] = ordenarPorPrioridade(novas.filter(o => o.pilar === id));
    }

    const totalNovas = novas.length;
    console.log(
      `✅ ${todas.length} encontradas → ${esportivas.length} esportivas → ` +
      `${comPlat.length} com afiliado → ${comDesconto.length} c/ ≥10% desc → ${totalNovas} novas`
    );
    PILARES.forEach(({ id, label }) => {
      if (grupos[id].length) console.log(`   ${label}: ${grupos[id].length}`);
    });

    if (totalNovas === 0) {
      console.log('\nℹ  Nenhuma oferta nova.');
      console.log('   → Use --resetar-historico para repostar tudo.');
      return;
    }

    const todasOrdenadas = PILARES.flatMap(({ id }) => grupos[id]);
    console.log('\n🔗 Gerando links...');
    const prontas  = await aplicarAfiliados(todasOrdenadas);
    const puladas  = todasOrdenadas.length - prontas.length;
    console.log(`   ✅ ${prontas.length} links gerados${puladas ? ` | ${puladas} sem link` : ''}\n`);

    if (prontas.length === 0) {
      console.log('ℹ  Nenhum link gerado — verifique os tokens no .env.');
      return;
    }

    const prontasPorPilar = {};
    for (const { id } of PILARES) {
      prontasPorPilar[id] = prontas.filter(o => o.pilar === id);
    }

    const SEP   = '\n\n' + '─'.repeat(40) + '\n\n';
    const SEP_P = '\n\n' + '═'.repeat(50) + '\n\n';

    const secoes = [];

    for (const { id, label } of PILARES) {
      const grupo = prontasPorPilar[id];
      if (!grupo.length) continue;
      const posts = formatarParaWhatsApp(grupo);
      secoes.push(`${'═'.repeat(50)}\n${label}\n${'═'.repeat(50)}\n\n` + posts.join(SEP));
    }

    const conteudoArquivo = secoes.join(SEP_P);
    fs.writeFileSync(path.join(__dirname, 'posts_whatsapp.txt'), conteudoArquivo, 'utf-8');
    fs.writeFileSync(
      path.join(__dirname, 'ofertas.json'),
      JSON.stringify({ geradoEm: new Date().toLocaleString('pt-BR'), total: prontas.length, ofertas: prontas }, null, 2),
      'utf-8'
    );

    for (const { id, label } of PILARES) {
      const grupo = prontasPorPilar[id];
      if (!grupo.length) continue;
      console.log('═'.repeat(50));
      console.log(`📱 ${label}`);
      console.log('═'.repeat(50));
      const posts = formatarParaWhatsApp(grupo);
      posts.forEach((post, i) => {
        console.log(`\n📌 Oferta ${i + 1} de ${posts.length}:\n${'─'.repeat(40)}\n${post}`);
      });
      console.log('');
    }

    // Registra como Pendente na planilha antes de perguntar
    await adicionarPendentes(prontas);

    const resp = await confirmar('❓ Marcar todos como Enviado? (s/n): ');
    if (resp === 's') {
      await marcarComoEnviadas(prontas);
      console.log(`\n✅ ${prontas.length} oferta(s) marcadas como Enviado em historico.xlsx`);
    } else {
      console.log('\nℹ  Mantidas como Pendente — aparecerão na próxima execução.');
    }

    console.log(`📁 posts_whatsapp.txt salvo por pilar\n`);

  } catch (err) {
    console.error('\n❌ Erro:', err.message);
    if (process.argv.includes('--debug')) console.error(err.stack);
  }
}

// ── CLI ──────────────────────────────────────────────────────────────────────

if (require.main === module) {
  (async () => {
    const args = process.argv.slice(2);
    if (args.includes('--resetar-historico')) {
      await resetar();
      console.log('✅ Histórico resetado (historico.xlsx recriado).');
      process.exit(0);
    }
    if (args.includes('--historico')) {
      console.log(await mostrarResumo());
      process.exit(0);
    }
    await executar();
  })();
}

module.exports = { executar };
