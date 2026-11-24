import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Nav from '../components/Nav.jsx'
import Footer from '../components/Footer.jsx'
import Icon from '../components/Icon.jsx'
import { BLOCKS, BLOCK_ORDER, makeBlock } from '../data/blocks.js'
import { SYSTEMS, MODULES } from '../data/systems.js'
import { TEMPLATES, THEMES } from '../data/templates.js'
import { FLAGS, buildWhatsAppMessage, WHATSAPP_NUMBER } from '../lib/scope.js'
import ProjectsCarousel from '../components/ProjectsCarousel.jsx'
import InView from '../components/InView.jsx'
import '../styles/home.css'
import '../styles/carousel.css'
import '../styles/home3d.css'

const KitAssembly = lazy(() => import('../components/KitAssembly.jsx'))
const LiquidParts = lazy(() => import('../components/LiquidParts.jsx'))
const SystemScene = lazy(() => import('../components/SystemScene.jsx'))

const FLAG_ICON = { payments: 'pay', database: 'db', auth: 'lock', admin: 'panel', notifications: 'bell', integrations: 'plug', reports: 'chart', '3d': 'cube', mobile: 'phone' }

function useReveal() {
  useEffect(() => {
    document.documentElement.classList.add('js-reveal')
    const els = document.querySelectorAll('[data-reveal]')
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && (e.target.classList.add('is-in'), io.unobserve(e.target))),
      { rootMargin: '0px 0px -12% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
}

function Hero() {
  const nav = useNavigate()
  const scrollRef = useRef(0)
  const [mode, setMode] = useState('template')
  const [value, setValue] = useState('')

  useEffect(() => {
    const on = () => (scrollRef.current = Math.min(1, window.scrollY / (window.innerHeight * 0.9)))
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])

  const submit = (e) => {
    e.preventDefault()
    if (mode === 'template') return nav('/construir?start=template')
    const v = value.trim()
    if (!v) return nav(`/construir?start=${mode}`)
    nav(`/construir?${mode}=${encodeURIComponent(v)}`)
  }

  return (
    <section className="hero">
      <div className="wrap hero-grid">
        <div className="hero-copy">
          <h1>
            Seu site,<br />
            <em>peça por peça.</em>
          </h1>
          <p className="hero-lead">
            A Prime Page faz sites e sistemas à mão para negócios de Leme e região. Aqui você mesmo monta o seu: escolhe um modelo pronto ou descreve o que imagina, ajusta peça por peça e manda para orçamento.
          </p>

          <form className="starter" onSubmit={submit}>
            <div className="starter-tabs" role="tablist" aria-label="Como você quer começar">
              {[
                ['template', 'Modelo pronto', 'grid'],
                ['prompt', 'Descrever', 'text'],
              ].map(([id, label, icon]) => (
                <button key={id} type="button" role="tab" aria-selected={mode === id} className={mode === id ? 'is-on' : ''} onClick={() => setMode(id)}>
                  <Icon name={icon} size={16} /> {label}
                </button>
              ))}
            </div>
            <div className="starter-row">
              {mode === 'prompt' && <input className="field" placeholder="Ex.: site para minha barbearia com agenda online, em preto e dourado" value={value} onChange={(e) => setValue(e.target.value)} aria-label="Descreva o site" />}
              {mode === 'template' && <div className="field starter-note">{TEMPLATES.length} modelos: restaurante, barbearia, clínica, pet shop, pousada e mais.</div>}
              <button className="btn" type="submit">
                {mode === 'template' ? 'Ver modelos' : 'Montar'} <Icon name="arrow" size={16} />
              </button>
            </div>
          </form>

          <dl className="box-spec">
            <div><dt>Peças</dt><dd>{BLOCK_ORDER.length}</dd></div>
            <div><dt>Modelos prontos</dt><dd>{TEMPLATES.length}</dd></div>
            <div><dt>Kits de sistema</dt><dd>{SYSTEMS.length}</dd></div>
            <div><dt>Prazo médio de um site</dt><dd>7 dias</dd></div>
          </dl>
        </div>

        <div className="hero-stage" aria-hidden="true">
          <InView className="hero-stage-in" margin="0px" fallback={<div className="kit-canvas is-loading" />}>
            <Suspense fallback={<div className="kit-canvas is-loading" />}>
              <KitAssembly scrollRef={scrollRef} />
            </Suspense>
          </InView>
        </div>
      </div>
    </section>
  )
}

function Diagram({ step }) {
  // Desenhos técnicos de cada passo, em traço de manual.
  const s = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' }
  if (step === 1)
    return (
      <svg viewBox="0 0 240 150" className="diagram">
        <rect x="14" y="20" width="92" height="110" rx="6" {...s} />
        <path d="M14 36h92 M24 50h50 M24 60h36 M24 76h72v40H24z" {...s} />
        <path d="M118 75h22 M134 69l6 6-6 6" {...s} />
        <rect x="150" y="20" width="76" height="110" rx="6" {...s} className="d-mold" />
        <path d="M150 36h76 M160 50h40 M160 60h28 M160 76h56v40h-56z" {...s} className="d-mold" />
        <text x="150" y="146" className="d-label">SEU SITE</text>
        <text x="14" y="146" className="d-label">MODELO</text>
      </svg>
    )
  if (step === 2)
    return (
      <svg viewBox="0 0 240 150" className="diagram">
        <rect x="40" y="14" width="160" height="22" rx="4" {...s} />
        <rect x="40" y="44" width="160" height="40" rx="4" {...s} className="d-mold d-lift" />
        <rect x="40" y="92" width="76" height="40" rx="4" {...s} />
        <rect x="124" y="92" width="76" height="40" rx="4" {...s} strokeDasharray="4 4" />
        <path d="M210 64h20 M210 64l6-5 M210 64l6 5" {...s} />
        <text x="140" y="116" className="d-label">ENCAIXE</text>
        <circle cx="18" cy="64" r="9" {...s} />
        <path d="M14 64h8 M18 60v8" {...s} />
      </svg>
    )
  return (
    <svg viewBox="0 0 240 150" className="diagram">
      <rect x="18" y="22" width="88" height="108" rx="6" {...s} className="d-mold" />
      <path d="M30 40h50 M30 52h64 M30 64h40 M30 84h8 M44 84h40 M30 96h8 M44 96h30 M30 108h8 M44 108h44" {...s} />
      <path d="M118 76h28 M140 70l6 6-6 6" {...s} />
      <rect x="158" y="14" width="64" height="124" rx="12" {...s} />
      <rect x="166" y="34" width="44" height="34" rx="6" {...s} className="d-mold" />
      <rect x="174" y="76" width="40" height="22" rx="6" {...s} />
      <text x="18" y="146" className="d-label">RESUMO</text>
      <text x="158" y="148" className="d-label">WHATSAPP</text>
    </svg>
  )
}

function Manual() {
  const steps = [
    { n: 1, title: 'Escolha a base', text: 'São ' + TEMPLATES.length + ' modelos prontos, de restaurante a energia solar, cada um com o seu estilo. Prefere outro caminho? Descreva o que imagina ou comece do zero.' },
    { n: 2, title: 'Encaixe e personalize', text: 'Adicione, tire e reordene peças. Clique no texto para reescrever, envie suas fotos, troque cores e fontes, coloque um objeto 3D. Veja no computador e no celular.' },
    { n: 3, title: 'Envie para orçamento', text: 'O modelo vai para o nosso WhatsApp com um resumo técnico: se precisa de pagamento online, banco de dados, login, painel. Assim o orçamento sai certo.' },
  ]
  return (
    <section className="sheet" id="como-funciona">
      <div className="wrap">
        <header className="sheet-head" data-reveal>
          <h2>Manual de montagem</h2>
          <p>Três passos. Você não precisa saber nada de programação; precisa saber o que quer para o seu negócio.</p>
        </header>
        <ol className="manual">
          {steps.map((s) => (
            <li key={s.n} className="manual-step" data-reveal>
              <span className="manual-n">{s.n}</span>
              <Diagram step={s.n} />
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
        <div className="sheet-cta" data-reveal>
          <Link to="/construir" className="btn">Construa o seu site <Icon name="arrow" size={16} /></Link>
          <span>Grátis para montar. Você só fala com a gente quando quiser o orçamento.</span>
        </div>
      </div>
    </section>
  )
}

const GROUP_NAMES = { A: 'Estrutura', B: 'Conteúdo e vendas', C: 'Confiança', D: 'Extras e contato' }

function PartsTree() {
  const [active, setActive] = useState('products')
  const b = BLOCKS[active]
  const group = b.part[0]
  return (
    <section className="parts" id="pecas">
      <div className="wrap">
        <header className="parts-head" data-reveal>
          <h2>Cada peça diz o que custa construir.</h2>
          <p>Uma galeria é simples. Uma loja precisa de pagamento, banco de dados e painel. Escolha uma peça e veja na hora o que ela exige. Tudo isso vai junto no seu pedido.</p>
        </header>

        <div className="pt-board">
          <div className="pt-groups" role="listbox" aria-label="Peças disponíveis">
            {Object.entries(GROUP_NAMES).map(([g, name]) => (
              <div key={g} className="pt-group">
                <span className="pt-group-head"><b className="part-no">{g}</b>{name}</span>
                <div className="pt-parts">
                  {BLOCK_ORDER.filter((k) => BLOCKS[k].part.startsWith(g)).map((k) => (
                    <button
                      key={k}
                      role="option"
                      aria-selected={active === k}
                      className={`pt-part ${active === k ? 'is-on' : ''}`}
                      onMouseEnter={() => setActive(k)}
                      onFocus={() => setActive(k)}
                      onClick={() => setActive(k)}
                    >
                      <span className="part-no">{BLOCKS[k].part}</span>
                      <span className="pt-name">{BLOCKS[k].label}</span>
                      {BLOCKS[k].needs.length > 0 ? <i className="pt-cost">{BLOCKS[k].needs.length}</i> : <i className="pt-free" aria-label="sem custo extra"><Icon name="check" size={12} /></i>}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-stage">
            <span className="ps-tag pt-tag" key={b.part}>{b.part} · {b.label}</span>
            <InView className="pt-canvas" fallback={<div className="pt-canvas-ph" />}>
              <Suspense fallback={<div className="pt-canvas-ph" />}>
                <LiquidParts needs={b.needs} label={`${b.part} · ${b.label}`} />
              </Suspense>
            </InView>
            <div className="pt-card" aria-live="polite">
              <div>
                <span className="part-no">PEÇA {b.part} · {GROUP_NAMES[group]}</span>
                <h3>{b.label}</h3>
                <p>{b.hint}</p>
              </div>
              <div className="pt-needs">
                {b.needs.length === 0 ? (
                  <span className="need is-none"><Icon name="check" size={16} /> Sem custo técnico extra</span>
                ) : (
                  b.needs.map((n) => <span key={n} className="need"><Icon name={FLAG_ICON[n]} size={16} /> {FLAGS[n].label}</span>)
                )}
              </div>
            </div>
          </div>
        </div>
        <p className="pt-legend"><i className="pt-cost">2</i> número de recursos técnicos que a peça exige <i className="pt-free"><Icon name="check" size={12} /></i> sem custo extra</p>
      </div>
    </section>
  )
}

function Systems() {
  const list = SYSTEMS.filter((s) => s.flow.length)
  const [id, setId] = useState(list[0].id)
  const sys = list.find((s) => s.id === id)
  const steps = sys.flow.map((f) => ({ label: MODULES[f.module].label, who: f.who, what: f.what }))
  const [at, setAt] = useState(0)
  const [play, setPlay] = useState(true)

  useEffect(() => setAt(0), [id])
  useEffect(() => {
    if (!play) return
    const t = setInterval(() => setAt((s) => (s + 1) % steps.length), 2200)
    return () => clearInterval(t)
  }, [id, play, steps.length])

  return (
    <section className="systems" id="sistemas">
      <div className="wrap">
        <header className="systems-head" data-reveal>
          <h2>Sistemas também vêm em kit.</h2>
          <p>Veja como o sistema trabalha no dia a dia: cada bloco é uma parte do sistema e a informação vai passando de um para o outro, do primeiro contato até o relatório do dono.</p>
        </header>

        <div className="systems-tabs" role="tablist">
          {list.map((s) => (
            <button key={s.id} role="tab" aria-selected={id === s.id} className={id === s.id ? 'is-on' : ''} onClick={() => setId(s.id)}>
              {s.name}
            </button>
          ))}
        </div>

        <div className="sy-board">
          <div className="sy-stage">
            <InView className="sy-canvas" fallback={<div className="pt-canvas-ph" />}>
              <Suspense fallback={<div className="pt-canvas-ph" />}>
                <SystemScene steps={steps} at={at} />
              </Suspense>
            </InView>
            <div className="sy-now" aria-live="polite">
              <span className="sy-now-n">{at + 1}/{steps.length}</span>
              <div><b>{steps[at].who}</b><span>{steps[at].what}</span></div>
              <button className="b-icon" onClick={() => setPlay(!play)} aria-label={play ? 'Pausar' : 'Reproduzir'}><Icon name={play ? "pause" : "arrow"} size={16} /></button>
            </div>
          </div>

          <aside className="sy-side">
            <h3>{sys.name}</h3>
            <p>{sys.pitch}</p>
            {sys.proof && <p className="systems-proof"><Icon name="check" size={16} /> {sys.proof}</p>}
            <ol className="sy-steps">
              {steps.map((s, i) => (
                <li key={i} className={i === at ? 'is-now' : i < at ? 'is-done' : ''}>
                  <button onClick={() => { setAt(i); setPlay(false) }}>
                    <span className="part-no">{i + 1}</span>
                    <span><b>{s.who}</b> {s.what.charAt(0).toLowerCase() + s.what.slice(1)}</span>
                  </button>
                </li>
              ))}
            </ol>
            <div className="sy-actions">
              <Link className="btn" to={`/construir?system=${sys.id}`}>Montar este sistema <Icon name="arrow" size={16} /></Link>
              <Link className="btn is-ghost" to="/construir?start=system">Descrever o meu</Link>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}


function Projects() {
  return (
    <section className="projects" id="projetos">
      <div className="wrap">
        <header className="projects-head" data-reveal>
          <h2>Montados e no ar.</h2>
          <p>Sites e sistemas que a Prime Page entregou para empresas reais.</p>
        </header>
        <ProjectsCarousel />
      </div>
    </section>
  )
}

function QuotePreview() {
  const message = useMemo(() => {
    const sample = {
      kind: 'site',
      name: 'Studio Bela',
      origin: 'template',
      themeKey: 'beleza',
      theme: THEMES.beleza,
      blocks: ['hero', 'services', 'gallery', 'booking', 'products', 'footer'].map((t) => makeBlock(t)),
      extras: { hasDomain: false, hasLogo: true, copy: 'prime', deadline: '30 dias' },
      createdAt: 1,
    }
    return buildWhatsAppMessage(sample, { name: 'Mariana', business: 'Studio Bela (exemplo)' })
  }, [])
  const lines = message.split('\n').slice(0, 30)
  return (
    <section className="quote">
      <div className="wrap quote-grid">
        <div className="quote-copy" data-reveal>
          <h2>Nada passa batido no orçamento.</h2>
          <p>Quando você termina, o pedido chega no WhatsApp da Prime Page com o código do modelo e um resumo do que muda o preço. Você não precisa saber o que é banco de dados; a peça que você escolheu já avisou a gente.</p>
          <ul className="quote-points">
            <li><Icon name="pay" /> Precisa de pagamento online?</li>
            <li><Icon name="db" /> Vai guardar dados?</li>
            <li><Icon name="lock" /> Tem login de cliente?</li>
            <li><Icon name="panel" /> Você vai querer editar sozinho?</li>
          </ul>
        </div>
        <div className="phone" data-reveal aria-label="Exemplo da mensagem que chega no WhatsApp">
          <div className="phone-top">
            <span className="phone-avatar"><Icon name="whatsapp" size={18} /></span>
            <div><b>Prime Page</b><small>exemplo ilustrativo</small></div>
          </div>
          <div className="phone-body">
            <div className="bubble">
              {lines.map((l, i) => (
                <p key={i} dangerouslySetInnerHTML={{ __html: l.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[c]).replace(/\*(.+?)\*/g, '<b>$1</b>') || '&nbsp;' }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

const FAQ = [
  ['Montar aqui tem custo?', 'Não. Você monta, testa e só envia para orçamento se quiser. O valor final vem da equipe, com base no modelo e no resumo técnico.'],
  ['E se nenhum modelo for a cara do meu negócio?', 'Todo modelo muda inteiro: cores, fontes, fotos, textos e peças. Se mesmo assim faltar algo, descreva no pedido e a equipe desenha do jeito que você precisa.'],
  ['O site fica igual ao que eu montei?', 'O modelo é o ponto de partida. A gente refina o desenho, escreve os textos se você quiser e programa tudo à mão, responsivo e rápido.'],
  ['Quanto tempo leva?', 'Sites simples ficam prontos em cerca de 7 dias. Sistemas variam conforme os módulos, e o prazo vem junto com o orçamento.'],
  ['Preciso ter domínio e hospedagem?', 'Não. Ajudamos a registrar o domínio e configuramos toda a hospedagem.'],
]

function Faq() {
  return (
    <section className="faq" id="duvidas">
      <div className="wrap faq-grid">
        <h2 data-reveal>Antes de montar</h2>
        <div className="faq-list">
          {FAQ.map(([q, a]) => (
            <details key={q} data-reveal>
              <summary>{q}<Icon name="plus" size={18} /></summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

function Close() {
  return (
    <section className="close" id="contato">
      <div className="wrap close-inner" data-reveal>
        <h2>A caixa está aberta.<br />Falta só o seu negócio.</h2>
        <div className="close-actions">
          <Link to="/construir" className="btn">Construa o seu site <Icon name="arrow" size={16} /></Link>
          <a className="btn is-ghost" href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener"><Icon name="whatsapp" /> Prefiro conversar</a>
        </div>
      </div>
    </section>
  )
}

export default function Home() {
  useReveal()
  useEffect(() => {
    document.title = 'Prime Page | Monte o seu site, peça por peça'
  }, [])
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Manual />
        <PartsTree />
        <Systems />
        <Projects />
        <QuotePreview />
        <Faq />
        <Close />
      </main>
      <Footer />
    </>
  )
}
