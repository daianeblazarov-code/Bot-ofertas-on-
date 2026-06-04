require('dotenv').config();

// ── Configuração centralizada ────────────────────────────────────────────────
// Todas as constantes tunáveis do sistema vivem aqui.
// Variáveis de ambiente sobrescrevem os defaults.

module.exports = {
  // ── Filtros ────────────────────────────────────────────────────────────────
  MIN_DESCONTO:            Number(process.env.MIN_DESCONTO)            || 10,
  MIN_TEMPERATURA:         Number(process.env.MIN_TEMPERATURA)         || 0,
  MAX_OFERTAS_DIA:         Number(process.env.MAX_OFERTAS_DIA)         || 15,

  // ── Histórico ─────────────────────────────────────────────────────────────
  DIAS_VALIDADE_HISTORICO: Number(process.env.DIAS_VALIDADE_HISTORICO) || 30,

  // ── Geração de links afiliados ────────────────────────────────────────────
  LOTE_AFILIADOS:          Number(process.env.LOTE_AFILIADOS)          || 5,

  // ── Pesos do score (devem somar 1.0) ──────────────────────────────────────
  PESOS_SCORE: {
    desconto:    parseFloat(process.env.PESO_DESCONTO)    || 0.30,
    temperatura: parseFloat(process.env.PESO_TEMPERATURA) || 0.40,
    categoria:   parseFloat(process.env.PESO_CATEGORIA)   || 0.30,
  },

  // ── Valores de referência para normalização (0→1) ─────────────────────────
  SCORE_NORMALIZACAO: {
    maxDesconto:    Number(process.env.SCORE_MAX_DESCONTO)    || 80,   // 80 % = teto de desconto
    maxTemperatura: Number(process.env.SCORE_MAX_TEMPERATURA) || 300,  // 300 °C = teto de temperatura
  },

  // ── Pesos de conversão por categoria (0-100) ──────────────────────────────
  // Quanto maior, mais lucrativo/conversivo tende a ser o produto.
  PESOS_CATEGORIAS: {
    creatina:       100,
    whey:            95,
    tenis_corrida:   90,
    smartwatch:      85,
    gps_corrida:     85,
    pre_treino:      75,
    bcaa:            70,
    equipamento:     65,
    legging:         55,
    top_fitness:     50,
    bermuda_fitness: 45,
    dry_fit:         40,
    mochila:         35,
    tapete:          30,
    shaker:          25,
    meias:           20,
    acessorios:      10,
  },

  // ── Bônus de score por faixa de ticket (R$) ───────────────────────────────
  // Produtos de ticket mais alto geram comissões maiores.
  // Peso moderado para não premiar produtos ruins só por serem caros.
  TICKET_FAIXAS: [
    { max: 100,      bonus: 3  },
    { max: 300,      bonus: 7  },
    { max: 700,      bonus: 12 },
    { max: 1500,     bonus: 15 },
    { max: Infinity, bonus: 18 },
  ],
};
