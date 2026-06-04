const { detectarPlataforma, PLATAFORMAS } = require('./afiliados');

// ── Padrões de inclusão (Implementação 9) ────────────────────────────────────
// Convertidos de includes() para regex com word-boundaries onde necessário.
// Ordem: mais específico → mais genérico.

const PADROES_INCLUIR = [
  // Calçados — "tênis de mesa" é explicitamente excluído abaixo
  /\bt[eê]nis\b/i,
  /\bchuteira\b/i,
  /\bsapatilha\b/i,
  /\bbotinha\b/i,
  // Marcas esportivas reconhecidas
  /\bnike\b/i,
  /\badidas\b/i,
  /\bpuma\b/i,
  /\basics\b/i,
  /new balance/i,
  /under armour/i,
  /\breebok\b/i,
  /\bmizuno\b/i,
  /\bfila\b/i,
  /\bolympikus\b/i,
  /\bpenalty\b/i,
  /\btopper\b/i,
  /\bgarmin\b/i,
  /\bpolar\b/i,
  /\bsuunto\b/i,
  // Corrida
  /\bcorrida\b/i,
  /\brunning\b/i,
  /\btrail\b/i,
  /\bmaratona\b/i,
  /cinto hidrata/i,
  /viseira corrida/i,
  /faixa cabe[çc]/i,
  /rel[oó]gio corrida/i,
  /gps corrida/i,
  // Roupas e acessórios fitness
  /\blegging\b/i,
  /bermuda esportiva/i,
  /bermuda fitness/i,
  /camisa esportiva/i,
  /camiseta esportiva/i,
  /camiseta dry.?fit/i,
  /\bdry.?fit\b/i,
  /top fitness/i,
  /top esportivo/i,
  /\bagasalho\b/i,
  /moletom esportivo/i,
  /regata esportiva/i,
  /short academia/i,
  /shorts esportivo/i,
  /meias esportivas/i,
  /meia esportiva/i,
  // Equipamentos
  /\bhaltere\b/i,
  /\bkettlebell\b/i,
  /\banilha\b/i,
  /el[aá]stico muscula/i,
  /faixa resist[eê]ncia/i,
  /mochila esportiva/i,
  /\bjoelheira\b/i,
  /\bcaneleira\b/i,
  /luva esportiva/i,
  /tapete yoga/i,
  /tapete pilates/i,
  // Tecnologia esportiva
  /\bsmartband\b/i,
  /\bsmartwatch\b/i,
  /fitness tracker/i,
  // Suplementos
  /\bwhey\b/i,
  /\bcreatina\b/i,
  /\bbcaa\b/i,
  /amino[aá]cido/i,
  /pr[eé].?treino/i,
  /pre.?workout/i,
  /\bsuplemento\b/i,
  /\bshaker\b/i,
  /\bcoqueteleira\b/i,
  // Modalidades
  /\bfutebol\b/i,
  /\bbasquete\b/i,
  /\bv[oô]lei\b/i,
  /volleyball/i,
  /nata[çc][aã]o/i,
  /\bciclismo\b/i,
  /\bacademia\b/i,
  /muscula[çc][aã]o/i,
  /\bcrossfit\b/i,
  /\byoga\b/i,
  /\bpilates\b/i,
  /\bfitness\b/i,
  // Genéricos esportivos — só como última âncora
  /\besportivo\b/i,
  /\besportiva\b/i,
  /\besportes\b/i,
  /\btreino\b/i,
];

// Padrões de exclusão — verificados ANTES da inclusão.
// Produtos que passam por "brand match" mas são irrelevantes para treino/corrida/fitness.
const PADROES_EXCLUIR = [
  /t[eê]nis\s+de\s+mesa/i,
  /\bminiatura\b/i,
  /\bboneco\b/i,
  /\bboneca\b/i,
  /\bbrinquedo/i,
  /\binfantil\b/i,
  /\bcaneca\b/i,
  /\bchaveiro\b/i,
  /\bpijama\b/i,
  /papel de parede/i,
  /\bposter\b/i,
  /quadro decorat/i,
  /decora[çc][aã]o\s+(esportiva|nike|adidas)/i,
  /\bpelúcia\b/i,
  /\bfigurinha\b/i,
  /\bcaminha\b/i,  // caminha de pet com marca esportiva no nome
];

