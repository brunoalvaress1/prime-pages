import { useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Logo from '../components/Logo.jsx'
import AuthForm from '../components/AuthForm.jsx'
import { useAuth } from '../lib/useAuth.jsx'
import '../styles/account.css'

export default function Login() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const { user, ready } = useAuth()
  const next = params.get('next')

  useEffect(() => {
    document.title = 'Entrar | Prime Page'
  }, [])
  useEffect(() => {
    if (ready && user) nav(next || (user.isAdmin ? '/admin' : '/conta'), { replace: true })
  }, [ready, user, next, nav])

  return (
    <div className="auth-page">
      <div className="auth-side">
        <Link to="/"><Logo height={30} /></Link>
        <h1>Seus projetos,<br />num lugar só.</h1>
        <p>Entre para continuar montando, acompanhar seus pedidos de orçamento e editar seus dados.</p>
      </div>
      <div className="auth-main">
        <AuthForm initial={params.get('modo') || 'login'} />
      </div>
    </div>
  )
}
