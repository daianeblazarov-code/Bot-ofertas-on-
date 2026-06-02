const axios = require('axios');
const { detectarPlataforma } = require('./afiliados');

const API = 'https://api-web.pelando.com.br';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Origin': 'https://www.pelando.com.br',
  'Referer': 'https://www.pelando.com.br/',
};

// Termos organizados por pilar — buscados individualmente na API do Pelando
const TERMOS = [
  // Pilar 1 — Corrida
  'tênis corrida', 'tênis trail', 'meias corrida',
  'cinto hidratação', 'viseira corrida', 'relógio corrida', 'gps corrida',
  // Pilar 2 — Academia & Fitness
  'whey protein', 'whey isolado', 'creatina monohidratada',
  'legging fitness', 'legging academia',
  'smartband', 'smartwatch esportivo',
  'elástico musculação', 'faixa resistência',
  'top fitness', 'short academia', 'bermuda fitness', 'camiseta dry fit',
  // Pilar 3 — Complementos
  'pré treino', 'pre workout', 'bcaa', 'tapete yoga', 'tapete pilates', 'shaker',
  // Marcas e termos amplos (mantidos)
  'nike', 'adidas', 'puma', 'asics', 'under armour', 'tenis', 'chuteira',
];

async function buscarHottest(limite = 50) {
  const { data } = await axios.get(`${API}/feed/v2/hottest?limit=${limite}`, {
    headers: HEADERS, timeout: 15000,
  });
  return (data.data?.deals || []).map(normalizarDeal);
}

async function buscarPorTermo(termo) {
  const resultado = [];
  try {
    const params = new URLSearchParams({
      term: termo,
      size: '20',
      page: '1',
      hideExpired: 'true',
      sortOption: 'temperature',
    });
    const { data } = await axios.get(`${API}/feed/search?${params}`, {
      headers: HEADERS, timeout: 15000,
    });
    resultado.push(...(data.data?.deals || []).map(normalizarDeal));
  } catch (e) {
    console.warn(`  ⚠ Busca "${termo}": ${e.message}`);
  }
  return resultado;
}

function normalizarDeal(deal) {
  const sourceUrl = deal.sourceUrl || '';
  const loja = deal.store?.name || '';
  return {
    id:           deal.id || deal.slug || '',
    titulo:       deal.title || '',
    precoPromo:   deal.price != null ? `R$ ${String(deal.price).replace('.', ',')}` : null,
    precoOriginal: calcularPrecoOriginal(deal),
    desconto:     deal.discountPercentage ? `${deal.discountPercentage}%` : null,
    descontoNum:  deal.discountPercentage || 0,
    link:         deal.redirectUrl || sourceUrl,
    sourceUrl,
    loja,
    plataforma:   detectarPlataforma(sourceUrl, loja),
    temperatura:  deal.temperature || 0,
    gratis:       deal.kind === 'free',
  };
}

function calcularPrecoOriginal(deal) {
  if (!deal.price) return null;
  if (deal.discountPercentage) {
    const original = deal.price / (1 - deal.discountPercentage / 100);
    return `R$ ${original.toFixed(2).replace('.', ',')}`;
  }
  if (deal.discountFixed) {
    return `R$ ${(deal.price + deal.discountFixed).toFixed(2).replace('.', ',')}`;
  }
  return null;
}

async function buscarOfertas() {
  const todasOfertas = [];
  const vistos = new Set();

  const adicionar = (lista) => {
    for (const o of lista) {
      const chave = o.id || (o.titulo + o.link);
      if (!vistos.has(chave) && o.titulo) {
        vistos.add(chave);
        todasOfertas.push(o);
      }
    }
  };

  console.log('  → feed/v2/hottest (mais quentes)');
  try { adicionar(await buscarHottest(50)); }
  catch (e) { console.warn('  ⚠ hottest:', e.message); }

  for (const termo of TERMOS) {
    console.log(`  → search: "${termo}"`);
    adicionar(await buscarPorTermo(termo));
    await new Promise(r => setTimeout(r, 500));
  }

  return todasOfertas;
}

module.exports = { buscarOfertas };
