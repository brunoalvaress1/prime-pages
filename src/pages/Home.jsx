import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Nav from '../components/Nav.jsx'
import Footer from '../components/Footer.jsx'
import Icon from '../components/Icon.jsx'
import { BLOCKS, BLOCK_ORDER, makeBlock } from '../data/blocks.js'
import { SYSTEMS, MODULES } from '../data/systems.js'
import { TEMPLATES, THEMES } from '../data/templates.js'
import { FLAGS, buildWhatsAppMessage, WHATSAPP_NUMBER } from '../lib/scope.js'
import { PROJECTS } from '../data/projects.js'
import '../styles/home.css'

const KitAssembly = lazy(() => import('../components/KitAssembly.jsx'))

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
  const [mode, setMode] = useState('url')
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
            A Prime Page faz sites e sistemas à mão para negócios de Leme e região. Aqui você mesmo monta o seu: parte de um site que você gosta, de um modelo ou do que escrever, e manda para orçamento.
          </p>

          <form className="starter" onSubmit={submit}>
            <div className="starter-tabs" role="tablist" aria-label="Como você quer começar">
              {[
                ['url', 'Copiar um site', 'link'],
                ['prompt', 'Descrever', 'text'],
                ['template', 'Modelo pronto', 'grid'],
              ].map(([id, label, icon]) => (
                <button key={id} type="button" role="tab" aria-selected={mode === id} className={mode === id ? 'is-on' : ''} onClick={() => setMode(id)}>
                  <Icon name={icon} size={16} /> {label}
                </button>
              ))}
            </div>
            <div className="starter-row">
              {mode === 'url' && <input className="field" inputMode="url" placeholder="Cole o endereço, ex.: www.sitequeeugosto.com.br" value={value} onChange={(e) => setValue(e.target.value)} aria-label="Endereço do site de referência" />}
              {mode === 'prompt' && <input className="field" placeholder="Ex.: site para minha barbearia com agenda online, em preto e dourado" value={value} onChange={(e) => setValue(e.target.value)} aria-label="Descreva o site" />}
              {mode === 'template' && <div className="field starter-note">{TEMPLATES.length} modelos: restaurante, clínica, salão, loja, oficina e mais.</div>}
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
          <Suspense fallback={<div className="kit-canvas is-loading" />}>
            <KitAssembly scrollRef={scrollRef} />
          </Suspense>
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
        <text x="150" y="146" className="d-label">BASE COPIADA</text>
        <text x="14" y="146" className="d-label">SITE DE REFERÊNCIA</text>
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
    { n: 1, title: 'Escolha a base', text: 'Cole o endereço de um site que você gosta e nós desmontamos a estrutura dele para virar o seu ponto de partida. Ou comece de um modelo pronto, do que você escrever ou do zero.' },
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

function PartsTree() {
  const [active, setActive] = useState('products')
  const b = BLOCKS[active]
  const groups = ['A', 'B', 'C', 'D'].map((g) => BLOCK_ORDER.filter((k) => BLOCKS[k].part.startsWith(g)))
  return (
    <section className="parts" id="pecas">
      <div className="wrap parts-grid">
        <header className="parts-head" data-reveal>
          <h2>Cada peça diz o que custa construir.</h2>
          <p>Uma galeria é simples. Uma loja precisa de pagamento, banco de dados e painel. Enquanto você monta, cada peça mostra o que exige, e isso vai junto no pedido.</p>
        </header>

        <div className="sprue" data-reveal role="listbox" aria-label="Peças disponíveis">
          {groups.map((g, gi) => (
            <div key={gi} className="sprue-row">
              <span className="sprue-letter part-no">{'ABCD'[gi]}</span>
              {g.map((k) => (
                <button
                  key={k}
                  role="option"
                  aria-selected={active === k}
                  className={`sprue-part ${active === k ? 'is-on' : ''} ${BLOCKS[k].needs.length ? 'has-needs' : ''}`}
                  onMouseEnter={() => setActive(k)}
                  onFocus={() => setActive(k)}
                  onClick={() => setActive(k)}
                >
                  <span className="part-no">{BLOCKS[k].part}</span>
                  {BLOCKS[k].label}
                  {BLOCKS[k].needs.length > 0 && <i className="sprue-dot" aria-label="exige recursos" />}
                </button>
              ))}
            </div>
          ))}
        </div>

        <aside className="part-card" aria-live="polite">
          <span className="part-no">PEÇA {b.part}</span>
          <h3>{b.label}</h3>
          <p>{b.hint}</p>
          <div className="part-needs">
            {b.needs.length === 0 ? (
              <span className="need is-none"><Icon name="check" size={16} /> Sem custo técnico extra</span>
            ) : (
              b.needs.map((n) => (
                <span key={n} className="need"><Icon name={FLAG_ICON[n]} size={16} /> {FLAGS[n].label}</span>
              ))
            )}
          </div>
        </aside>
      </div>
    </section>
  )
}

