import { useEffect, useRef, useState } from 'react'
import Icon from './Icon.jsx'
import { PROJECTS } from '../data/projects.js'

// Carrossel 3D: os projetos ficam num anel, todos no mesmo formato.
// Gira sozinho, para ao passar o mouse, aceita arrastar, setas e clique no card.
export default function ProjectsCarousel() {
  const n = PROJECTS.length
  const step = 360 / n
  const [angle, setAngle] = useState(0)
  const [paused, setPaused] = useState(false)
  const drag = useRef(null)
  const ringRef = useRef(null)
  const [radius, setRadius] = useState(560)
  const active = ((Math.round(-angle / step) % n) + n) % n
  const p = PROJECTS[active]
  const [moving, setMoving] = useState(false)
  const prevActive = useRef(active)
  const [dir, setDir] = useState(1)

  // transição entre projetos: o anel inclina enquanto gira e o texto entra pelo lado do movimento
  useEffect(() => {
    if (prevActive.current === active) return
    const d = (active - prevActive.current + n) % n
    setDir(d <= n / 2 ? 1 : -1)
    prevActive.current = active
    setMoving(true)
    const t = setTimeout(() => setMoving(false), 1000)
    return () => clearTimeout(t)
  }, [active, n])

  useEffect(() => {
    const fit = () => setRadius(window.innerWidth < 700 ? 300 : window.innerWidth < 1100 ? 440 : 600)
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  // giro automático lento, sempre parando com um card de frente
  useEffect(() => {
    if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setTimeout(() => setAngle((a) => Math.round((a - step) / step) * step), 3800)
    return () => clearTimeout(t)
  }, [paused, step, active])

  const goTo = (i) => {
    // menor caminho até o card i
    const target = -i * step
    const cur = angle
    const diff = ((((target - cur) % 360) + 540) % 360) - 180
    setAngle(cur + diff)
  }

  const down = (e) => {
    drag.current = { x: e.clientX, a: angle, moved: false }
    setPaused(true)
    ringRef.current.style.transition = 'none'
  }
  const move = (e) => {
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.x
    if (Math.abs(dx) > 4) d.moved = true
    setAngle(d.a + dx * 0.25)
  }
  const up = () => {
    const d = drag.current
    drag.current = null
    ringRef.current.style.transition = ''
    setAngle((a) => Math.round(a / step) * step)
    setTimeout(() => setPaused(false), 4000)
    return d
  }

  return (
    <div className={`pc ${moving ? 'is-moving' : ''} ${paused ? 'is-paused' : ''}`} onMouseEnter={() => setPaused(true)} onMouseLeave={() => !drag.current && setPaused(false)}>
      <div className="pc-stage" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={() => drag.current && up()}>
        <div className="pc-ring" ref={ringRef} style={{ transform: `translateZ(${-radius - (moving ? 120 : 0)}px) rotateX(${moving ? -4 : 0}deg) rotateY(${angle}deg)` }}>
          {PROJECTS.map((x, i) => {
            const rel = ((((i * step + angle) % 360) + 540) % 360) - 180
            const front = Math.abs(rel) < step / 2
            return (
              <button
                key={x.name}
                type="button"
                className={`pc-card ${front ? 'is-front' : ''}`}
                style={{ transform: `rotateY(${i * step}deg) translateZ(${radius}px)`, opacity: Math.abs(rel) > 110 ? 0.15 : 1 }}
                onClick={() => !drag.current?.moved && (front ? window.open(x.url, '_blank', 'noopener') : goTo(i))}
                aria-label={front ? `Abrir ${x.name}` : `Ver ${x.name}`}
              >
                <span className="pc-bar"><i /><i /><i /><em>{x.host}</em></span>
                <span className="pc-shot"><img src={x.image} alt="" loading="lazy" draggable={false} /></span>
              </button>
            )
          })}
        </div>
        <div className="pc-floor" aria-hidden="true" />
      </div>

      <div className="pc-info" aria-live="polite">
        <button className="pc-arrow" onClick={() => goTo((active - 1 + n) % n)} aria-label="Projeto anterior"><Icon name="back" /></button>
        <div className={`pc-meta ${dir > 0 ? 'from-right' : 'from-left'}`} key={p.name}>
          <span className={`project-kind ${p.kind === 'Sistema' ? 'is-system' : ''}`}>{p.kind}</span>
          <h3>{p.name}</h3>
          <p>{p.text}</p>
          <a href={p.url} target="_blank" rel="noopener" className="pc-link">Ver projeto no ar <Icon name="arrow" size={14} /></a>
        </div>
        <button className="pc-arrow" onClick={() => goTo((active + 1) % n)} aria-label="Próximo projeto"><Icon name="arrow" /></button>
      </div>
      <div className="pc-dots">
        <span className="pc-timer" key={active + (paused ? 'p' : '')} aria-hidden="true" />
        {PROJECTS.map((x, i) => <button key={x.name} className={i === active ? 'is-on' : ''} onClick={() => goTo(i)} aria-label={x.name} />)}
      </div>
    </div>
  )
}
