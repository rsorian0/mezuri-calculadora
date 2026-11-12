import { useMemo, useRef, useState } from 'react'
import Hero from './components/Hero.jsx'
import Params from './components/Params.jsx'
import PlanConfig from './components/PlanConfig.jsx'
import Results from './components/Results.jsx'
import Proposal from './components/Proposal.jsx'
import Footer from './components/Footer.jsx'
import { DEFAULTS, normalize, plan } from './lib/calc.js'
import { SAVED_KEYS, clearSaved, loadSaved, save } from './lib/storage.js'

const defaults = () => Object.fromEntries(Object.entries(DEFAULTS).map(([k, v]) => [k, String(v)]))
const pickSaved = (raw) => Object.fromEntries(SAVED_KEYS.map((k) => [k, String(raw[k])]))
const same = (a, b) => SAVED_KEYS.every((k) => parseFloat(a[k]) === parseFloat(b[k]))

export default function App() {
  const [saved, setSaved] = useState(loadSaved)
  const [raw, setRaw] = useState(() => ({ ...defaults(), ...(saved?.params || {}) }))
  const [notice, setNotice] = useState(null)
  const s = useMemo(() => normalize(raw), [raw])
  const rM = plan(s.users, s, false)
  const rA = plan(s.users, s, true)
  const mezuriLogo = useRef(null)
  const kunlatekLogo = useRef(null)

  const baseline = saved ? { ...pickSaved(defaults()), ...saved.params } : pickSaved(defaults())
  const dirty = !same(raw, baseline)
  const isStudy = same(raw, pickSaved(defaults()))

  const flash = (text, err) => {
    setNotice({ text, err })
    setTimeout(() => setNotice(null), 3500)
  }

  const change = (id, value) => setRaw((prev) => ({ ...prev, [id]: String(value) }))

  const onSave = () => {
    try {
      setSaved(save(raw))
      flash('Parâmetros salvos neste navegador.')
    } catch {
      flash('Não foi possível salvar neste navegador.', true)
    }
  }
  const onDiscard = () => setRaw((prev) => ({ ...prev, ...baseline }))
  const onReset = () => {
    clearSaved()
    setSaved(null)
    setRaw((prev) => ({ ...prev, ...pickSaved(defaults()) }))
    flash('Valores padrão restaurados.')
  }

  return (
    <>
      <a href="#conteudo" className="skip-link">Pular para o conteúdo</a>
      <Hero logoRef={mezuriLogo} />
      <main className="main" id="conteudo">
        <div className="container">
          <div className="grid">
            <div className="flow">
              <PlanConfig raw={raw} s={s} r={rM} onChange={change} />
              <Results s={s} r={s.payM.annualOnly ? rA : rM} />
              <Proposal s={s} rM={rM} rA={rA} discValue={raw.disc} onDisc={(v) => change('disc', v)} onPay={(v) => change('pay', v)} logos={{ mezuri: mezuriLogo, kunlatek: kunlatekLogo }} />
            </div>
            <Params
              raw={raw}
              s={s}
              onChange={change}
              saveState={{ dirty, savedAt: saved?.savedAt, isStudy, notice }}
              onSave={onSave}
              onDiscard={onDiscard}
              onReset={onReset}
            />
          </div>
        </div>
      </main>
      <Footer logoRef={kunlatekLogo} />
    </>
  )
}
