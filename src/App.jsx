import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Home from './pages/Home.jsx'

const Builder = lazy(() => import('./pages/Builder.jsx'))

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
    <>
      <ScrollTop />
      <Suspense fallback={<div className="route-loading">Abrindo o kit…</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/construir" element={<Builder />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </Suspense>
    </>
  )
}
