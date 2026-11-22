import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import AuthForm from '../components/AuthForm.jsx'
import { useAuth } from '../lib/useAuth.jsx'
import { projects, quotes } from '../lib/backend.js'
import SiteRenderer from './SiteRenderer.jsx'
import { BLOCKS } from '../data/blocks.js'
import { MODULES } from '../data/systems.js'
import { FLAGS, computeScope, buildWhatsAppMessage, whatsappUrl, projectCode, originLabel } from '../lib/scope.js'

const FLAG_ICON = { payments: 'pay', database: 'db', auth: 'lock', admin: 'panel', notifications: 'bell', integrations: 'plug', reports: 'chart', '3d': 'cube', mobile: 'phone', storage: 'image' }

export default function Review({ state, dispatch, onBack, onRestart }) {
  const { user } = useAuth()
  const scope = useMemo(() => computeScope(state), [state])
  const [contact, setContact] = useState({ name: '', business: '', phone: '', notes: state.kind === 'system' ? state.system.notes : '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const ex = state.extras
  const setEx = (patch) => dispatch({ type: 'extras', patch })
  const message = buildWhatsAppMessage(state, { ...contact, email: user?.email })

  // Ao entrar/criar conta, preenche nome e telefone.
  useEffect(() => {
    if (user) setContact((c) => ({ ...c, name: c.name || user.name || '', phone: c.phone || user.phone || '' }))
  }, [user])

  const send = async (e) => {
    e.preventDefault()
    if (!user) return setError('Crie sua conta (ou entre) para enviar o pedido.')
    if (!contact.name.trim()) return setError('Diga seu nome para a gente saber com quem fala.')
    setError('')
    setSending(true)
    // A janela abre antes do await para o navegador não bloquear o pop-up.
    const win = window.open('', '_blank')
    try {
      const projectId = await projects.save(state, user)
      const project = { ...state, projectId, remoteId: projectId }
      dispatch({ type: 'set', patch: { projectId, remoteId: projectId } })
      const msg = buildWhatsAppMessage(project, { ...contact, email: user.email })
      await quotes.create({ user, projectId, project, contact, scope, message: msg })
      const url = whatsappUrl(msg)
      if (win) win.location.href = url
      else window.location.href = url
      setSent(true)
    } catch (err) {
      win?.close()
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="review">
      <div className="review-grid">
        <section className="review-main">
          <button className="review-back" onClick={onBack}><Icon name="back" size={16} /> Voltar a montar</button>
          <h1>Revise e peça o orçamento</h1>
          <p className="review-lead">Isso é o que vai para a equipe da Prime Page. Confira o resumo técnico: é ele que define o preço.</p>

          <div className="review-card">
            <div className="review-card-head">
              <div>
                <span className="part-no">CÓDIGO {projectCode(state)}</span>
                <h2>{state.name}</h2>
                <p>{state.kind === 'site' ? `Site · ${originLabel(state.origin)} · ${state.blocks.length} peças` : `Sistema · ${state.system.modules.length} módulos · ${state.system.users} usuários`}</p>
              </div>
              <div className={`review-level is-${scope.complexity.level.toLowerCase()}`}>
                <small>Complexidade</small>
                <b>{scope.complexity.level}</b>
              </div>
            </div>

            <ul className="review-flags">
              {Object.keys(FLAGS).map((f) => {
                const on = scope.flags.includes(f)
                return (
                  <li key={f} className={on ? 'is-on' : ''}>
                    <Icon name={FLAG_ICON[f]} size={18} />
                    <span>
                      <b>{FLAGS[f].label}</b>
                      <small>{on ? 'Por causa de: ' + [...new Set(scope.reasons[f])].join(', ') : 'Não precisa'}</small>
                    </span>
                    <em>{on ? 'Sim' : 'Não'}</em>
                  </li>
                )
              })}
            </ul>

            <div className="review-parts">
              {state.kind === 'site'
                ? state.blocks.map((b) => <span key={b.id}><i className="part-no">{BLOCKS[b.type].part}</i>{BLOCKS[b.type].label}</span>)
                : state.system.modules.map((m) => <span key={m}>{MODULES[m].label}</span>)}
            </div>
          </div>

          <div className="review-questions">
            <h3>Mais algumas coisas para o orçamento sair certo</h3>
            <label className="r-check"><input type="checkbox" checked={ex.hasDomain} onChange={(e) => setEx({ hasDomain: e.target.checked })} /> Já tenho domínio (ex.: meunegocio.com.br)</label>
            <label className="r-check"><input type="checkbox" checked={ex.hasLogo} onChange={(e) => setEx({ hasLogo: e.target.checked })} /> Já tenho logo</label>
            <label className="r-check"><input type="checkbox" checked={ex.admin} onChange={(e) => setEx({ admin: e.target.checked })} /> Quero um painel para eu mesmo atualizar textos e fotos</label>
            <div className="r-row">
              <label>
                <span>Quem escreve os textos?</span>
                <select className="field is-sm" value={ex.copy} onChange={(e) => setEx({ copy: e.target.value })}>
                  <option value="prime">A Prime Page escreve</option>
                  <option value="own">Eu envio os textos</option>
                </select>
              </label>
              <label>
                <span>Prazo desejado</span>
                <select className="field is-sm" value={ex.deadline} onChange={(e) => setEx({ deadline: e.target.value })}>
                  <option value="">Sem pressa</option>
                  <option>Até 7 dias</option>
                  <option>15 dias</option>
                  <option>30 dias</option>
                </select>
              </label>
            </div>
          </div>

          {!user && (
            <div className="review-auth">
              <h3>Crie sua conta para enviar</h3>
              <p>Só e-mail, senha e telefone. Seu projeto fica salvo e você acompanha o orçamento pela sua conta.</p>
              <AuthForm initial="signup" compact />
            </div>
          )}
          {user && <form className="review-form" onSubmit={send}>
            <p className="review-logged"><Icon name="check" size={16} /> Conectado como <b>{user.email}</b> · <Link to="/conta">minha conta</Link></p>
            <h3>Seus dados</h3>
            <div className="r-row">
              <label><span>Seu nome *</span><input className="field" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} autoComplete="name" /></label>
              <label><span>Nome do negócio</span><input className="field" value={contact.business} onChange={(e) => setContact({ ...contact, business: e.target.value })} autoComplete="organization" /></label>
            </div>
            <label><span>Seu WhatsApp</span><input className="field" inputMode="tel" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} autoComplete="tel" placeholder="(19) 9 0000-0000" /></label>
            <label><span>Observações</span><textarea className="field" rows="3" value={contact.notes} onChange={(e) => setContact({ ...contact, notes: e.target.value })} placeholder="Algo que a gente precisa saber?" /></label>
            {error && <p className="start-error" role="alert">{error}</p>}
            <button className="btn is-wa" disabled={sending}>
              <Icon name="whatsapp" /> {sending ? 'Abrindo o WhatsApp…' : 'Enviar para o WhatsApp da Prime Page'}
            </button>
            {sent && (
              <p className="review-sent">
                <Icon name="check" size={16} /> Pedido aberto no WhatsApp. É só apertar enviar por lá. O projeto ficou salvo na sua conta.{' '}
                <Link to="/conta">Ver minha conta</Link> · <button type="button" onClick={onRestart}>Montar outro projeto</button>
              </p>
            )}
          </form>}
        </section>

        <aside className="review-side">
          <div className="review-preview">
            <span className="b-label">Prévia do modelo</span>
            {state.kind === 'site' ? (
              <div className="review-thumb">
                <div className="review-thumb-inner"><SiteRenderer project={state} device="desktop" no3d /></div>
              </div>
            ) : (
              <div className="review-sysmods">{state.system.modules.map((m) => <span key={m}>{MODULES[m].label}</span>)}</div>
            )}
          </div>
          <div className="review-message">
            <span className="b-label">Mensagem que será enviada</span>
            <pre>{message}</pre>
          </div>
        </aside>
      </div>
    </div>
  )
}
