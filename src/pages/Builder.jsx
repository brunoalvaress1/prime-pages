import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Logo from '../components/Logo.jsx'
import Icon from '../components/Icon.jsx'
import { useBuilder } from '../builder/store.js'
import { TEMPLATES, TEMPLATE_CATS, THEMES, BLANK } from '../data/templates.js'
import { SYSTEMS } from '../data/systems.js'
import { generateFromPrompt } from '../lib/generator.js'
import BuildSite from '../builder/BuildSite.jsx'
import BuildSystem from '../builder/BuildSystem.jsx'
import Review from '../builder/Review.jsx'
import SitePreview from '../builder/SitePreview.jsx'
import { useAuth } from '../lib/useAuth.jsx'
import { projects } from '../lib/backend.js'
import '../styles/builder.css'

const STEPS = [
  ['start', 'Começar'],
  ['build', 'Montar'],
  ['review', 'Orçamento'],
]

function Working({ log, title }) {
  return (
    <div className="working" role="status" aria-live="polite">
      <div className="working-card">
        <div className="working-sprue" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, i) => <span key={i} style={{ animationDelay: i * 0.12 + 's' }} />)}
        </div>
        <h2>{title}</h2>
        <ol className="working-log">
          {log.map((l, i) => (
            <li key={i} className={i === log.length - 1 ? 'is-now' : ''}>
              <Icon name={i === log.length - 1 ? 'spark' : 'check'} size={16} /> {l}
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

function Start({ state, dispatch, initialTab, autoRun }) {
  const [tab, setTab] = useState(initialTab || 'template')
  const [cat, setCat] = useState('')
  const [prompt, setPrompt] = useState(autoRun?.prompt || '')
  const [busy, setBusy] = useState(null)
  const [log, setLog] = useState([])
  const [error, setError] = useState('')
  const ran = useRef(false)

  const run = async (mode, input) => {
    setError('')
    setLog([])
    setBusy(mode)
    try {
      const r = await generateFromPrompt(input, (s) => setLog((l) => [...l, s]))
      dispatch({ type: 'load-site', origin: mode, name: r.name, themeKey: r.themeKey, theme: r.theme, blocks: r.blocks, analysis: r.analysis, reference: '', prompt: input })
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(null)
    }
  }

  useEffect(() => {
    if (ran.current || !autoRun) return
    ran.current = true
    if (autoRun.prompt) run('prompt', autoRun.prompt)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const tabs = [
    ['template', 'Modelo pronto', 'grid', `${TEMPLATES.length} modelos`],
    ['prompt', 'Descrever em texto', 'text', ''],
    ['system', 'Sistema', 'system', ''],
    ['blank', 'Do zero', 'plus', ''],
  ]

  return (
    <div className="start">
      {busy && <Working log={log} title="Montando a partir do seu pedido" />}
      <div className="start-head">
        <h1>Por onde você quer começar?</h1>
        <p>Tudo que sair daqui é editável. Você pode trocar textos, fotos, cores e peças depois.</p>
      </div>
      <div className="start-grid">
        <div className="start-tabs" role="tablist" aria-orientation="vertical">
          {tabs.map(([id, label, icon, tag]) => (
            <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'is-on' : ''} onClick={() => { setTab(id); setError('') }}>
              <Icon name={icon} />
              <span>{label}</span>
              {tag && <em>{tag}</em>}
            </button>
          ))}
        </div>

        <div className="start-panel">

          {tab === 'prompt' && (
            <form className="start-form" onSubmit={(e) => { e.preventDefault(); run('prompt', prompt) }}>
              <h2>Escreva o que você imagina</h2>
              <p>Conte o tipo de negócio, o que o site precisa ter e o estilo. Quanto mais detalhe, melhor.</p>
              <textarea className="field" rows="5" autoFocus placeholder="Ex.: Tenho uma barbearia em Leme. Quero um site escuro com dourado, com agenda online, galeria de cortes, preços e mapa." value={prompt} onChange={(e) => setPrompt(e.target.value)} aria-label="Descrição do site" />
              <div className="start-chips">
                {['com agenda online', 'com loja e pagamento', 'com objeto 3D', 'com área do cliente', 'em azul', 'estilo claro e minimalista'].map((c) => (
                  <button type="button" key={c} onClick={() => setPrompt((p) => (p ? p.replace(/\s*$/, '') + ', ' : '') + c)}>
                    <Icon name="plus" size={14} /> {c}
                  </button>
                ))}
              </div>
              <button className="btn" disabled={prompt.trim().length < 12 || busy}>Montar meu site <Icon name="arrow" size={16} /></button>
            </form>
          )}

          {tab === 'template' && (
            <div>
              <h2>Escolha um modelo pronto</h2>
              <p className="start-sub">{TEMPLATES.length} modelos para começar. Troque textos, fotos, cores e peças depois.</p>
              <div className="tpl-cats" role="group" aria-label="Filtrar modelos por área">
                {[['', 'Todos'], ...TEMPLATE_CATS].map(([id, label]) => (
                  <button key={id || 'all'} type="button" aria-pressed={cat === id} className={cat === id ? 'is-on' : ''} onClick={() => setCat(id)}>
                    {label}
                  </button>
                ))}
              </div>
              <div className="tpl-grid">
                {TEMPLATES.filter((t) => !cat || t.cat === cat).map((t) => (
                  <button key={t.id} className="tpl" onClick={() => dispatch({ type: 'load-site', origin: 'template', name: t.name, themeKey: t.theme, theme: THEMES[t.theme], blocks: t.blocks() })}>
                    <span className="tpl-img"><img src={t.cover} alt="" loading="lazy" /></span>
                    <span className="tpl-meta">
                      <b>{t.name}</b>
                      <small>{t.segment}</small>
                      <span className="tpl-tags">{t.tags.map((g) => <i key={g}>{g}</i>)}</span>
                    </span>
                    <span className="tpl-swatch" style={{ background: THEMES[t.theme].accent }} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {tab === 'system' && (
            <div>
              <h2>Que sistema a sua empresa precisa?</h2>
              <p className="start-sub">Descreva com suas palavras e a gente monta junto com você, ou parta de um modelo.</p>
              <button className="sys-ai" onClick={() => dispatch({ type: 'start-interview' })}>
                <span className="ai-avatar is-lg"><Icon name="spark" size={22} /></span>
                <span>
                  <b>Descrever meu sistema</b>
                  <small>Você conta o que precisa, a IA analisa, faz perguntas sobre o que faltar e monta um sistema sob medida com telas, fluxo e a sua marca.</small>
                </span>
                <em>Recomendado</em>
              </button>
              <span className="b-label sys-or">Ou comece por um modelo pronto</span>
              <div className="sys-grid">
                {SYSTEMS.filter((s) => s.id !== 'sob-medida').map((s) => (
                  <button key={s.id} className="sys" onClick={() => dispatch({ type: 'load-system', id: s.id })}>
                    <b>{s.name}</b>
                    <span>{s.pitch}</span>
                    {s.proof && <small><Icon name="check" size={14} /> {s.proof}</small>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {tab === 'blank' && (
            <div className="start-form">
              <h2>Montar do zero</h2>
              <p>Começa com capa, sobre, contato e rodapé. Você encaixa o resto peça por peça.</p>
              <button className="btn" onClick={() => dispatch({ type: 'load-site', origin: 'blank', name: 'Meu site', themeKey: 'prime', theme: THEMES.prime, blocks: BLANK() })}>
                Abrir kit vazio <Icon name="arrow" size={16} />
              </button>
            </div>
          )}

          {error && <p className="start-error" role="alert">{error}</p>}
        </div>
      </div>
    </div>
  )
}

export default function Builder() {
  const [state, dispatch] = useBuilder()
  const [params, setParams] = useSearchParams()
  const [autoRun] = useState(() => {
    const prompt = params.get('prompt')
    return prompt ? { prompt } : null
  })
  const start = params.get('start')
  const initialTab = start && start !== 'url' ? start : autoRun?.prompt ? 'prompt' : 'template'

  const { user } = useAuth()
  const [saveState, setSaveState] = useState('')
  const [preview, setPreview] = useState(false)

  useEffect(() => {
    document.title = 'Construa o seu site | Prime Page'
    const sys = params.get('system')
    const pid = params.get('projeto')
    if (pid) {
      projects.get(pid).then((row) => {
        if (row?.data) dispatch({ type: 'set', patch: { ...row.data, projectId: row.id, remoteId: row.id, step: 'build', selected: null, selImg: null } })
        else alert('Projeto não encontrado ou sem permissão para abrir.')
      })
    } else if (sys && SYSTEMS.some((s) => s.id === sys)) dispatch({ type: 'load-system', id: sys })
    else if (params.get('prompt') || params.get('start') || params.get('url')) dispatch({ type: 'set', patch: { step: 'start' } })
    if ([...params.keys()].length) setParams({}, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const hasProject = state.kind === 'system' || state.blocks.length > 0
  const go = (step) => {
    if (step !== 'start' && !hasProject) return
    dispatch({ type: 'set', patch: { step } })
    window.scrollTo(0, 0)
  }

  return (
    <div className={`builder ${state.step === 'build' && state.kind === 'site' ? 'is-workspace' : ''}`}>
      <header className="b-top">
        <Link to="/" className="b-logo" aria-label="Voltar para o site"><Logo height={24} /></Link>
        <ol className="b-steps">
          {STEPS.map(([id, label], i) => (
            <li key={id}>
              <button className={state.step === id ? 'is-on' : ''} disabled={id !== 'start' && !hasProject} onClick={() => go(id)}>
                <span className="part-no">{i + 1}</span> {label}
              </button>
            </li>
          ))}
        </ol>
        <div className="b-top-right">
          {hasProject && state.step !== 'start' && (
            <input className="b-name" value={state.name} onChange={(e) => dispatch({ type: 'set', patch: { name: e.target.value } })} aria-label="Nome do projeto" />
          )}
          {state.step === 'build' && state.kind === 'site' && (
            <button className="btn is-ghost is-sm" onClick={() => setPreview(true)}><Icon name="eye" size={14} /> Testar site</button>
          )}
          {user && hasProject && state.step !== 'start' && (
            <button
              className="btn is-ghost is-sm"
              disabled={saveState === 'saving'}
              onClick={async () => {
                setSaveState('saving')
                try {
                  const id = await projects.save(state, user)
                  dispatch({ type: 'set', patch: { projectId: id, remoteId: id } })
                  setSaveState('saved')
                  setTimeout(() => setSaveState(''), 2000)
                } catch (e) {
                  alert(e.message)
                  setSaveState('')
                }
              }}
            >
              <Icon name={saveState === 'saved' ? 'check' : 'upload'} size={14} /> {saveState === 'saving' ? 'Salvando…' : saveState === 'saved' ? 'Salvo' : 'Salvar'}
            </button>
          )}
          {state.step === 'build' && (
            <button className="btn is-sm" onClick={() => go('review')}>Pedir orçamento <Icon name="arrow" size={14} /></button>
          )}
          <Link className="b-user" to={user ? (user.isAdmin ? '/admin' : '/conta') : '/entrar?next=/construir'} title={user ? user.email : 'Entrar'}>
            {user ? (user.name || user.email).slice(0, 1).toUpperCase() : <Icon name="lock" size={14} />}
          </Link>
        </div>
      </header>

      {state.step === 'start' && <Start state={state} dispatch={dispatch} initialTab={initialTab} autoRun={autoRun} />}
      {state.step === 'build' && state.kind === 'site' && <BuildSite state={state} dispatch={dispatch} />}
      {state.step === 'build' && state.kind === 'system' && <BuildSystem state={state} dispatch={dispatch} onNext={() => go('review')} />}
      {state.step === 'review' && <Review state={state} dispatch={dispatch} onBack={() => go('build')} onRestart={() => { dispatch({ type: 'reset' }) }} />}
      {preview && <SitePreview project={state} onClose={() => setPreview(false)} />}
    </div>
  )
}
