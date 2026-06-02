const ExcelJS = require('exceljs');
const path    = require('path');

const ARQUIVO       = path.join(__dirname, 'historico.xlsx');
const DIAS_VALIDADE = 30;

const PILAR_LABEL = {
  corrida:      'Corrida',
  academia:     'Academia & Fitness',
  complementos: 'Complementos',
};

const COR_STATUS = {
  Enviado:  'FFC8E6C9', // verde claro
  Pendente: 'FFFFF9C4', // amarelo claro
  Ignorado: 'FFFFCDD2', // vermelho claro
};

// ── Workbook helpers ─────────────────────────────────────────────────────────

function _criarPlanilha(wb) {
  const ws = wb.addWorksheet('Histórico');
  ws.columns = [
    { header: 'Data/Hora',       key: 'data',     width: 20, style: { numFmt: 'dd/mm/yyyy hh:mm' } },
    { header: 'Pilar',           key: 'pilar',    width: 22 },
    { header: 'Nome do Produto', key: 'nome',     width: 55 },
    { header: 'Preço',           key: 'preco',    width: 14 },
    { header: '% Desconto',      key: 'desconto', width: 12 },
    { header: 'Link',            key: 'link',     width: 70 },
    { header: 'Status',          key: 'status',   width: 12 },
    { header: 'ID',              key: 'id',       width: 30, hidden: true },
  ];
  const hr = ws.getRow(1);
  for (let c = 1; c <= 7; c++) {
    const cell = hr.getCell(c);
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B5E20' } };
    cell.font      = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.border    = _borda();
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  }
  hr.height = 22;
  ws.views        = [{ state: 'frozen', ySplit: 1 }];
  ws.autoFilter   = { from: 'A1', to: 'G1' };
  return ws;
}

async function _carregarWb() {
  const wb = new ExcelJS.Workbook();
  try {
    await wb.xlsx.readFile(ARQUIVO);
    if (!wb.getWorksheet('Histórico')) _criarPlanilha(wb);
  } catch {
    _criarPlanilha(wb);
  }
  return wb;
}

function _borda() {
  const s = { style: 'thin', color: { argb: 'FFB0BEC5' } };
  return { top: s, left: s, bottom: s, right: s };
}

function _estilizarLinha(row, status) {
  const cor = COR_STATUS[status] || 'FFFFFFFF';
  for (let c = 1; c <= 7; c++) {
    const cell = row.getCell(c);
    cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: cor } };
    cell.border = _borda();
    cell.alignment = { vertical: 'middle', wrapText: c === 3 };
  }
  row.height = 18;
}

function _lerLinhas(ws) {
  const linhas = [];
  ws.eachRow((row, rowNum) => {
    if (rowNum === 1) return;
    const id = row.getCell(8).value;
    if (!id) return;
    const dataVal = row.getCell(1).value;
    linhas.push({
      rowNum,
      data:     dataVal instanceof Date ? dataVal : (dataVal ? new Date(dataVal) : null),
      pilar:    row.getCell(2).value,
      nome:     row.getCell(3).value,
      preco:    row.getCell(4).value,
      desconto: row.getCell(5).value,
      link:     row.getCell(6).value,
      status:   String(row.getCell(7).value || ''),
      id:       String(id),
    });
  });
  return linhas;
}

function _limite30() {
  const d = new Date();
  d.setDate(d.getDate() - DIAS_VALIDADE);
  return d;
}

// ── API pública ──────────────────────────────────────────────────────────────

async function filtrarNovos(ofertas) {
  const wb     = await _carregarWb();
  const ws     = wb.getWorksheet('Histórico');
  const linhas = _lerLinhas(ws);
  const limite = _limite30();

  const excluir = new Set();
  for (const l of linhas) {
    const recente = l.data && l.data > limite;
    if (l.status === 'Ignorado')              { excluir.add(l.id); continue; }
    if (l.status === 'Enviado' && recente)    excluir.add(l.id);
  }

  return ofertas.filter(o => !excluir.has(String(o.id)));
}

