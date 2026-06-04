require('dotenv').config();

const readline = require('readline');
const fs       = require('fs');
const path     = require('path');

const { buscarOfertas }                                   = require('./scraper');
const { filtrarEsportes, filtrarPorPlataforma,
        filtrarDesconto, detectarPilar,
        ordenarPorPrioridade }                            = require('./filtro');
const { formatarParaWhatsApp }                            = require('./formatador');
const { gerarLinkAfiliado, statusAfiliados }              = require('./afiliados');
const { filtrarNovos, adicionarPendentes,
        marcarComoEnviadas, resetar,
        estatisticas, mostrarResumo }                     = require('./historico');
const { calcularScore, extrairTags, imprimirDebugScore }  = require('./score');
const config                                              = require('./config');

const MODO_DEBUG = process.argv.includes('--debug');

const PILARES = [
  { id: 'corrida',      label: '🏃 PILAR 1 — CORRIDA'           },
  { id: 'academia',     label: '🏋️ PILAR 2 — ACADEMIA & FITNESS' },
  { id: 'complementos', label: '🏋️ PILAR 3 — COMPLEMENTOS'       },
];

// ── Enriquecimento (score + tags) ────────────────────────────────────────────
// Executado após filtrarNovos para não computar score de ofertas já enviadas.

function enriquecerOfertas(ofertas) {
  return ofertas.map(o => {
    const scoreData = calcularScore(o);
    const tags      = extrairTags(o);
    return { ...o, ...scoreData, tags };
  });
}

// ── Geração de links afiliados — lotes concorrentes (Implementação 11) ───────
// Promise.allSettled garante que uma falha num lote não cancela os demais.
// LOTE_AFILIADOS controla concorrência sem sobrecarregar as APIs.

async function aplicarAfiliados(ofertas) {
  const prontas   = [];
  const LOTE      = config.LOTE_AFILIADOS;

  for (let i = 0; i < ofertas.length; i += LOTE) {
    const lote      = ofertas.slice(i, i + LOTE);
    const resultados = await Promise.allSettled(
      lote.map(async (oferta) => {
        const link = await gerarLinkAfiliado(oferta.sourceUrl || oferta.link, oferta.loja);
        return link ? { ...oferta, linkAfiliado: link } : null;
      })
    );

    for (const res of resultados) {
      if (res.status === 'fulfilled' && res.value) prontas.push(res.value);
    }

    if (i + LOTE < ofertas.length) await new Promise(r => setTimeout(r, 300));
  }

  return prontas;
}

// ── Confirmação interativa ───────────────────────────────────────────────────

function confirmar(pergunta) {
  return new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.on('close', () => resolve('n'));
    rl.question(pergunta, ans => { rl.close(); resolve(ans.trim().toLowerCase()); });
  });
}

// ── Execução principal ───────────────────────────────────────────────────────