// ── Detecção de pilar, emoji e subcategoria ──────────────────────────────────
// subcategoria: 1=suplementos · 2=smartbands · 3=moda fitness · 4=acessórios

function detectarPilar(oferta) {
  const t = `${oferta.titulo} ${oferta.loja || ''}`.toLowerCase();

  if (/smartband|smartwatch|fitness.?tracker|rel[oó]gio corrida|gps corrida|monitor card[ií]aco/.test(t))
    return { pilar: 'academia', emoji: '📱', subcategoria: 2 };

  if (/whey|creatina/.test(t))
    return { pilar: 'academia', emoji: '🏋️', subcategoria: 1 };

  if (/pré.?treino|pre.?workout|bcaa|amino[aá]cido/.test(t))
    return { pilar: 'complementos', emoji: '🏋️', subcategoria: 1 };

  if (/corrida|running|trail|maratona|cinto hidrata|viseira|faixa cabe[çc]a/.test(t))
    return { pilar: 'corrida', emoji: '🏃', subcategoria: 4 };

  if (/legging|top fitness|top esportivo|short academia|bermuda fitness|dry.?fit/.test(t))
    return { pilar: 'academia', emoji: '🏋️', subcategoria: 3 };

  if (/tapete (yoga|pilates)|shaker|coqueteleira|meia esportiva/.test(t))
    return { pilar: 'complementos', emoji: '🏋️', subcategoria: 4 };

  if (/academia|fitness|muscula|el[aá]stico|faixa resist|haltere|kettlebell|anilha|yoga|pilates/.test(t))
    return { pilar: 'academia', emoji: '🏋️', subcategoria: 4 };

  return { pilar: 'corrida', emoji: '🏃', subcategoria: 4 };
}

// ── Filtros ──────────────────────────────────────────────────────────────────

function filtrarEsportes(ofertas) {
  return ofertas.filter(o => {
    const texto = `${o.titulo} ${o.loja || ''}`.toLowerCase();

    // Exclui falsos positivos primeiro
    if (PADROES_EXCLUIR.some(rx => rx.test(texto))) return false;

    // Então testa padrões de inclusão
    return PADROES_INCLUIR.some(rx => rx.test(texto));
  });
}

function filtrarPorPlataforma(ofertas) {
  const ativas = new Set(
    Object.entries(PLATAFORMAS)
      .filter(([, p]) => p.credencial())
      .map(([chave]) => chave)
  );

  if (ativas.size === 0) {
    console.warn('  ⚠ Nenhuma plataforma configurada');
    console.warn('     Configure MERCADOLIVRE_TAG e/ou SHOPEE_AFFILIATE_TOKEN no .env');
    return [];
  }

  return ofertas.filter(o => ativas.has(detectarPlataforma(o.sourceUrl || o.link, o.loja)));
}

function filtrarDesconto(ofertas, minPct = 10) {
  // Só exclui quando o desconto É CONHECIDO e está abaixo do mínimo.
  // descontoNum === 0 significa dado ausente na API do Pelando, não "sem desconto".
  return ofertas.filter(o => !o.descontoNum || o.descontoNum >= minPct);
}

// ── Ordenação por score (Implementação 4) ────────────────────────────────────
// Nova lógica: 1º score (inteligente) → 2º temperatura → 3º desconto
// Substituiu: 1º desconto → 2º subcategoria

function ordenarPorPrioridade(ofertas) {
  return [...ofertas].sort((a, b) => {
    const sA = a.score       || 0;
    const sB = b.score       || 0;
    if (sB !== sA) return sB - sA;

    const tA = a.temperatura || 0;
    const tB = b.temperatura || 0;
    if (tB !== tA) return tB - tA;

    return (b.descontoNum || 0) - (a.descontoNum || 0);
  });
}

module.exports = {
  filtrarEsportes,
  filtrarPorPlataforma,
  filtrarDesconto,
  detectarPilar,
  ordenarPorPrioridade,
};
