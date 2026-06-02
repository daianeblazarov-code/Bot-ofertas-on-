const { detectarPlataforma, PLATAFORMAS } = require('./afiliados');

const PALAVRAS_ESPORTE = [
  // Calçados
  'tênis', 'tenis', 'chuteira', 'sapatilha', 'botinha',
  // Marcas
  'nike', 'adidas', 'puma', 'asics', 'new balance', 'under armour',
  'reebok', 'mizuno', 'fila', 'olympikus', 'penalty', 'topper',
  // Corrida
  'corrida', 'running', 'trail', 'maratona', 'cinto hidratação',
  'viseira corrida', 'faixa cabeça', 'relógio corrida', 'gps corrida',
  // Roupas e acessórios fitness
  'legging', 'bermuda esportiva', 'bermuda fitness', 'camisa esportiva',
  'camiseta esportiva', 'camiseta dry fit', 'dry fit', 'top fitness',
  'top esportivo', 'agasalho', 'moletom esportivo', 'regata esportiva',
  'short academia', 'shorts esportivo', 'meias esportivas', 'meia esportiva',
  // Equipamentos
  'haltere', 'kettlebell', 'anilha', 'elástico musculação', 'faixa resistência',
  'mochila esportiva', 'joelheira', 'caneleira', 'luva esportiva',
  'tapete yoga', 'tapete pilates',
  // Tecnologia esportiva
  'smartband', 'smartwatch', 'fitness tracker',
  // Suplementos e nutrição
  'whey', 'creatina', 'bcaa', 'aminoácido', 'pré-treino', 'pré treino',
  'pre treino', 'pre workout', 'suplemento', 'shaker', 'coqueteleira',
  // Modalidades
  'futebol', 'basquete', 'vôlei', 'volleyball', 'natação', 'ciclismo',
  'academia', 'musculação', 'crossfit', 'yoga', 'pilates', 'fitness',
  // Genéricos
  'esportivo', 'esportiva', 'esportes', 'treino',
];

// ── Detecção de pilar, emoji e subcategoria de prioridade ───────────────────
// subcategoria: 1=suplementos · 2=smartbands · 3=moda fitness · 4=acessórios

function detectarPilar(oferta) {
  const t = `${oferta.titulo} ${oferta.loja || ''}`.toLowerCase();

  if (/smartband|smartwatch|fitness.?tracker|rel[oó]gio corrida|gps corrida|monitor card[ií]aco/.test(t))
    return { pilar: 'academia', emoji: '📱', subcategoria: 2 };

  if (/whey|creatina/.test(t))
    return { pilar: 'academia', emoji: '🏋️', subcategoria: 1 };

  if (/pré.?treino|pre.?workout|bcaa|amino[aá]cido/.test(t))
    return { pilar: 'complementos', emoji: '🏋️', subcategoria: 1 };

  if (/corrida|running|trail|maratona|cinto hidrata|viseira|faixa cabe[cç]a/.test(t))
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
    return PALAVRAS_ESPORTE.some(p => texto.includes(p));
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

// ── Ordenação por prioridade ─────────────────────────────────────────────────
// 1º critério: maior desconto percentual
// 2º critério: subcategoria (1=suplementos > 2=smartbands > 3=moda > 4=acessórios)

function ordenarPorPrioridade(ofertas) {
  return [...ofertas].sort((a, b) => {
    const dA = a.descontoNum || 0;
    const dB = b.descontoNum || 0;
    if (dB !== dA) return dB - dA;
    return (a.subcategoria || 4) - (b.subcategoria || 4);
  });
}

module.exports = {
  filtrarEsportes,
  filtrarPorPlataforma,
  filtrarDesconto,
  detectarPilar,
  ordenarPorPrioridade,
};
