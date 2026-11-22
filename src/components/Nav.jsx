import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import Logo from './Logo.jsx'
import Icon from './Icon.jsx'
import { useAuth } from '../lib/useAuth.jsx'

const LINKS = [
  { to: '/#como-funciona', label: 'Como funciona' },
  { to: '/#pecas', label: 'Peças' },
  { to: '/#sistemas', label: 'Sistemas' },
  { to: '/#projetos', label: 'Projetos' },
  { to: '/#contato', label: 'Contato' },
]

export default function Nav() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])

  return (
    <header className={`nav ${scrolled ? 'is-scrolled' : ''} ${open ? 'is-open' : ''}`}>
      <div className="wrap nav-row">
        <Link to="/" className="nav-logo" onClick={() => setOpen(false)}>
          <Logo height={30} />
        </Link>
        <nav className="nav-links" aria-label="Principal">
          {LINKS.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
        </nav>
        <Link to={user ? (user.isAdmin ? '/admin' : '/conta') : '/entrar'} className="nav-account" onClick={() => setOpen(false)}>
          {user ? (user.isAdmin ? 'Admin' : 'Minha conta') : 'Entrar'}
        </Link>
        <NavLink to="/construir" className="nav-build" onClick={() => setOpen(false)}>
          <span className="part-no">A1</span>
          Construa o seu site
          <Icon name="arrow" size={16} />
        </NavLink>
        <button className="nav-toggle" aria-label={open ? 'Fechar menu' : 'Abrir menu'} aria-expanded={open} onClick={() => setOpen(!open)}>
          <Icon name={open ? 'x' : 'menu'} size={22} />
        </button>
      </div>
    </header>
  )
}
