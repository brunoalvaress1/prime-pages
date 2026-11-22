import { useEffect, useMemo, useRef, useState } from 'react'
import Icon from '../components/Icon.jsx'
import { analyze, buildQuestions, buildSystem } from '../data/systemAI.js'
import { MODULES } from '../data/systems.js'
import { readImage } from './SiteRenderer.jsx'

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

const EXAMPLES = [
  'Tenho uma clínica de fisioterapia com 4 profissionais. Quero agenda online, prontuário com fotos de evolução, lembrete no WhatsApp e controle do que cada paciente pagou.',
  'Oficina mecânica: abrir ordem de serviço com fotos do carro, controlar peças no estoque, avisar o cliente quando ficar pronto e emitir nota.',
  'Distribuidora de bebidas com 2 lojas. Preciso de estoque, vendas no caixa, pedidos dos clientes pelo celular e relatório dos mais vendidos.',
  'Escola de inglês: matrícula, turmas, presença, mensalidades com boleto e uma área para o aluno ver notas e material.',
]

function Bubble({ from, children }) {
  return (
    <div className={`ai-msg is-${from}`}>
      {from === 'ai' && <span className="ai-avatar" aria-hidden="true"><Icon name="spark" size={16} /></span>}
      <div className="ai-bubble">{children}</div>
    </div>
  )
}

function Typing() {
  return <Bubble from="ai"><span className="ai-typing"><i /><i /><i /></span></Bubble>
}

function BrandCard({ onDone }) {
  const [b, setB] = useState({ name: '', color: '#1f6fff', logo: '' })
  const input = useRef(null)
  const colors = ['#1f6fff', '#0f8b7d', '#7b4dd6', '#e0592c', '#c2526b', '#111827', '#b08a3e', '#16a34a']
  return (
    <div className="ai-brand">
      <label className="af-field"><span>Nome do sistema</span><input className="field" placeholder="Ex.: Gestão Clínica Vida" value={b.name} onChange={(e) => setB({ ...b, name: e.target.value })} /></label>
      <div className="af-field">
        <span>Cor da marca</span>
        <div className="ai-colors">
          {colors.map((c) => <button key={c} type="button" style={{ background: c }} className={b.color === c ? 'is-on' : ''} onClick={() => setB({ ...b, color: c })} aria-label={c} />)}
          <input type="color" value={b.color} onChange={(e) => setB({ ...b, color: e.target.value })} aria-label="Outra cor" />
        </div>
      </div>
      <div className="ai-logo">
        {b.logo ? <img src={b.logo} alt="Logo" /> : <span><Icon name="image" /></span>}
        <button type="button" className="b-add" onClick={() => input.current.click()}><Icon name="upload" size={14} /> {b.logo ? 'Trocar logo' : 'Enviar logo (opcional)'}</button>
        <input ref={input} type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) try { setB({ ...b, logo: await readImage(f) }) } catch (err) { alert(err.message) } }} />
      </div>
      <button type="button" className="btn" onClick={() => onDone(b)}>Montar meu sistema <Icon name="arrow" size={16} /></button>
    </div>
  )
}

