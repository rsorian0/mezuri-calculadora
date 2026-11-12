import KunlatekLogo from './icons/KunlatekLogo.jsx'

export default function Footer({ logoRef }) {
  return (
    <footer className="footer">
      <a className="kl" href="https://kunlatek.com.br/" target="_blank" rel="noopener">
        <span>Um produto</span>
        <KunlatekLogo ref={logoRef} className="kl-logo" />
      </a>
    </footer>
  )
}