async function adicionarPendentes(prontas) {
  const wb     = await _carregarWb();
  const ws     = wb.getWorksheet('Histórico');
  const linhas = _lerLinhas(ws);
  const mapa   = Object.fromEntries(linhas.map(l => [l.id, l]));
  const agora  = new Date();

  for (const o of prontas) {
    const id         = String(o.id);
    const pilarLabel = PILAR_LABEL[o.pilar] || o.pilar || '';
    const desconto   = o.descontoNum ? `${o.descontoNum}%` : (o.desconto || '');
    const preco      = o.precoPromo || '';
    const link       = o.linkAfiliado || o.link || '';
    const existente  = mapa[id];

    if (existente) {
      const row = ws.getRow(existente.rowNum);
      row.getCell(1).value = agora;
      row.getCell(2).value = pilarLabel;
      row.getCell(3).value = o.titulo;
      row.getCell(4).value = preco;
      row.getCell(5).value = desconto;
      row.getCell(6).value = link;
      row.getCell(7).value = 'Pendente';
      row.getCell(8).value = id;
      _estilizarLinha(row, 'Pendente');
      row.commit();
    } else {
      const row = ws.addRow([agora, pilarLabel, o.titulo, preco, desconto, link, 'Pendente', id]);
      _estilizarLinha(row, 'Pendente');
    }
  }

  await wb.xlsx.writeFile(ARQUIVO);
}

async function marcarComoEnviadas(prontas) {
  const wb     = await _carregarWb();
  const ws     = wb.getWorksheet('Histórico');
  const linhas = _lerLinhas(ws);
  const mapa   = Object.fromEntries(linhas.map(l => [l.id, l]));
  const agora  = new Date();

  for (const o of prontas) {
    const existente = mapa[String(o.id)];
    if (!existente) continue;
    const row = ws.getRow(existente.rowNum);
    row.getCell(1).value = agora;
    row.getCell(7).value = 'Enviado';
    _estilizarLinha(row, 'Enviado');
    row.commit();
  }

  await wb.xlsx.writeFile(ARQUIVO);
}

async function resetar() {
  const wb = new ExcelJS.Workbook();
  _criarPlanilha(wb);
  await wb.xlsx.writeFile(ARQUIVO);
}

async function estatisticas() {
  const wb     = await _carregarWb();
  const ws     = wb.getWorksheet('Histórico');
  const linhas = _lerLinhas(ws);
  if (linhas.length === 0) return 'histórico vazio';
  const pendentes = linhas.filter(l => l.status === 'Pendente').length;
  const enviados  = linhas.filter(l => l.status === 'Enviado').length;
  return `${enviados} enviada(s) | ${pendentes} pendente(s) na planilha`;
}

async function mostrarResumo() {
  const wb     = await _carregarWb();
  const ws     = wb.getWorksheet('Histórico');
  const linhas = _lerLinhas(ws);
  const hoje   = new Date().toLocaleDateString('pt-BR');
  const limite = _limite30();

  const enviados  = linhas.filter(l => l.status === 'Enviado');
  const pendentes = linhas.filter(l => l.status === 'Pendente');
  const ignorados = linhas.filter(l => l.status === 'Ignorado');

  const enviadosHoje = enviados.filter(l => {
    return l.data && l.data.toLocaleDateString('pt-BR') === hoje;
  });

  const ultimos30 = linhas.filter(l => l.data && l.data > limite);

  return [
    '',
    '📊 RESUMO DO HISTÓRICO',
    '─'.repeat(40),
    `📅 Enviados hoje:      ${enviadosHoje.length}`,
    `⏳ Pendentes:         ${pendentes.length}`,
    `🚫 Ignorados:         ${ignorados.length}`,
    `📦 Últimos 30 dias:   ${ultimos30.length}`,
    `📁 Total na planilha: ${linhas.length}`,
    '',
  ].join('\n');
}

module.exports = { filtrarNovos, adicionarPendentes, marcarComoEnviadas, resetar, estatisticas, mostrarResumo };
