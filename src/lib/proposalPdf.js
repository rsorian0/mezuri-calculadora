import { brl, plan } from './calc.js'

const NAVY = '#1a2035'

// Converte um <svg> da página em PNG na cor pedida, cortando as bordas transparentes
export function svgToPng(svgEl, color) {
  return new Promise((resolve, reject) => {
    const clone = svgEl.cloneNode(true)
    clone.setAttribute('fill', color)
    clone.removeAttribute('class')
    const vb = clone.getAttribute('viewBox').split(/[\s,]+/).map(Number)
    const W = 1600
    const H = Math.round((W * vb[3]) / vb[2])
    clone.setAttribute('width', W)
    clone.setAttribute('height', H)
    const str = new XMLSerializer().serializeToString(clone).replace(/currentColor/g, color)
    const img = new Image()
    img.onload = () => {
      const c = document.createElement('canvas')
      c.width = W
      c.height = H
      const g = c.getContext('2d')
      g.drawImage(img, 0, 0, W, H)
      const d = g.getImageData(0, 0, W, H).data
      let x0 = W, y0 = H, x1 = -1, y1 = -1
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          if (d[(y * W + x) * 4 + 3] > 8) {
            if (x < x0) x0 = x
            if (x > x1) x1 = x
            if (y < y0) y0 = y
            if (y > y1) y1 = y
          }
        }
      }
      if (x1 < 0) return reject(new Error('svg vazio'))
      const w = x1 - x0 + 1
      const h = y1 - y0 + 1
      const o = document.createElement('canvas')
      o.width = w
      o.height = h
      o.getContext('2d').drawImage(c, x0, y0, w, h, 0, 0, w, h)
      resolve({ url: o.toDataURL('image/png'), ratio: w / h })
    }
    img.onerror = reject
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(str)
  })
}

const fmtDate = (d) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
const clean = (v) => String(v || '').replace(/−/g, '-').trim()

const label = (doc, text, x, y) => {
  doc.setTextColor('#64748b')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text(text, x, y, { charSpace: 0.6 })
}

const C = {
  navy: '#1a2035',
  fg: '#0f172a',
  fg2: '#334155',
  muted: '#64748b',
  light: '#94a3b8',
  border: '#e2e8f0',
  soft: '#f8fafc',
  onNavy: '#cbd5e1',
  pos: '#166534',
  posBg: '#dcfce7',
}

const pad2 = (n) => String(n).padStart(2, '0')
const proposalNumber = (d) => `MZ-${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}-${pad2(d.getHours())}${pad2(d.getMinutes())}`

/**
 * Monta o PDF da proposta. Mostra só preço e condições ao cliente (sem custos nem margem).
 * @param s       parâmetros normalizados (calc.normalize)
 * @param client  { nome, empresa, telefone, email, vendedor, validade, pagamento, obs, modalidade }
 * @param logos   { mezuri: SVGElement, kunlatek: SVGElement }
 */
