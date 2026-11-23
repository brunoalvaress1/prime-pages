import { useEffect, useRef, useState } from 'react'
import { VisibleCtx } from './visible.js'

// Monta o conteúdo (ex.: uma cena 3D) quando a área chega perto da tela e o mantém
// montado depois disso; fora da tela a cena só pausa (VisibleCtx), sem recriar o WebGL.
export default function InView({ className, children, fallback = null, margin = '200px' }) {
  const ref = useRef(null)
  const [seen, setSeen] = useState(false)
  const [on, setOn] = useState(false)
  useEffect(() => {
    const io = new IntersectionObserver(
      ([e]) => {
        setOn(e.isIntersecting)
        if (e.isIntersecting) setSeen(true)
      },
      { rootMargin: margin },
    )
    io.observe(ref.current)
    return () => io.disconnect()
  }, [margin])
  return (
    <div ref={ref} className={className}>
      {seen ? <VisibleCtx.Provider value={on}>{children}</VisibleCtx.Provider> : fallback}
    </div>
  )
}
