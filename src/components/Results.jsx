import { brl, brl0, pct, plural, fmtP } from '../lib/calc.js'
import { Kpi, Line, MarginPill, RevenueBar } from './Breakdown.jsx'
import Step from './Step.jsx'

export default function Results({ s, r }) {
  const fees = r.fee + r.tax + r.coop
  return (
    <div className="card">
      <Step
        n={2}
        title="Resultado por escritório"
        aside={<MarginPill value={r.margin} positive={r.pro >= 0} />}
      />
      <div className="kpis">
        <Kpi k="Receita" v={brl(r.price)} d="por mês" />
        <Kpi k="Custos" v={brl(r.cost)} d={`${brl(r.fixShare)} de custo fixo`} />
        <Kpi k="Lucro" v={brl(r.pro)} d="por mês" highlight />
        <Kpi k="Lucro em 12 meses" v={brl0(r.pro * 12)} d={`receita de ${brl0(r.price * 12)}`} />
      </div>
      <RevenueBar fix={r.fixShare} varc={r.sto} fees={fees} pro={r.pro} total={Math.max(r.price, r.cost)} fixLabel="Custo fixo" />
      <details className="details">
        <summary>Detalhamento do cálculo</summary>
        <div className="details-body">
          <Line label={`Plano base (até ${s.inc} usuários, ${s.gbInc} GB)`} value={brl(s.p)} />
          {r.extras > 0 && <Line label={`Usuários extras (${r.extras} × ${brl(s.ex)})`} value={brl(r.extras * s.ex)} />}
          {r.gb > 0 && <Line label={`Armazenamento extra (${r.gb} GB × ${brl(s.gbPrice)})`} value={brl(r.gbValue)} />}
          <Line label={`Storage (${s.gbInc + r.gb} GB)`} value={brl(r.sto)} minus />
          <Line label={`Taxa de pagamento (${fmtP(s.fee)})`} value={brl(r.fee)} minus />
          <Line label={`Impostos (ISS ${fmtP(s.iss)} + PIS ${fmtP(s.pis)} + COFINS ${fmtP(s.cofins)})`} value={brl(r.tax)} minus />
          {s.coop > 0 && <Line label={`Cooperativa (${fmtP(s.coop)})`} value={brl(r.coop)} minus />}
          <Line label="Contribuição (antes do custo fixo)" value={brl(r.contrib)} className="sep" />
          <Line label="Custo fixo (domínio + servidor + e-mail)" value={brl(r.fixShare)} minus />
          <div className="line total">
            <span className="l">Lucro do escritório</span>
            <span>{brl(r.pro)} · {pct(r.margin)}</span>
          </div>
        </div>
      </details>
    </div>
  )
}