export async function buildProposalPdf(s, client, logos) {
  const r = plan(s.users, s)
  const rA = plan(s.users, s, true)
  const c = Object.fromEntries(Object.entries(client).map(([k, v]) => [k, clean(v)]))
  const mode = ['mensal', 'anual', 'anual12'].includes(client.modalidade) ? client.modalidade : 'ambos'
  // validade é opcional: sem ela, o PDF não mostra data de validade
  const diasNum = Math.round(parseFloat(client.validade))
  const dias = Number.isFinite(diasNum) && diasNum > 0 ? diasNum : null
  const hoje = new Date()
  const ate = dias ? new Date(hoje.getTime() + dias * 864e5) : null
  const numero = proposalNumber(hoje)
  const usersTxt = `${r.users} ${r.users === 1 ? 'usuário' : 'usuários'}`
  const gbTotal = s.gbInc + r.gb
  const discTxt = s.disc.toLocaleString('pt-BR') + '%'
  const saving = (r.price - rA.price) * 12

  const logoW = await svgToPng(logos.mezuri, '#ffffff')
  const logoM = await svgToPng(logos.mezuri, C.fg) // marca do mezuri em cor escura, para o rodapé

  // jsPDF só carrega quando alguém gera uma proposta
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const PW = 210
  const PH = 297
  const M = 18
  const W = PW - 2 * M
  const LIMIT = PH - 25
  let y = 0

  const font = (style, size, color) => {
    doc.setFont('helvetica', style)
    doc.setFontSize(size)
    doc.setTextColor(color)
  }
  const newPage = () => {
    doc.addPage()
    // faixa fina de continuação
    doc.setFillColor(C.navy)
    doc.rect(0, 0, PW, 4, 'F')
    y = 18
  }
  const ensure = (h) => { if (y + h > LIMIT) newPage() }
  // jsPDF não alinha à direita texto com charSpace: calcula a largura manualmente
  const rightSpaced = (text, xRight, yy, cs) => {
    const w = doc.getTextWidth(text) + cs * (text.length - 1)
    doc.text(text, xRight - w, yy, { charSpace: cs })
  }
  const section = (title) => {
    ensure(14)
    label(doc, title, M, y)
    y += 5
  }

  // ===== Topo =====
  doc.setFillColor(C.navy)
  doc.rect(0, 0, PW, 35, 'F')
  const lh = 15
  doc.addImage(logoW.url, 'PNG', M, 10, lh * logoW.ratio, lh)
  font('bold', 8, C.onNavy)
  rightSpaced('PROPOSTA COMERCIAL', PW - M, 12, 0.6)
  font('bold', 12, '#ffffff')
  doc.text(numero, PW - M, 18.5, { align: 'right' })
  font('normal', 9, C.onNavy)
  doc.text('Emitida em ' + fmtDate(hoje), PW - M, 24.5, { align: 'right' })
  if (ate) doc.text('Válida até ' + fmtDate(ate), PW - M, 29.5, { align: 'right' })

  // ===== Cliente =====
  y = 43
  // dados do cliente são opcionais: só aparece o que foi preenchido
  const titulo = c.empresa || c.nome
  const sub1 = c.empresa ? c.nome : ''
  const contatos = [c.telefone, c.email].filter(Boolean)
  if (titulo || contatos.length) {
    const cardH = 26
    doc.setFillColor(C.soft)
    doc.setDrawColor(C.border)
    doc.setLineWidth(0.3)
    doc.roundedRect(M, y, W, cardH, 2, 2, 'FD')
    const colR = M + W * 0.6
    if (titulo) {
      label(doc, 'PREPARADA PARA', M + 6, y + 7.5)
      font('bold', 14, C.fg)
      doc.text(doc.splitTextToSize(titulo, (contatos.length ? colR - M - 12 : W - 12))[0], M + 6, y + 15)
      if (sub1) {
        font('normal', 10, C.fg2)
        doc.text(sub1, M + 6, y + 21)
      }
    }
    if (contatos.length) {
      label(doc, 'CONTATO', titulo ? colR : M + 6, y + 7.5)
      font('normal', 9.5, C.fg2)
      contatos.forEach((v, k) => doc.text(doc.splitTextToSize(v, PW - M - colR - 5)[0], titulo ? colR : M + 6, y + 15 + k * 6))
    }
    y += cardH + 6
  }

  // ===== Introdução =====
  font('normal', 10.5, C.fg2)
  const intro = doc.splitTextToSize(
    'O mezuri centraliza projetos, tarefas, prazos e o histórico de responsabilidades e entregas do escritório, com acesso por perfil para cada integrante.',
    W
  )
  doc.text(intro, M, y)
  y += intro.length * 5 + 5

  // ===== Composição do plano =====
  section('COMPOSIÇÃO DO PLANO')
  const rows = [['Plano mezuri', `Até ${s.inc} usuários e ${s.gbInc} GB de armazenamento`, brl(s.p)]]
  if (r.extras > 0) rows.push(['Usuários adicionais', `${r.extras} × ${brl(s.ex)} por usuário`, brl(r.extras * s.ex)])
  if (r.gb > 0) rows.push(['Armazenamento adicional', `${r.gb} GB × ${brl(s.gbPrice)} por GB`, brl(r.gbValue)])
  // cabeçalho da tabela
  doc.setFillColor(C.soft)
  doc.rect(M, y, W, 7, 'F')
  font('bold', 7.5, C.muted)
  doc.text('ITEM', M + 3, y + 4.7, { charSpace: 0.4 })
  rightSpaced('VALOR MENSAL', PW - M - 3, y + 4.7, 0.4)
  y += 7
  for (const [t, d, v] of rows) {
    ensure(13)
    font('bold', 10.5, C.fg)
    doc.text(t, M + 3, y + 6)
    doc.text(v, PW - M - 3, y + 6, { align: 'right' })
    font('normal', 8.8, C.muted)
    doc.text(d, M + 3, y + 10.5)
    y += 12.5
    doc.setDrawColor(C.border)
    doc.line(M, y, PW - M, y)
  }
  ensure(9)
  font('bold', 10.5, C.fg)
  doc.text(`Total mensal · ${usersTxt}, ${gbTotal} GB`, M + 3, y + 6.5)
  doc.text(brl(r.price), PW - M - 3, y + 6.5, { align: 'right' })
  y += 17

  // ===== Formas de contratação =====
  section(mode === 'ambos' ? 'FORMAS DE CONTRATAÇÃO' : 'INVESTIMENTO')
  const BOX = 33
  ensure(BOX + 4)
  const drawBox = (x, w, dark, tag, price, l1, l2, badge) => {
    if (dark) {
      doc.setFillColor(C.navy)
      doc.roundedRect(x, y, w, BOX, 2.5, 2.5, 'F')
    } else {
      doc.setDrawColor('#cbd5e1')
      doc.setLineWidth(0.4)
      doc.roundedRect(x, y, w, BOX, 2.5, 2.5, 'S')
    }
    font('bold', 8, dark ? C.onNavy : C.muted)
    doc.text(tag, x + 6, y + 8, { charSpace: 0.6 })
    if (badge) {
      font('bold', 7.5, C.pos)
      const bw = doc.getTextWidth(badge) + 5
      doc.setFillColor(C.posBg)
      doc.roundedRect(x + w - 6 - bw, y + 4.3, bw, 5.4, 2.7, 2.7, 'F')
      doc.text(badge, x + w - 6 - bw / 2, y + 8, { align: 'center' })
    }
    font('bold', 19, dark ? '#ffffff' : C.fg)
    doc.text(price, x + 6, y + 19)
    const pw = doc.getTextWidth(price)
    font('normal', 9.5, dark ? C.onNavy : C.muted)
    doc.text('/mês', x + 7.5 + pw, y + 19)
    font('normal', 8.5, dark ? C.onNavy : C.muted)
    doc.text(l1, x + 6, y + 25.5)
    if (l2) doc.text(l2, x + 6, y + 29.5)
  }
  const mL1 = `${brl(r.price * 12)} em 12 meses`
  const aL1 = mode === 'anual12' ? `Em até 12x sem juros no cartão · ${brl(rA.price * 12)} no ano` : `Contrato de 12 meses · ${brl(rA.price * 12)} no ano`
  const aL2 = `Economia de ${brl(saving)} em relação ao mensal`
  if (mode === 'mensal') {
    drawBox(M, W, true, 'PLANO MENSAL', brl(r.price), mL1, `Equivale a ${brl(r.price / r.users)} por usuário ao mês`)
  } else if (mode === 'anual' || mode === 'anual12') {
    drawBox(M, W, true, mode === 'anual12' ? 'PLANO ANUAL PARCELADO EM 12X' : 'PLANO ANUAL', brl(rA.price), aL1, aL2, `${discTxt} de desconto`)
  } else {
    const gap = 5
    const half = (W - gap) / 2
    drawBox(M, half, false, 'PLANO MENSAL', brl(r.price), mL1, `${brl(r.price / r.users)} por usuário ao mês`)
    drawBox(M + half + gap, half, true, 'PLANO ANUAL', brl(rA.price), aL1, aL2, `${discTxt} OFF`)
  }
  y += BOX + 7

  // ===== Incluso + próximos passos (duas colunas) =====
  const incluso = [
    'Gestão de projetos, tarefas, prazos e responsáveis',
    'Histórico de quem fez o quê em cada projeto',
    `Armazenamento de arquivos (${gbTotal} GB)`,
    'Acesso por perfil para cada integrante',
  ]
  const passos = ['Aprovação da proposta', 'Criação do ambiente do escritório', 'Diagnóstico gratuito e início do uso']
  const colW = (W - 8) / 2
  const blockH = 8 + incluso.length * 6
  ensure(blockH)
  const top = y
  label(doc, 'O QUE ESTÁ INCLUSO', M, y)
  let yl = y + 6.5
  for (const b of incluso) {
    // ícone de check
    doc.setDrawColor(C.pos)
    doc.setLineWidth(0.6)
    doc.line(M + 0.3, yl - 1.3, M + 1.3, yl - 0.3)
    doc.line(M + 1.3, yl - 0.3, M + 3.1, yl - 2.6)
    font('normal', 9.5, C.fg)
    doc.text(b, M + 5.5, yl)
    yl += 6
  }
  const xr = M + colW + 8
  label(doc, 'PRÓXIMOS PASSOS', xr, top)
  let yr = top + 6.5
  passos.forEach((p, i) => {
    doc.setFillColor(C.navy)
    doc.circle(xr + 1.9, yr - 1.25, 2.1, 'F')
    font('bold', 7, '#ffffff')
    doc.text(String(i + 1), xr + 1.9, yr - 0.2, { align: 'center' })
    font('normal', 9.5, C.fg)
    doc.text(p, xr + 6, yr)
    yr += 7.5
  })
  y = Math.max(yl, yr) + 3

  // ===== Condições =====
  const cond = []
  cond.push(['Pagamento', s.payM.client])
  if (ate) cond.push(['Validade', `${dias} dias, até ${fmtDate(ate)}`])
  // adicionais já aparecem itemizados na composição; sem extras, informa o valor para ampliações
  if (r.extras === 0 || r.gb === 0) cond.push(['Adicionais', `Usuário extra a ${brl(s.ex)}/mês e armazenamento adicional a ${brl(s.gbPrice)} por GB/mês.`])
  if (c.obs) cond.push(['Observações', c.obs])
  section('CONDIÇÕES')
  doc.setDrawColor(C.border)
  doc.setLineWidth(0.3)
  for (const [k, v] of cond) {
    font('normal', 9.5, C.fg2)
    const lines = doc.splitTextToSize(v, W - 36)
    const h = Math.max(1, lines.length) * 4.6 + 3
    ensure(h)
    font('bold', 9.5, C.fg)
    doc.text(k, M, y + 4)
    font('normal', 9.5, C.fg2)
    doc.text(lines, M + 34, y + 4)
    y += h
    doc.line(M, y, PW - M, y)
    y += 1
  }

  // ===== Rodapé em todas as páginas =====
  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    const fy = PH - 20
    doc.setDrawColor(C.border)
    doc.setLineWidth(0.3)
    doc.line(M, fy, PW - M, fy)
    const mh = 8
    doc.addImage(logoM.url, 'PNG', M, fy + 2.5, mh * logoM.ratio, mh)
    if (c.vendedor) {
      font('normal', 8, C.muted)
      doc.text(c.vendedor, M + mh * logoM.ratio + 4, fy + 8)
    }
    font('normal', 7, C.light)
    doc.text(`Kunlatek Tecnologia LTDA · CNPJ 36.899.179/0001-08 · ${numero}` + (pages > 1 ? ` · ${i}/${pages}` : ''), M, fy + 14)
  }

  const safe = (c.empresa || c.nome || 'cliente').replace(/[\\/:*?"<>|]/g, '')
  return { doc, name: `Proposta mezuri - ${safe}.pdf` }
}

// Baixa o PDF: dentro do claude.ai usa o recurso de downloads; fora dele, download normal do navegador
export async function savePdf({ doc, name }) {
  const dl = window.claude && window.claude.use ? await window.claude.use('downloads') : null
  if (!dl) {
    doc.save(name)
    return 'saved'
  }
  await dl.save({ filename: name, data: doc.output('blob') })
  return 'saved'
}
