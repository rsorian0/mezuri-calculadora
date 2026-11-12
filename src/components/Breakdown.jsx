import { pct } from '../lib/calc.js'

// Barra empilhada de para onde vai a receita
export function RevenueBar({ fix, varc, fees, pro, total, fixLabel = 'Custo fixo' }) {
  const t = total || 1
  const w = (v) => `${(Math.max(0, v) / t) * 100}%`
  return (
    <>
      <div className="bar" aria-hidden="true">
        <span style={{ width: w(fix), background: 'var(--c-fix)' }} />
        <span style={{ width: w(varc), background: 'var(--c-var)' }} />
        <span style={{ width: w(fees), background: 'var(--c-fee)' }} />
        <span style={{ width: w(pro), background: 'var(--c-pro)' }} />
      </div>
      <div className="legend">
        <span><i style={{ background: 'var(--c-fix)' }} />{fixLabel}</span>
        <span><i style={{ background: 'var(--c-var)' }} />Storage</span>
        <span><i style={{ background: 'var(--c-fee)' }} />Taxas e impostos</span>
        <span><i style={{ background: 'var(--c-pro)' }} />Lucro</span>
      </div>
    </>
  )
}

export function Line({ label, value, minus, className = '' }) {
  return (
    <div className={'line ' + className}>
      <span className="l">{label}</span>
      <span className={minus ? 'minus' : undefined}>{minus ? '− ' : ''}{value}</span>
    </div>
  )
}

export function MarginPill({ value, positive }) {
  return <span className={'pill ' + (positive ? 'pos' : 'neg')}>{pct(value)}</span>
}

export function Kpi({ k, v, d, highlight }) {
  return (
    <div className={'kpi' + (highlight ? ' hl' : '')}>
      <div className="k">{k}</div>
      <div className="v">{v}</div>
      {d && <div className="d">{d}</div>}
    </div>
  )
}
