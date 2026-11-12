import { NumberField } from './Fields.jsx'
import { brl, fmtP } from '../lib/calc.js'

const fmtSaved = (iso) => {
  try {
    return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

// Bloco recolhível com resumo do valor principal no cabeçalho
function Group({ title, summary, open, children }) {
  return (
    <details className="group" open={open}>
      <summary>
        <span className="group-title">{title}</span>
        <span className="group-sum">{summary}</span>
      </summary>
      <div className="group-body">{children}</div>
    </details>
  )
}

export default function Params({ raw, s, onChange, saveState, onSave, onDiscard, onReset }) {
  const { dirty, savedAt, isStudy, notice } = saveState
  const f = (id) => ({ id, value: raw[id], onChange })

  return (
    <aside className="card params" aria-label="Parâmetros">
      <div className="params-head">
        <h2>Parâmetros</h2>
        {savedAt && <p className="sub">{`Salvos em ${fmtSaved(savedAt)}.`}</p>}
      </div>

      <Group title="Plano" summary={`${brl(s.p)}/mês`} open>
        <NumberField {...f('p')} label="Mensalidade" prefix="R$" />
        <div className="row2">
          <NumberField {...f('inc')} label="Usuários inclusos" />
          <NumberField {...f('ex')} label="Usuário extra" prefix="R$" />
        </div>
        <div className="row2">
          <NumberField {...f('gbInc')} label="GB inclusos" suffix="GB" min={1} />
          <NumberField {...f('gbx')} label="GB extra" prefix="US$" step={0.001} />
        </div>
      </Group>

      <Group title="Custos fixos" summary={`${brl(s.fix)}/mês`}>
        <div className="row2">
          <NumberField {...f('dom')} label="Domínio" prefix="R$" step={0.01} />
          <NumberField {...f('srv')} label="Servidor" prefix="R$" step={0.01} />
        </div>
        <div className="row2">
          <NumberField {...f('mail')} label="E-mail" prefix="R$" step={0.01} />
          <NumberField {...f('share')} label="Clientes ativos" suffix="cli." min={1} />
        </div>
      </Group>

      <Group title="Custos variáveis" summary="Storage e taxas">
        <div className="row2">
          <NumberField {...f('sto')} label="Storage" prefix="US$" step={0.01} />
          <NumberField {...f('fx')} label="Câmbio" prefix="R$" step={0.01} />
        </div>
        <div className="row2">
          <NumberField {...f('feeC30')} label="Cartão · 30 dias" suffix="%" step={0.01} />
          <NumberField {...f('feeC14')} label="Cartão · 14 dias" suffix="%" step={0.01} />
        </div>
        <div className="row2">
          <NumberField {...f('feeC0')} label="Cartão · na hora" suffix="%" step={0.01} />
          <NumberField {...f('feeC12')} label="Cartão · 12x (anual)" suffix="%" step={0.01} />
        </div>
        <div className="row2">
          <NumberField {...f('feePix')} label="Pix" suffix="%" step={0.01} />
          <NumberField {...f('feeBol')} label="Boleto" prefix="R$" step={0.01} />
        </div>
      </Group>

      <Group title="Impostos sobre a venda" summary={fmtP(s.tax)}>
        <div className="row3">
          <NumberField {...f('iss')} label="ISS" suffix="%" step={0.01} />
          <NumberField {...f('pis')} label="PIS" suffix="%" step={0.01} />
          <NumberField {...f('cofins')} label="COFINS" suffix="%" step={0.01} />
        </div>
      </Group>

      <Group title="Cooperativa" summary={fmtP(s.coop)}>
        <NumberField {...f('coop')} label="Percentual da cooperativa" suffix="%" step={0.01} />
      </Group>

      <div className="save-bar">
        <div className={'save-status' + (dirty ? ' dirty' : '')} role="status">
          {notice ? <span className={notice.err ? 'err' : 'ok'}>{notice.text}</span>
            : dirty ? 'Alterações não salvas'
            : savedAt ? 'Tudo salvo'
            : ''}
        </div>
        <div className="actions">
          <button className="btn btn-primary" type="button" onClick={onSave} disabled={!dirty}>Salvar parâmetros</button>
          {dirty && savedAt && <button className="btn" type="button" onClick={onDiscard}>Desfazer</button>}
          {!isStudy || savedAt ? <button className="btn btn-ghost" type="button" onClick={onReset}>Restaurar padrão</button> : null}
        </div>
      </div>
    </aside>
  )
}
