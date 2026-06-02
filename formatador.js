const SLOGANS = {
  nike: [
    'JUST DO IT — E AINDA ECONOMIZE MUITO',
    'PERFORMANCE NIKE: SEU PRÓXIMO NÍVEL COMEÇA AQUI',
    'O ÍCONE QUE TODO ATLETA REAL PRECISA',
    'SWOOSH NA QUALIDADE, SWOOSH NO PREÇO',
    'FEITO PARA QUEM NÃO ACEITA LIMITES',
    'CORRA MAIS LONGE COM QUEM OS CAMPEÕES CONFIAM',
  ],
  adidas: [
    'IMPOSSÍVEL É NADA — ESSE PREÇO PROVA ISSO',
    'TRÊS LISTRAS, UM PREÇO INCRÍVEL',
    'FEITO PARA QUEM NUNCA, NUNCA PARA',
    'ADIDAS: ONDE ESTILO ENCONTRA PERFORMANCE REAL',
    'VÁ ALÉM COM A MARCA DOS CAMPEÕES MUNDIAIS',
    'DA ACADEMIA À RUA COM O MELHOR DA ADIDAS',
  ],
  puma: [
    'VELOCIDADE, ESTILO E PREÇO QUE VOCÊ VAI AMAR',
    'PUMA: RUGINDO NA QUALIDADE E NO DESCONTO',
    'PERFORMANCE DE FELINO SEM PESAR NO BOLSO',
    'TUDO QUE UM ATLETA EXIGE, PELO PREÇO QUE MERECE',
  ],
  asics: [
    'CADA PASSADA COM MAIS CONFORTO E TECNOLOGIA',
    'TECNOLOGIA JAPONESA NO SEU PÉ POR MENOS',
    'O TÊNIS QUE OS CORREDORES SÉRIOS ESCOLHEM',
    'BIOMECÂNICA PERFEITA, PREÇO IMPOSSÍVEL DE IGNORAR',
  ],
  fila: [
    'ESTILO CLÁSSICO, PREÇO MODERNO E IMBATÍVEL',
    'A MARCA QUE VOLTOU PARA DOMINAR DE NOVO',
    'FILA: TRADIÇÃO, CONFORTO E DESCONTO REAL',
  ],
  tenis: [
    'SEU PÉ MERECE O MELHOR — APROVEITE AGORA',
    'CALCE SEU PRÓXIMO NÍVEL COM ESTILO E CONFORTO',
    'O PASSO CERTO COMEÇA COM O TÊNIS CERTO',
    'CONFORTO E ESTILO DO JEITO QUE VOCÊ MERECE',
    'MENOS NO BOLSO, MAIS NA PERFORMANCE DOS PÉS',
    'O TÊNIS PERFEITO ESTAVA ESPERANDO POR VOCÊ',
  ],
  chuteira: [
    'DOMINE O CAMPO COM O CALÇADO DOS CAMPEÕES',
    'CADA GOL COMEÇA COM A CHUTEIRA CERTA',
    'JOGUE COMO PROFISSIONAL, PAGUE COMO ESPERTO',
    'O GRAMADO NÃO MERECE MENOS QUE ISSO',
    'EXPLOSÃO DE POTÊNCIA A CADA TOQUE NA BOLA',
  ],
  corrida: [
    'SEU RECORDE PESSOAL COMEÇA COM ESSE INVESTIMENTO',
    'CADA KM CONTA — FAÇA VALER COM O EQUIPAMENTO CERTO',
    'MAIS VELOCIDADE, MAIS ESTILO, MENOS GASTO',
    'CORRA MAIS LONGE E GASTE MENOS FAZENDO ISSO',
    'QUEBRE SEUS LIMITES SEM QUEBRAR O BOLSO',
    'A CORRIDA PERFEITA EXIGE O EQUIPAMENTO PERFEITO',
  ],
  academia: [
    'TRANSFORME SEU CORPO COM O EQUIPAMENTO CERTO',
    'SUA EVOLUÇÃO COMEÇA COM ESSE INVESTIMENTO',
    'FORÇA, FOCO E ECONOMIA NA MESMA OFERTA',
    'CADA TREINO MAIS COMPLETO E MAIS ECONÔMICO',
    'CONSTRUA O CORPO QUE VOCÊ QUER SEM GASTAR DEMAIS',
  ],
  musculacao: [
    'MÚSCULO É CONSTRUÍDO COM DEDICAÇÃO E EQUIPAMENTO CERTO',
    'LEVANTE MAIS PESO E PAGUE MENOS POR ISSO',
    'CADA REPETIÇÃO VALE MAIS COM O EQUIPAMENTO CERTO',
  ],
  suplemento: [
    'POTENCIALIZE SEUS RESULTADOS COM O PREÇO CERTO',
    'NUTRIÇÃO DE ALTO NÍVEL POR MUITO MENOS',
    'SEU TREINO PEDE O MELHOR COMBUSTÍVEL — AQUI ESTÁ',
    'RESULTADOS REAIS COM ECONOMIA REAL NO BOLSO',
    'SUPLEMENTAÇÃO DE ELITE ACESSÍVEL PARA TODOS',
  ],
  pretreino: [
    'ENERGIA MÁXIMA POR MUITO MENOS DO QUE VOCÊ PENSA',
    'FOCO, FORÇA E DESCONTO — TRIFECTA DO ATLETA ESPERTO',
    'EXPLODIR DE ENERGIA SEM EXPLODIR O BOLSO',
    'ATIVAÇÃO TOTAL ANTES DE CADA TREINO ÉPICO',
  ],
  bcaa: [
    'RECUPERAÇÃO ACELERADA, CARTEIRA ALIVIADA',
    'AMINOÁCIDOS ESSENCIAIS POR UM PREÇO QUE FAZ SENTIDO',
    'MENOS CÂIMBRA, MAIS PERFORMANCE E MENOS GASTO',
    'PROTEÇÃO MUSCULAR QUE TODO ATLETA PRECISA',
  ],
  smartband: [
    'SEU PULSO MERECIA ESSA TECNOLOGIA — PREÇO JUSTO',
    'MONITORE CADA PASSO E CADA BATIDA DO CORAÇÃO',
    'TECNOLOGIA DE ELITE NO SEU PULSO POR MUITO MENOS',
    'DADOS REAIS, EVOLUÇÃO REAL, PREÇO REAL',
    'O SMARTBAND QUE OS ATLETAS SÉRIOS ESCOLHEM',
  ],
  roupa: [
    'VISTA A PERFORMANCE QUE VOCÊ MERECE',
    'ESTILO ESPORTIVO DO JEITO QUE VOCÊ PEDIU',
    'CONFORTO E ESTÉTICA EM CADA MOVIMENTO',
    'DA ACADEMIA À RUA: ESTILO SEM ABRIR MÃO DO CONFORTO',
    'TECNOLOGIA TÊXTIL QUE POTENCIALIZA CADA TREINO',
  ],
  yoga: [
    'EQUILÍBRIO DE CORPO E MENTE SEM PESAR NO BOLSO',
    'ENCONTRE SEU ZEN COM O EQUIPAMENTO PERFEITO',
    'FLEXIBILIDADE NO TREINO, FLEXIBILIDADE NO PREÇO',
    'PAZ INTERIOR E EXTERIOR — CUIDE DO SEU BEM-ESTAR',
  ],
  esporte: [
    'OFERTA IMPERDÍVEL PARA QUEM AMA VIVER ESPORTE',
    'PERFORMANCE E ECONOMIA EM UMA SÓ OPORTUNIDADE',
    'INVISTA NO SEU ESPORTE SEM PESAR NO BOLSO',
    'QUALIDADE ESPORTIVA COM PREÇO QUE CAI MUITO BEM',
    'PARA QUEM FAZ DO ESPORTE UM ESTILO DE VIDA REAL',
    'O DESCONTO QUE TODO ATLETA ESPERAVA CHEGAR',
    'MENOS NO BOLSO, MUITO MAIS NA SUA PERFORMANCE',
    'SUA PRÓXIMA CONQUISTA COMEÇA COM ESSA OFERTA',
    'EQUIPAMENTO SÉRIO PARA QUEM TREINA DE VERDADE',
  ],
};

