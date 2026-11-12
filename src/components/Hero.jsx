import MezuriLogo from './icons/MezuriLogo.jsx'

export default function Hero({ logoRef }) {
  return (
    <header className="hero">
      <div className="container">
        <div className="brand">
          <MezuriLogo ref={logoRef} className="brand-logo" />
        </div>
        <span className="tag">Uso interno</span>
        <h1>Calculadora de preços e propostas</h1>
      </div>
    </header>
  )
}
