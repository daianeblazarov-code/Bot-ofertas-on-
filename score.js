const config = require('./config');

// ── Peso de categoria (Implementação 2) ──────────────────────────────────────
// Retorna valor 0-100 representando potencial de conversão do produto.
// Ordem importa: padrões mais específicos primeiro.

function obterPesoCategoria(oferta) {
  const t   = `${oferta.titulo} ${oferta.loja || ''}`.toLowerCase();
  const cat = config.PESOS_CATEGORIAS;

  if (/creatina/.test(t))                                                                          return cat.creatina;
  if (/whey/.test(t))                                                                              return cat.whey;
  // Tênis de corrida: exige combinação título+categoria para evitar genéricos
  if (/t[eê]nis.{0,20}(corrida|running|trail)|(corrida|running|trail).{0,20}t[eê]nis/.test(t))   return cat.tenis_corrida;
  if (/smartwatch|garmin\b|fenix|forerunner|vivoactive|polar grit|suunto/.test(t))                return cat.smartwatch;
  if (/gps.{0,12}(corrida|running)|rel[oó]gio.{0,12}corrida/.test(t))                            return cat.gps_corrida;
  if (/pr[eé].?treino|pre.?workout/.test(t))                                                       return cat.pre_treino;
  if (/bcaa|amino[aá]cido/.test(t))                                                               return cat.bcaa;
  if (/haltere|kettlebell|anilha|el[aá]stico muscula|faixa resist/.test(t))                       return cat.equipamento;
  if (/legging/.test(t))                                                                           return cat.legging;
  if (/top fitness|top esportivo/.test(t))                                                         return cat.top_fitness;
  if (/bermuda fitness|bermuda esportiva|short academia|shorts esport/.test(t))                   return cat.bermuda_fitness;
  if (/dry.?fit|camiseta (esport|academia)/.test(t))                                              return cat.dry_fit;
  if (/mochila/.test(t))                                                                           return cat.mochila;
  if (/tapete (yoga|pilates)/.test(t))                                                             return cat.tapete;
  if (/shaker|coqueteleira/.test(t))                                                               return cat.shaker;
  if (/\bmeia (esportiva|corrida|fitness|academia)\b|meias esportivas/.test(t))                   return cat.meias;
  return cat.acessorios;
}

// ── Bônus de ticket (Implementação 8) ────────────────────────────────────────

function obterBonusTicket(precoNumerico) {
  if (!precoNumerico || precoNumerico <= 0) return 0;
  for (const faixa of config.TICKET_FAIXAS) {
    if (precoNumerico <= faixa.max) return faixa.bonus;
  }
  return 0;
}

// ── Score inteligente (Implementação 1) ──────────────────────────────────────
// Normaliza cada componente para 0-1 e pondera pelos pesos de config.
// Componentes:
//   desconto    → 0-30 pontos (peso 0.30)
//   temperatura → 0-40 pontos (peso 0.40)
//   categoria   → 0-30 pontos (peso 0.30)
//   ticketBonus →  3-18 pontos extra (moderado, não zera outros)
// Score máximo teórico: ~118 (com produto premium + alta temperatura)

function calcularScore(oferta) {
  const { maxDesconto, maxTemperatura } = config.SCORE_NORMALIZACAO;
  const { desconto: pDesc, temperatura: pTemp, categoria: pCat } = config.PESOS_SCORE;

  const descontoNorm    = Math.min(1, (oferta.descontoNum  || 0) / maxDesconto);
  const temperaturaNorm = Math.min(1, (oferta.temperatura  || 0) / maxTemperatura);
  const categoriaNorm   = obterPesoCategoria(oferta) / 100;
  const bonusTicket     = obterBonusTicket(oferta.precoNumerico);

  const pontoDesconto    = Math.round(descontoNorm    * pDesc * 100);
  const pontoTemperatura = Math.round(temperaturaNorm * pTemp * 100);
  const pontoCategoria   = Math.round(categoriaNorm   * pCat  * 100);
  const score            = pontoDesconto + pontoTemperatura + pontoCategoria + bonusTicket;

  return { score, pontoDesconto, pontoTemperatura, pontoCategoria, bonusTicket };
}

