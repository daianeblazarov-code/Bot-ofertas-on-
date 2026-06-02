require('dotenv').config();
const axios = require('axios');

const PLATAFORMAS = {
  mercadolivre: {
    nome: 'Mercado Livre',
    icone: '🛍️',
    dominios: ['mercadolivre.com', 'mercadolibre.com'],
    nomes: ['mercado livre', 'mercadolivre', 'mercado libre'],
    credencial: () => process.env.MERCADOLIVRE_TAG || process.env.MERCADOLIVRE_AFILIADO_TAG,
  },
  amazon: {
    nome: 'Amazon',
    icone: '📦',
    dominios: ['amazon.com.br', 'amazon.com', 'amzn.to', 'amzn.com'],
    nomes: ['amazon'],
    credencial: () => null,
  },
  shopee: {
    nome: 'Shopee',
    icone: '🛒',
    dominios: ['shopee.com.br', 'shope.ee', 'shopee.com'],
    nomes: ['shopee'],
    credencial: () => process.env.SHOPEE_AFFILIATE_TOKEN,
  },
  netshoes: {
    nome: 'Netshoes',
    icone: '👟',
    dominios: ['netshoes.com.br', 'netshoes.com'],
    nomes: ['netshoes'],
    credencial: () => null,
  },
};

// ── Detecção de plataforma ───────────────────────────────────────────────────

function detectarPlataforma(sourceUrl = '', lojaNome = '') {
  const url  = sourceUrl.toLowerCase();
  const loja = lojaNome.toLowerCase();
  for (const [chave, p] of Object.entries(PLATAFORMAS)) {
    if (p.dominios.some(d => url.includes(d)) || p.nomes.some(n => loja.includes(n))) {
      return chave;
    }
  }
  return null;
}

// ── Mercado Livre → link de rastreamento com tag ─────────────────────────────

function gerarML(url) {
  const tag = process.env.MERCADOLIVRE_TAG || process.env.MERCADOLIVRE_AFILIADO_TAG;
  if (!tag) return null;
  try {
    const parsed = new URL(url);
    parsed.searchParams.set('tag', tag);
    return parsed.toString();
  } catch (_) {
    return null;
  }
}

// ── Shopee → shope.ee via API ────────────────────────────────────────────────

let shopeeApiDesabilitada = false;

async function gerarShopee(url) {
  const token = process.env.SHOPEE_AFFILIATE_TOKEN;
  const id    = process.env.SHOPEE_AFFILIATE_ID;
  if (!token || shopeeApiDesabilitada) return null;

  try {
    const { data } = await axios.post(
      'https://open-api.affiliate.shopee.com.br/v1/links/gen',
      { original_url: url, affiliate_id: id },
      {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        timeout: 8000,
      }
    );

    const link = data?.data?.shortUrl || data?.shortUrl || data?.short_url || data?.link;
    if (link && link.includes('shope.ee/')) return link;

    console.warn('  ⚠ Shopee API retornou formato inesperado — oferta ignorada');
    return null;

  } catch (err) {
    const s   = err.response?.status;
    const msg = err.response?.data?.message || err.response?.data?.error || err.message;
    if (s === 401 || s === 403) {
      shopeeApiDesabilitada = true;
      console.warn(`  ⚠ SHOPEE_AFFILIATE_TOKEN inválido (${s}): ${msg}`);
    }
    return null;
  }
}

// ── Interface pública ────────────────────────────────────────────────────────

async function gerarLinkAfiliado(sourceUrl, lojaNome) {
  if (!sourceUrl) return null;

  const plataforma = detectarPlataforma(sourceUrl, lojaNome);
  if (!plataforma) return null;

  if (!PLATAFORMAS[plataforma].credencial()) return null;

  switch (plataforma) {
    case 'mercadolivre': return gerarML(sourceUrl);
    case 'shopee':       return await gerarShopee(sourceUrl);
    default:             return null;
  }
}

function statusAfiliados() {
  const linhas = [];

  const mlTag = process.env.MERCADOLIVRE_TAG || process.env.MERCADOLIVRE_AFILIADO_TAG;
  linhas.push(mlTag
    ? `   🛍️ Mercado Livre  ✅ link de rastreamento — tag: ${mlTag}`
    : `   🛍️ Mercado Livre  ❌ MERCADOLIVRE_TAG ausente no .env`);

  linhas.push(`   📦 Amazon         ⛔ amzn.to sem API pública — sempre ignorada`);

  const shToken = process.env.SHOPEE_AFFILIATE_TOKEN;
  const shId    = process.env.SHOPEE_AFFILIATE_ID;
  linhas.push(shToken
    ? `   🛒 Shopee         ✅ shope.ee via API — ID: ${shId || '(não definido)'}`
    : `   🛒 Shopee         ❌ SHOPEE_AFFILIATE_TOKEN ausente`);

  linhas.push(`   👟 Netshoes       ⛔ sem link curto oficial — sempre ignorada`);

  return linhas.join('\n');
}

module.exports = { gerarLinkAfiliado, detectarPlataforma, statusAfiliados, PLATAFORMAS };