export default function SystemInterview({ onFinish, initialText = '' }) {
  const [phase, setPhase] = useState('write') // write | chat | building
  const [text, setText] = useState(initialText)
  const [log, setLog] = useState([]) // mensagens já exibidas
  const [typing, setTyping] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [qi, setQi] = useState(-1)
  const [answers, setAnswers] = useState({})
  const [multi, setMulti] = useState([])
  const [build, setBuild] = useState([])
  const end = useRef(null)
  const qs = useMemo(() => (analysis ? buildQuestions(analysis) : null), [analysis])
  const q = qs?.questions[qi]

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [log, typing, qi, build])

  const say = async (node, delay = 700) => {
    setTyping(true)
    await wait(delay)
    setTyping(false)
    setLog((l) => [...l, { from: 'ai', node }])
  }

  const start = async () => {
    if (text.trim().length < 20) return
    setPhase('chat')
    setLog([{ from: 'me', node: text }])
    const a = analyze(text)
    setAnalysis(a)
    await say(<p>Li o que você escreveu. Me dá um segundo para entender o seu negócio…</p>, 600)
    await say(
      <div>
        <p>Entendi: é um sistema para <b>{a.domain.label.toLowerCase()}</b>.</p>
        {a.detected.length > 0 && (
          <>
            <p className="ai-small">Já identifiquei no seu texto:</p>
            <div className="ai-chips">{a.detected.filter((m) => MODULES[m]).map((m) => <span key={m}><Icon name="check" size={12} /> {a.domain.rename[m] || MODULES[m].label}</span>)}{a.media.photos && <span><Icon name="check" size={12} /> Fotos</span>}{a.media.videos && <span><Icon name="check" size={12} /> Vídeos</span>}{a.multi && <span><Icon name="check" size={12} /> Mais de uma unidade</span>}</div>
          </>
        )}
        <p>Vou fazer algumas perguntas rápidas só sobre o que ainda não ficou claro. Se não souber, pode pular.</p>
      </div>,
      1400,
    )
    const first = buildQuestions(a).questions[0]
    const pre = first.preset || []
    setMulti(pre)
    await say(<p>{first.text}</p>, 700)
    setQi(0)
  }

  const answer = async (value, label) => {
    const next = { ...answers, [q.id]: value }
    setAnswers(next)
    setLog((l) => [...l, { from: 'me', node: label }])
    setMulti([])
    const comment = reaction(q.id, value)
    const ni = qi + 1
    setQi(-1)
    if (comment) await say(<p>{comment}</p>, 500)
    if (ni < qs.questions.length) {
      const nq = qs.questions[ni]
      setMulti(nq.preset || [])
      await say(<p>{nq.text}</p>, 650)
      setQi(ni)
    } else finish(next)
  }

  const finish = async (all) => {
    setPhase('building')
    const sys = buildSystem(analysis, all)
    const steps = ['Organizando os módulos', `Criando as telas de ${sys.modules.slice(0, 3).map((m) => analysis.domain.rename[m] || MODULES[m].label).join(', ')}`, 'Desenhando o fluxo do dia a dia', 'Montando a estrutura de dados', 'Aplicando a sua marca', 'Pronto!']
    for (const s of steps) {
      setBuild((b) => [...b, s])
      await wait(650)
    }
    const labels = {}
    qs.questions.forEach((qq) => {
      if (all[qq.id] !== undefined && qq.type !== 'brand') labels[qq.text] = qq.labelOf(all[qq.id])
    })
    onFinish({ ...sys, prompt: text, answers: all, answerLabels: labels })
  }

  if (phase === 'write')
    return (
      <div className="ai-write">
        <div className="ai-write-head">
          <span className="ai-avatar is-lg"><Icon name="spark" size={22} /></span>
          <div>
            <h1>Conte como você imagina o seu sistema</h1>
            <p>Escreva do seu jeito: o que a empresa faz, quem vai usar e o que precisa resolver. A gente analisa e pergunta o que faltar.</p>
          </div>
        </div>
        <textarea className="field ai-textarea" rows="7" autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="Ex.: Tenho uma clínica com 3 dentistas. Quero que o paciente agende pelo celular, receba lembrete no WhatsApp, e que a gente guarde as fotos do tratamento…" />
        <div className="ai-write-foot">
          <span className={`ai-count ${text.trim().length >= 20 ? 'is-ok' : ''}`}>{text.trim().length < 20 ? `Escreva pelo menos 20 caracteres (${text.trim().length}/20)` : 'Ótimo, já dá para analisar'}</span>
          <button className="btn" disabled={text.trim().length < 20} onClick={start}>Analisar meu pedido <Icon name="arrow" size={16} /></button>
        </div>
        <div className="ai-examples">
          <span className="b-label">Precisa de inspiração? Use um exemplo:</span>
          {EXAMPLES.map((e) => <button key={e} onClick={() => setText(e)}>{e}</button>)}
        </div>
      </div>
    )

  const total = qs?.questions.length || 1
  const done = Object.keys(answers).length
  return (
    <div className="ai-chat">
      <div className="ai-progress"><span style={{ width: `${phase === 'building' ? 100 : (done / total) * 100}%` }} /><em>{phase === 'building' ? 'Montando' : `${done} de ${total} perguntas`}</em></div>
      <div className="ai-log">
        {log.map((m, i) => <Bubble key={i} from={m.from}>{typeof m.node === 'string' ? <p>{m.node}</p> : m.node}</Bubble>)}
        {typing && <Typing />}
        {phase === 'building' && (
          <Bubble from="ai">
            <p><b>Montando o seu sistema…</b></p>
            <ol className="ai-build">{build.map((s, i) => <li key={i} className={i === build.length - 1 ? 'is-now' : ''}><Icon name={i === build.length - 1 ? 'spark' : 'check'} size={14} /> {s}</li>)}</ol>
          </Bubble>
        )}
        <div ref={end} />
      </div>

      {q && phase === 'chat' && !typing && (
        <div className="ai-answer">
          {q.type === 'single' && (
            <div className="ai-options">
              {q.options.map(([label, v]) => <button key={v} onClick={() => answer(v, label)}>{label}</button>)}
              <button className="is-skip" onClick={() => answer('skip', 'Pular')}>Pular</button>
            </div>
          )}
          {q.type === 'multi' && (
            <div className="ai-options">
              {q.options.map(([label, v]) => (
                <button key={v} className={multi.includes(v) ? 'is-on' : ''} onClick={() => setMulti((m) => (v === 'none' || v === 'later' ? [v] : m.includes(v) ? m.filter((x) => x !== v) : [...m.filter((x) => x !== 'none' && x !== 'later'), v]))}>
                  {multi.includes(v) && <Icon name="check" size={14} />} {label}
                </button>
              ))}
              <button className="btn is-sm" disabled={!multi.length} onClick={() => answer(multi, q.labelOf(multi))}>Confirmar</button>
            </div>
          )}
          {q.type === 'brand' && <BrandCard onDone={(b) => answer(b, b.name ? `${b.name}${b.logo ? ' (com logo)' : ''}` : 'Sem nome por enquanto')} />}
        </div>
      )}
    </div>
  )
}

function reaction(id, v) {
  if (id === 'portal' && v === 'yes') return 'Boa! Vou incluir um portal onde o cliente acessa pelo celular.'
  if (id === 'payments' && v === 'yes') return 'Anotado: cobrança online com Pix, cartão e boleto.'
  if (id === 'nfe' && v === 'maybe') return 'Sem problema, deixo previsto e a equipe confirma com você.'
  if (id === 'media' && Array.isArray(v) && v.includes('videos')) return 'Vídeos ocupam mais espaço; já considero armazenamento extra no orçamento.'
  if (id === 'app' && v === 'yes') return 'Perfeito, vai ter versão instalável no celular.'
  if (id === 'multi' && v === 'yes') return 'Certo, cada unidade com seus dados e um painel geral para você.'
  if (id === 'import' && v !== 'no' && v !== 'skip') return 'Ótimo, a importação dos seus dados entra no projeto.'
  return null
}
