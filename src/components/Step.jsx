// Cabeçalho numerado de cada etapa da calculadora
export default function Step({ n, title, sub, aside }) {
  return (
    <div className="step-head">
      <span className="step-n" aria-hidden="true">{n}</span>
      <div className="step-txt">
        <h2>{title}</h2>
        {sub && <p className="sub">{sub}</p>}
      </div>
      {aside && <div className="step-aside">{aside}</div>}
    </div>
  )
}
