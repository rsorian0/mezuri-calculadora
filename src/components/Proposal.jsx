import { useRef, useState } from 'react'
import { brl, plural } from '../lib/calc.js'
import { buildProposalPdf, savePdf } from '../lib/proposalPdf.js'
import { TextField } from './Fields.jsx'
import Step from './Step.jsx'

const EMPTY = {
  nome: '',
  empresa: '',
  telefone: '',
  email: '',
  vendedor: '',
  validade: '',
  pagamento: '',
  obs: '',
  modalidade: 'ambos',
}

const MODALIDADES = [
  { id: 'ambos', label: 'Mensal e anual' },
  { id: 'mensal', label: 'Apenas mensal' },
  { id: 'anual', label: 'Apenas anual' },
]

// (82) 99999-9999 / (82) 3333-3333
function maskPhone(v) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d ? `(${d}` : ''
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

function validate(c) {
  const e = {}
  if (!c.nome.trim()) e.nome = 'Nome do contato obrigatório.'
  if (!c.empresa.trim()) e.empresa = 'Nome da empresa obrigatório.'
  const digits = c.telefone.replace(/\D/g, '')
  if (digits.length < 10) e.telefone = 'Telefone com DDD (10 ou 11 dígitos).'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c.email.trim())) e.email = 'E-mail inválido.'
  return e
}

export default function Proposal({ s, rM, rA, discValue, onDisc, logos }) {
  const r = rM
  const [c, setC] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const timer = useRef()

  const toast = (text, err, keep) => {
    setMsg({ text, err })
    clearTimeout(timer.current)
    if (!keep) timer.current = setTimeout(() => setMsg(null), 4000)
  }

  const change = (id, value) => {
    const v = id === 'telefone' ? maskPhone(value) : value
    setC((prev) => ({ ...prev, [id]: v }))
    if (errors[id]) setErrors((prev) => ({ ...prev, [id]: undefined }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    const errs = validate(c)
    setErrors(errs)
    const first = ['nome', 'empresa', 'telefone', 'email'].find((k) => errs[k])
    if (first) {
      document.getElementById(first)?.focus()
      toast('Dados do cliente obrigatórios para gerar o PDF.', true)
      return
    }
    setBusy(true)
    toast('Gerando PDF...', false, true)
    try {
      const out = await buildProposalPdf(s, c, { mezuri: logos.mezuri.current, kunlatek: logos.kunlatek.current })
      await savePdf(out)
      toast('PDF gerado.')
    } catch (err) {
      const code = err && err.code
      if (code === 'declined') toast('Download cancelado.')
      else if (code === 'rate_limited') toast('Download em andamento. Nova tentativa disponível em instantes.', true)
      else toast('Não foi possível gerar o PDF.', true)
    } finally {
      setBusy(false)
    }
  }


  const f = (id) => ({ id, value: c[id], onChange: change, error: errors[id] })

  return (
    <div className="card" id="proposta">
      <Step n={3} title="Proposta para o cliente" />
      <form className="prop-grid" onSubmit={onSubmit} noValidate>
        <div className="section-label first full">Cliente</div>
        <TextField {...f('nome')} label="Nome do contato" placeholder="Nome e sobrenome" required autoComplete="name" />
        <TextField {...f('empresa')} label="Empresa" placeholder="Razão social ou nome do escritório" required autoComplete="organization" />
        <TextField {...f('telefone')} label="Telefone" type="tel" placeholder="(00) 00000-0000" required autoComplete="tel" inputMode="tel" />
        <TextField {...f('email')} label="E-mail" type="email" placeholder="nome@empresa.com.br" required autoComplete="email" inputMode="email" />

        <div className="section-label full">Condições</div>
        <div className="field full">
          <span className="field-label" id="mod-label">Modalidades apresentadas</span>
          <div className="choice" role="radiogroup" aria-labelledby="mod-label">
            {MODALIDADES.map((m) => (
              <label key={m.id}>
                <input type="radio" name="modalidade" value={m.id} checked={c.modalidade === m.id} onChange={() => change('modalidade', m.id)} />
                {m.label}
              </label>
            ))}
          </div>
        </div>
        {c.modalidade !== 'mensal' && (
          <div className="field full annual-box">
            <div className="annual-row">
              <label htmlFor="disc">Desconto no plano anual</label>
              <div className="input-wrap has-suf">
                <input
                  type="number"
                  id="disc"
                  inputMode="decimal"
                  min="0"
                  max="100"
                  step="1"
                  value={discValue}
                  onChange={(e) => onDisc(e.target.value)}
                />
                <span className="suf">%</span>
              </div>
            </div>
            <p className="hint">
              Anual a {brl(rA.price)}/mês em vez de {brl(rM.price)}: {brl(rA.price * 12)} no ano, economia de {brl((rM.price - rA.price) * 12)} para o cliente.
            </p>
          </div>
        )}
        <TextField {...f('vendedor')} label="Responsável pelo envio" placeholder="Nome e cargo" />
        <TextField {...f('validade')} label="Validade" small="dias" type="number" inputMode="numeric" placeholder="15" />
        <TextField {...f('pagamento')} label="Pagamento" full placeholder="Ex.: Cartão de crédito, Pix ou boleto" />
        <div className="field full">
          <label htmlFor="obs">Observações <small>opcional</small></label>
          <textarea id="obs" value={c.obs} placeholder="Ex.: Data prevista para início do uso" onChange={(e) => change('obs', e.target.value)} />
        </div>

        <div className="full prop-foot">
          <div className="prop-sum">
            <span className="prop-sum-l">Plano de {plural(r.users, 'usuário', 'usuários')} · {s.gbInc + r.gb} GB</span>
            <div className="opts">
              {c.modalidade !== 'anual' && <div><span>Mensal</span><strong>{brl(rM.price)}</strong></div>}
              {c.modalidade !== 'mensal' && <div><span>Anual · −{s.disc.toLocaleString('pt-BR')}%</span><strong>{brl(rA.price)}</strong></div>}
            </div>
          </div>
          <button className="btn btn-primary btn-lg" type="submit" disabled={busy}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></svg>
            {busy ? 'Gerando PDF...' : 'Gerar PDF da proposta'}
          </button>
        </div>
      </form>
      <div className={'toast' + (msg?.err ? ' err' : '')} role="status">{msg?.text}</div>
    </div>
  )
}