const REGRAS_CATEGORIA = [
  [/nike/i,                                         'nike'],
  [/adidas/i,                                       'adidas'],
  [/puma/i,                                         'puma'],
  [/asics/i,                                        'asics'],
  [/fila\b/i,                                       'fila'],
  [/smartband|smartwatch|fitness.?tracker/i,        'smartband'],
  [/pré.?treino|pre.?workout/i,                     'pretreino'],
  [/bcaa|amino[aá]cido/i,                           'bcaa'],
  [/whey|creatina|suplemento/i,                     'suplemento'],
  [/chuteira/i,                                     'chuteira'],
  [/corrida|running|maratona|trail/i,               'corrida'],
  [/musculação|musculacao|haltere|kettlebell|anilha/i, 'musculacao'],
  [/academia|crossfit|funcional/i,                  'academia'],
  [/yoga|pilates|meditação|tapete/i,                'yoga'],
  [/legging|bermuda|short|camiseta|camisa esport|regata|top (fitness|esportivo)|dry.?fit/i, 'roupa'],
  [/tênis|tenis/i,                                  'tenis'],
];

function detectarCategoria(titulo) {
  for (const [regex, categoria] of REGRAS_CATEGORIA) {
    if (regex.test(titulo)) return categoria;
  }
  return 'esporte';
}

function hashTitulo(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h + str.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(h);
}

function gerarSlogan(titulo) {
  const categoria = detectarCategoria(titulo);
  const lista = SLOGANS[categoria] || SLOGANS.esporte;
  return lista[hashTitulo(titulo) % lista.length];
}

// ── Formatação ───────────────────────────────────────────────────────────────

function limpar(preco) {
  return preco ? preco.replace(/R\$\s*/, '').trim() : null;
}

function formatarOferta(oferta) {
  const emoji  = oferta.emoji || '🏃';
  const slogan = gerarSlogan(oferta.titulo);
  const linhas = [];

  linhas.push(`${emoji} *${oferta.titulo}*`);
  linhas.push(`${slogan} ✨`);
  linhas.push('');

  if (oferta.precoOriginal) {
    linhas.push(`💸 De: R$ ${limpar(oferta.precoOriginal)}`);
  }
  if (oferta.precoPromo) {
    const pct = oferta.desconto ? ` (${oferta.desconto} OFF)` : '';
    linhas.push(`⚡ Por: R$ ${limpar(oferta.precoPromo)}${pct}`);
  } else if (oferta.gratis) {
    linhas.push(`⚡ GRÁTIS`);
  } else {
    linhas.push(`⚡ Ver preço no link`);
  }

  linhas.push('');
  linhas.push(`🔗 👇 Link para Comprar 👇`);
  linhas.push(oferta.linkAfiliado);

  return linhas.join('\n');
}

function formatarParaWhatsApp(ofertas) {
  return ofertas.map(formatarOferta);
}

module.exports = { formatarParaWhatsApp };
