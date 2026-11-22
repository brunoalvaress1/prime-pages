import { useEffect, useRef, useState } from 'react'

// Monta o conteúdo (ex.: uma cena 3D) só quando a área está perto da tela,
// e desmonta quando sai, para não manter várias cenas WebGL ligadas ao mesmo tempo.
export default function InView({ className, children, fallback = null, margin = '200px' }) {
  const ref = useRef(null)
  const [on, setOn] = useState(false)
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setOn(e.isIntersecting), { rootMargin: margin })
    io.observe(ref.current)
    return () => io.disconnect()
  }, [margin])
  return <div ref={ref} className={className}>{on ? children : fallback}</div>
}
