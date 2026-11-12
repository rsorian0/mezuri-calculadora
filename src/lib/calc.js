// Valores do estudo de custos (03/10/2026) e do plano definido.
export const DEFAULTS = {
  ux: 0,      // usuários extras além dos inclusos (projeção por plano)
  p: 179,     // mensalidade do plano
  inc: 4,     // usuários inclusos
  ex: 20,     // usuário extra (decidido em 12/11/2026)
  gbInc: 50,  // armazenamento incluso no plano (GB)
  gb: 0,      // GB extras contratados (projeção por plano)
  gbx: 0.036, // preço do GB extra (US$ por GB / mês)
  disc: 15,   // desconto do plano anual (%)
  dom: 3,     // domínio / mês
  srv: 42,    // servidor / mês
  mail: 112,  // e-mail / mês
  sto: 0.6,   // storage US$ / escritório / mês
  fx: 5.6,    // câmbio R$ por US$
  fee: 5,     // taxa de pagamento % (estimativa)
  iss: 2,     // ISS % (definido em 12/11/2026)
  pis: 0.65,  // PIS % (definido em 12/11/2026)
  cofins: 3,  // COFINS % (definido em 12/11/2026)
  coop: 0,    // % da cooperativa sobre a venda (a definir)
}

const brlFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const brl0Fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

export const brl = (v) => brlFmt.format(v)
export const brl0 = (v) => brl0Fmt.format(v)
export const pct = (x) => (Number.isFinite(x) ? (x * 100).toFixed(1).replace('.', ',') : '—') + '%'
export const fmtP = (v) => v.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + '%'
export const plural = (k, one, many) => `${k} ${k === 1 ? one : many}`

const pos = (v) => (Number.isFinite(v) && v >= 0 ? v : 0)

// Normaliza os parâmetros digitados (strings) em números válidos
export function normalize(raw) {
  const s = {}
  for (const k of Object.keys(DEFAULTS)) s[k] = pos(parseFloat(raw[k]))
  s.ux = Math.max(0, Math.round(s.ux))
  s.inc = Math.round(s.inc)
  s.users = s.inc + s.ux
  s.fix = s.dom + s.srv + s.mail
  s.gb = Math.round(s.gb)
  s.gbInc = Math.max(1, s.gbInc)
  s.stoBRL = s.sto * s.fx
  // custo do storage é por escritório para os GB inclusos; o GB extra segue a mesma proporção
  s.gbCost = s.stoBRL / s.gbInc
  s.gbPrice = Math.round(s.gbx * s.fx * 100) / 100 // em reais
  s.tax = s.iss + s.pis + s.cofins // impostos sobre a venda, em %
  s.rate = (s.fee + s.tax + s.coop) / 100
  return s
}

export const ticket = (users, s, gb = 0) => s.p + Math.max(0, users - s.inc) * s.ex + gb * s.gbPrice
export const storageCost = (s, gb = 0) => s.stoBRL + gb * s.gbCost

// Um escritório num plano, carregando sua fatia do custo fixo
const round2 = (v) => Math.round(v * 100) / 100

// annual = true aplica o desconto do plano anual sobre a mensalidade
export function plan(users, s, annual = false) {
  const gb = s.gb
  const list = ticket(users, s, gb)
  const price = annual ? round2(list * (1 - Math.min(s.disc, 100) / 100)) : list
  const sto = storageCost(s, gb)
  const fee = (price * s.fee) / 100
  const tax = (price * s.tax) / 100
  const coop = (price * s.coop) / 100
  const contrib = price - sto - fee - tax - coop
  const fixShare = s.fix // custo fixo integral, incluso no cálculo da base
  const pro = contrib - fixShare
  return {
    users,
    annual,
    list,
    discount: list - price,
    price,
    extras: Math.max(0, users - s.inc),
    gb,
    gbValue: gb * s.gbPrice,
    sto,
    fee,
    tax,
    coop,
    contrib,
    fixShare,
    cost: sto + fee + tax + coop + fixShare,
    pro,
    margin: price > 0 ? pro / price : NaN,
  }
}

