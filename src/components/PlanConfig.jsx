import { brl, plural } from '../lib/calc.js'
import Step from './Step.jsx'

function Stepper({ id, label, value, onChange, step = 1, min = 0, unit, hint }) {
  const n = Math.max(min, Math.round(parseFloat(value) || 0))
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="stepper">
        <button type="button" aria-label={`Diminuir ${label.toLowerCase()}`} onClick={() => onChange(id, Math.max(min, n - step))} disabled={n <= min}>−</button>
        <div className="input-wrap has-suf">
          <input type="number" id={id} inputMode="numeric" min={min} step={step} value={value} onChange={(e) => onChange(id, e.target.value)} />
          {unit && <span className="suf">{unit}</span>}
        </div>
        <button type="button" aria-label={`Aumentar ${label.toLowerCase()}`} onClick={() => onChange(id, n + step)}>+</button>
      </div>
      {hint && <p className="hint">{hint}</p>}
    </div>
  )
}

export default function PlanConfig({ raw, s, r, onChange }) {
  return (
    <div className="card">
      <Step n={1} title="Plano do escritório" />
      <div className="plan-grid">
        <div className="plan-inputs">
          <Stepper id="ux" label="Usuários extras" value={raw.ux} onChange={onChange} hint={`${s.inc} usuários inclusos · extra a ${brl(s.ex)}/mês`} />
          <Stepper id="gb" label="Armazenamento extra" value={raw.gb} onChange={onChange} step={10} unit="GB" hint={`${s.gbInc} GB inclusos · extra a ${brl(s.gbPrice)}/GB`} />
        </div>
        <div className="price-card" aria-live="polite">
          <span className="price-label">Mensalidade</span>
          <div className="price-big">{brl(r.price)}<small>/mês</small></div>
          <ul className="price-parts">
            <li><span>Plano base · {s.inc} usuários, {s.gbInc} GB</span><span>{brl(s.p)}</span></li>
            {r.extras > 0 && <li><span>{plural(r.extras, 'usuário extra', 'usuários extras')}</span><span>{brl(r.extras * s.ex)}</span></li>}
            {r.gb > 0 && <li><span>{r.gb} GB extras</span><span>{brl(r.gbValue)}</span></li>}
          </ul>
          <span className="price-foot">{brl(r.price / r.users)} por usuário · {s.gbInc + r.gb} GB no total</span>
        </div>
      </div>
    </div>
  )
}