// ── Tags múltiplas (Implementação 6) ─────────────────────────────────────────
// Permite múltiplas classificações por oferta.
// Compatível com pilar existente — pilar é sempre adicionado como tag.

function extrairTags(oferta) {
  const t    = `${oferta.titulo} ${oferta.loja || ''}`.toLowerCase();
  const tags = new Set();

  const MAPA = [
    // Marcas
    [/\bnike\b/,                                    'nike'],
    [/\badidas\b/,                                  'adidas'],
    [/\bpuma\b/,                                    'puma'],
    [/\basics\b/,                                   'asics'],
    [/\bmizuno\b/,                                  'mizuno'],
    [/new balance/,                                 'new-balance'],
    [/under armour/,                                'under-armour'],
    [/\breebok\b/,                                  'reebok'],
    [/\bgarmin\b/,                                  'garmin'],
    [/\bpolar\b/,                                   'polar'],
    [/\bsuunto\b/,                                  'suunto'],
    [/\bDynafit\b/i,                                'dynafit'],
    // Modalidades
    [/corrida|running/,                             'corrida'],
    [/\btrail\b/,                                   'trail'],
    [/\bmaratona\b/,                                'maratona'],
    [/academia|muscula/,                            'academia'],
    [/\bcrossfit\b/,                                'crossfit'],
    [/\byoga\b/,                                    'yoga'],
    [/\bpilates\b/,                                 'pilates'],
    [/\bfitness\b/,                                 'fitness'],
    [/\bfutebol\b/,                                 'futebol'],
    [/nata[çc][aã]o/,                               'natação'],
    [/\bciclismo\b/,                                'ciclismo'],
    // Produtos
    [/\bwhey\b/,                                    'whey'],
    [/\bcreatina\b/,                                'creatina'],
    [/\bbcaa\b|amino[aá]cido/,                      'bcaa'],
    [/pr[eé].?treino|pre.?workout/,                 'pre-treino'],
    [/\bsuplemento\b/,                              'suplemento'],
    [/t[eê]nis/,                                    'tenis'],
    [/\bchuteira\b/,                                'chuteira'],
    [/\blegging\b/,                                 'legging'],
    [/dry.?fit/,                                    'dry-fit'],
    [/smartwatch|smartband/,                        'smartwatch'],
    [/\bgps\b/,                                     'gps'],
    [/haltere|kettlebell|anilha/,                   'musculacao'],
    [/\btapete\b/,                                  'tapete'],
    [/shaker|coqueteleira/,                         'shaker'],
    [/\bmeia[s]?\b/,                                'meias'],
  ];

  for (const [rx, tag] of MAPA) {
    if (rx.test(t)) tags.add(tag);
  }

  if (oferta.pilar) tags.add(oferta.pilar);
  return [...tags];
}

// ── Debug de score (Implementação 13) ────────────────────────────────────────

function imprimirDebugScore(oferta) {
  const maxLen = 55;
  const titulo = oferta.titulo.length > maxLen
    ? oferta.titulo.slice(0, maxLen) + '…'
    : oferta.titulo;

  console.log(`\n  📊 ${titulo}`);
  console.log(`     Score total:  ${oferta.score}`);
  console.log(`     Desconto:     ${oferta.pontoDesconto} pts  (${oferta.descontoNum || 0}% desc)`);
  console.log(`     Temperatura:  ${oferta.pontoTemperatura} pts  (${oferta.temperatura || 0}°C)`);
  console.log(`     Categoria:    ${oferta.pontoCategoria} pts`);
  if (oferta.bonusTicket) {
    console.log(`     Ticket:      +${oferta.bonusTicket} bônus  (R$ ${oferta.precoNumerico?.toFixed(2) || '?'})`);
  }
  if (oferta.tags?.length) {
    console.log(`     Tags:         ${oferta.tags.join(', ')}`);
  }
}

module.exports = { calcularScore, obterPesoCategoria, obterBonusTicket, extrairTags, imprimirDebugScore };
