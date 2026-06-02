const fs = require('fs');
const path = require('path');

const ARQUIVO = path.join(__dirname, 'historico.json');

function carregar() {
  if (!fs.existsSync(ARQUIVO)) return {};
  try {
    return JSON.parse(fs.readFileSync(ARQUIVO, 'utf-8'));
  } catch {
    return {};
  }
}

function salvar(historico) {
  fs.writeFileSync(ARQUIVO, JSON.stringify(historico, null, 2), 'utf-8');
}

// Retorna somente as ofertas que ainda não foram postadas
function filtrarNovos(ofertas) {
  const historico = carregar();
  return ofertas.filter(o => !historico[o.id]);
}

// Marca as ofertas como postadas no histórico
function marcarComoPostadas(ofertas) {
  const historico = carregar();
  const agora = new Date().toISOString();
  for (const o of ofertas) {
    if (!o.id) continue;
    historico[o.id] = {
      titulo: o.titulo,
      loja: o.loja,
      postedAt: agora,
    };
  }
  salvar(historico);
  return Object.keys(historico).length;
}

// Limpa todo o histórico (permite repostar tudo)
function resetar() {
  salvar({});
}

function estatisticas() {
  const h = carregar();
  const total = Object.keys(h).length;
  if (total === 0) return 'histórico vazio';
  const datas = Object.values(h).map(e => e.postedAt).sort();
  const primeiro = new Date(datas[0]).toLocaleDateString('pt-BR');
  const ultimo = new Date(datas[datas.length - 1]).toLocaleDateString('pt-BR');
  return `${total} oferta(s) já postadas (desde ${primeiro} até ${ultimo})`;
}

module.exports = { filtrarNovos, marcarComoPostadas, resetar, estatisticas };
