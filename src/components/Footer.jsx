import { Link } from 'react-router-dom'
import Logo from './Logo.jsx'
import Icon from './Icon.jsx'
import { WHATSAPP_NUMBER } from '../lib/scope.js'

export default function Footer() {
  return (
    <footer className="foot">
      <div className="wrap foot-grid">
        <div className="foot-brand">
          <Logo height={34} />
          <p>Sites e sistemas feitos à mão para negócios de Leme e região.</p>
        </div>
        <nav aria-label="Rodapé">
          <h4>Navegar</h4>
          <Link to="/#como-funciona">Como funciona</Link>
          <Link to="/#sistemas">Sistemas</Link>
          <Link to="/#projetos">Projetos</Link>
          <Link to="/construir">Construa o seu site</Link>
        </nav>
        <div>
          <h4>Contato</h4>
          <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener"><Icon name="whatsapp" size={16} /> (19) 99883-9704</a>
          <a href="mailto:primepagesleme@gmail.com"><Icon name="mail" size={16} /> primepagesleme@gmail.com</a>
          <a href="https://www.instagram.com/primepages_leme" target="_blank" rel="noopener"><Icon name="instagram" size={16} /> @primepages_leme</a>
        </div>
      </div>
      <div className="wrap foot-bottom">
        <span>© {new Date().getFullYear()} Prime Page</span>
        <span className="part-no">primepagesleme.com.br</span>
      </div>
    </footer>
  )
}
