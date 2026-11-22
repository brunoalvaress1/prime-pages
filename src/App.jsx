import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Home from './pages/Home.jsx'
import { AuthProvider } from './lib/useAuth.jsx'

const Builder = lazy(() => import('./pages/Builder.jsx'))
const Login = lazy(() => import('./pages/Login.jsx'))
const Account = lazy(() => import('./pages/Account.jsx'))
const Admin = lazy(() => import('./pages/Admin.jsx'))

function ScrollTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) document.querySelector(hash)?.scrollIntoView()
    else window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}

export default function App() {
  return (
    <AuthProvider>
      <ScrollTop />
      <Suspense fallback={<div className="route-loading">Abrindo o kit…</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/construir" element={<Builder />} />
          <Route path="/entrar" element={<Login />} />
          <Route path="/conta" element={<Account />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  )
}