function Systems() {
  const list = SYSTEMS.filter((s) => s.flow.length)
  const [id, setId] = useState(list[0].id)
  const sys = list.find((s) => s.id === id)
  const [step, setStep] = useState(0)
  const ref = useRef(null)

  useEffect(() => {
    setStep(0)
    const t = setInterval(() => setStep((s) => (s + 1) % sys.flow.length), 1700)
    return () => clearInterval(t)
  }, [id, sys.flow.length])

  return (
    <section className="systems" id="sistemas" ref={ref}>
      <div className="wrap">
        <header className="systems-head" data-reveal>
          <h2>Sistemas também vêm em kit.</h2>
          <p>Escolha o tipo de sistema, ligue os módulos que fazem sentido e veja como ele funcionaria no dia a dia da sua empresa, antes de gastar um real.</p>
        </header>

        <div className="systems-tabs" role="tablist">
          {list.map((s) => (
            <button key={s.id} role="tab" aria-selected={id === s.id} className={id === s.id ? 'is-on' : ''} onClick={() => setId(s.id)}>
              {s.name}
            </button>
          ))}
        </div>

        <div className="systems-board">
          <div className="systems-info">
            <h3>{sys.name}</h3>
            <p>{sys.pitch}</p>
            {sys.proof && <p className="systems-proof"><Icon name="check" size={16} /> {sys.proof}</p>}
            <ul className="mod-list">
              {sys.modules.map((m) => (
                <li key={m} className={sys.defaults.includes(m) ? 'is-on' : ''}>
                  <span className="mod-tick" />
                  {MODULES[m].label}
                </li>
              ))}
            </ul>
            <Link className="btn" to={`/construir?system=${sys.id}`}>Montar este sistema <Icon name="arrow" size={16} /></Link>
          </div>

          <ol className="flow" aria-label="Como o sistema funciona">
            {sys.flow.map((f, i) => (
              <li key={i} className={`flow-step ${i === step ? 'is-now' : ''} ${i < step ? 'is-done' : ''}`}>
                <span className="flow-who">{f.who}</span>
                <span className="flow-what">{f.what}</span>
                <span className="flow-mod part-no">{MODULES[f.module].label}</span>
              </li>
            ))}
          </ol>
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
        <div className="projects-grid">
          {PROJECTS.map((p, i) => (
            <a key={p.name} href={p.url} target="_blank" rel="noopener" className={`project ${i < 3 ? 'is-wide' : ''}`} data-reveal>
              <div className="project-shot">
                <img src={p.image} alt={`Tela do projeto ${p.name}`} loading="lazy" />
              </div>
              <div className="project-meta">
                <span className={`project-kind ${p.kind === 'Sistema' ? 'is-system' : ''}`}>{p.kind}</span>
                <h3>{p.name}</h3>
                <p>{p.text}</p>
                <span className="project-link">{p.host} <Icon name="arrow" size={14} /></span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

function QuotePreview() {
  const message = useMemo(() => {
    const sample = {
      kind: 'site',
      name: 'Studio Bela',
      origin: 'url',
      reference: 'www.exemplo-de-salao.com.br',
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
  ['Posso copiar qualquer site?', 'Você usa o site como referência de estrutura e estilo. A Prime Page reconstrói tudo do zero com os seus textos, imagens e marca; não copiamos conteúdo nem marca de terceiros.'],
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