async function executar() {
  console.log('');
  console.log('🏃 BOT DE OFERTAS ESPORTIVAS — WhatsApp');
  console.log('═'.repeat(50));
  console.log('🔗 Plataformas:');
  console.log(statusAfiliados());
  console.log(`\n📋 Histórico: ${await estatisticas()}`);
  console.log(
    `\n⚙  Config: min_desc=${config.MIN_DESCONTO}% | ` +
    `min_temp=${config.MIN_TEMPERATURA} | ` +
    `max_ofertas=${config.MAX_OFERTAS_DIA} | ` +
    `validade=${config.DIAS_VALIDADE_HISTORICO}d`
  );
  console.log('\n🔍 Buscando no Pelando.com.br...\n');

  try {
    const todas       = await buscarOfertas();
    const esportivas  = filtrarEsportes(todas);
    const comPlat     = filtrarPorPlataforma(esportivas);
    const comDesconto = filtrarDesconto(comPlat, config.MIN_DESCONTO);

    // Implementação 3 — filtro por temperatura mínima configurável
    const comTemp = config.MIN_TEMPERATURA > 0
      ? comDesconto.filter(o => (o.temperatura || 0) >= config.MIN_TEMPERATURA)
      : comDesconto;

    const comPilar = comTemp.map(o => ({ ...o, ...detectarPilar(o) }));
    const novas    = await filtrarNovos(comPilar);

    // Enriquece com score e tags antes de ordenar
    const enriquecidas = enriquecerOfertas(novas);

    // Ordena globalmente por score e seleciona o top N do dia (Implementação 5)
    const ordenadas  = ordenarPorPrioridade(enriquecidas);
    const topOfertas = ordenadas.slice(0, config.MAX_OFERTAS_DIA);

    // Agrupa por pilar após seleção global
    const grupos = {};
    for (const { id } of PILARES) {
      grupos[id] = topOfertas.filter(o => o.pilar === id);
    }

    const totalNovas = novas.length;
    console.log(
      `✅ ${todas.length} encontradas → ${esportivas.length} esportivas → ` +
      `${comPlat.length} c/ afiliado → ${comDesconto.length} c/ ≥${config.MIN_DESCONTO}% desc → ` +
      `${comTemp.length} c/ temp≥${config.MIN_TEMPERATURA} → ${totalNovas} novas → ` +
      `${topOfertas.length} selecionadas (top ${config.MAX_OFERTAS_DIA})`
    );
    PILARES.forEach(({ id, label }) => {
      if (grupos[id].length) console.log(`   ${label}: ${grupos[id].length}`);
    });

    // Implementação 13 — debug de score visível
    if (MODO_DEBUG && topOfertas.length > 0) {
      console.log('\n🔬 DEBUG — Score das ofertas selecionadas:');
      topOfertas.forEach(imprimirDebugScore);
      console.log('');
    }

    if (topOfertas.length === 0) {
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
      JSON.stringify(
        { geradoEm: new Date().toLocaleString('pt-BR'), total: prontas.length, ofertas: prontas },
        null, 2
      ),
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
    if (MODO_DEBUG) console.error(err.stack);
  }
}

// ── Modo ranking (--ranking) ─────────────────────────────────────────────────
// Exibe tabela de scores sem gerar links, sem modificar histórico.
// Útil para monitorar qualidade e calibrar pesos antes de rodar o bot completo.

async function exibirRanking() {
  const MAX_RANKING = Number(process.argv.find(a => a.startsWith('--top='))?.split('=')[1]) || 30;

  console.log('');
  console.log('📊 BOT DE OFERTAS — MODO RANKING');
  console.log('═'.repeat(60));
  console.log(`⚙  pesos: desc=${config.PESOS_SCORE.desconto} | temp=${config.PESOS_SCORE.temperatura} | cat=${config.PESOS_SCORE.categoria}`);
  console.log(`   min_desc=${config.MIN_DESCONTO}% | min_temp=${config.MIN_TEMPERATURA} | exibindo top ${MAX_RANKING}`);
  console.log('\n🔍 Buscando no Pelando.com.br...\n');

  try {
    const todas       = await buscarOfertas();
    const esportivas  = filtrarEsportes(todas);
    const comPlat     = filtrarPorPlataforma(esportivas);
    const comDesconto = filtrarDesconto(comPlat, config.MIN_DESCONTO);
    const comTemp     = config.MIN_TEMPERATURA > 0
      ? comDesconto.filter(o => (o.temperatura || 0) >= config.MIN_TEMPERATURA)
      : comDesconto;

    const comPilar     = comTemp.map(o => ({ ...o, ...detectarPilar(o) }));
    const enriquecidas = enriquecerOfertas(comPilar);
    const ordenadas    = ordenarPorPrioridade(enriquecidas).slice(0, MAX_RANKING);

    console.log(`✅ ${todas.length} buscadas → ${esportivas.length} esportivas → ${comTemp.length} filtradas → exibindo top ${ordenadas.length}\n`);

    // Cabeçalho da tabela
    const SEP = '─'.repeat(100);
    console.log(SEP);
    console.log(
      ' Pos  Score  Desc  Temp   Preço      Pilar         Produto'
    );
    console.log(SEP);

    ordenadas.forEach((o, i) => {
      const pos    = String(i + 1).padStart(3);
      const score  = String(o.score).padStart(5);
      const desc   = o.descontoNum ? `${String(o.descontoNum).padStart(3)}%` : '  —%';
      const temp   = String(o.temperatura || 0).padStart(4) + '°';
      const preco  = o.precoNumerico
        ? `R$${o.precoNumerico.toFixed(0).padStart(6)}`
        : '       —';
      const pilar  = (o.pilar || '—').padEnd(12);
      const maxTit = 50;
      const titulo = o.titulo.length > maxTit ? o.titulo.slice(0, maxTit) + '…' : o.titulo;

      const fimLinha = i < config.MAX_OFERTAS_DIA ? '' : '  ← abaixo do corte';
      console.log(` ${pos}  ${score}  ${desc}  ${temp}  ${preco}  ${pilar}  ${titulo}${fimLinha}`);
    });

    console.log(SEP);
    console.log(`\n✂  Linha de corte: top ${config.MAX_OFERTAS_DIA} (MAX_OFERTAS_DIA)`);

    // Breakdown dos componentes para os top 5
    console.log('\n🔬 Detalhe de score — top 5:\n');
    ordenadas.slice(0, 5).forEach(o => imprimirDebugScore(o));
    console.log('');

  } catch (err) {
    console.error('\n❌ Erro:', err.message);
    if (MODO_DEBUG) console.error(err.stack);
  }
}

// ── CLI ───────────────────────────────────────────────────────────────────────

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
    if (args.includes('--ranking')) {
      await exibirRanking();
      process.exit(0);
    }
    await executar();
  })();
}

module.exports = { executar, exibirRanking };
