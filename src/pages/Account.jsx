import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Nav from '../components/Nav.jsx'
import Icon from '../components/Icon.jsx'
import SiteRenderer from '../builder/SiteRenderer.jsx'
import { useAuth } from '../lib/useAuth.jsx'
import { auth, projects, quotes, STATUS } from '../lib/backend.js'
import '../styles/builder.css'

function Projects({ user }) {
  const nav = useNavigate()
  const [list, setList] = useState(null)
  const [qs, setQs] = useState([])
  const load = async () => {
    setList(await projects.mine(user))
    setQs(await quotes.mine(user))
  }
  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id])

  if (!list) return <p className="acc-muted">Carregando…</p>
  if (!list.length)
    return (
      <div className="acc-empty">
        <h3>Nenhum projeto ainda</h3>
        <p>Monte seu site ou sistema e ele aparece aqui.</p>
        <Link to="/construir" className="btn">Construir agora <Icon name="arrow" size={16} /></Link>
      </div>
    )
  return (
    <div className="acc-grid">
      {list.map((p) => {
        const q = qs.find((x) => x.project_id === p.id)
        return (
          <article key={p.id} className="acc-proj">
            <div className="acc-thumb">
              {p.kind === 'site' && p.data?.blocks ? (
                <div className="acc-thumb-inner"><SiteRenderer project={p.data} device="desktop" no3d /></div>
              ) : (
                <div className="acc-thumb-sys"><Icon name="system" size={28} /><span>{p.data?.system?.modules?.length || 0} módulos</span></div>
              )}
            </div>
            <div className="acc-proj-body">
              <span className="part-no">{p.kind === 'site' ? 'SITE' : 'SISTEMA'}</span>
              <h3>{p.name}</h3>
              <p>Atualizado em {new Date(p.updated_at).toLocaleDateString('pt-BR')}</p>
              {q && <span className={`acc-status is-${q.status}`}>Orçamento: {STATUS[q.status]}</span>}
              <div className="acc-actions">
                <button className="btn is-sm" onClick={() => nav(`/construir?projeto=${p.id}`)}>Abrir e editar</button>
                <button className="b-icon is-danger" aria-label="Apagar projeto" onClick={async () => { if (confirm(`Apagar "${p.name}"?`)) { await projects.remove(p.id); load() } }}><Icon name="trash" size={16} /></button>
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}

function Profile({ user }) {
  const [f, setF] = useState({ name: user.name || '', phone: user.phone || '', email: user.email, current: '', next: '' })
  const [msg, setMsg] = useState({})
  const run = async (key, fn) => {
    setMsg({ [key]: { busy: true } })
    try {
      setMsg({ [key]: { ok: (await fn()) || 'Salvo.' } })
    } catch (e) {
      setMsg({ [key]: { err: e.message } })
    }
  }
  const note = (k) => msg[k] && <p className={msg[k].err ? 'af-error' : 'af-info'}>{msg[k].err || msg[k].ok || 'Salvando…'}</p>
  return (
    <div className="acc-forms">
      <form className="acc-card" onSubmit={(e) => { e.preventDefault(); run('p', async () => { await auth.updateProfile(f); return 'Dados atualizados.' }) }}>
        <h3>Seus dados</h3>
        <label className="af-field"><span>Nome</span><input className="field" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
        <label className="af-field"><span>Telefone / WhatsApp</span><input className="field" inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></label>
        {note('p')}
        <button className="btn is-sm">Salvar dados</button>
      </form>
      <form className="acc-card" onSubmit={(e) => { e.preventDefault(); run('e', () => auth.updateEmail(f.email)) }}>
        <h3>E-mail de acesso</h3>
        <label className="af-field"><span>E-mail</span><input className="field" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
        {note('e')}
        <button className="btn is-sm">Trocar e-mail</button>
      </form>
      <form className="acc-card" onSubmit={(e) => { e.preventDefault(); run('s', async () => { await auth.updatePassword(f.current, f.next); setF({ ...f, current: '', next: '' }); return 'Senha alterada.' }) }}>
        <h3>Senha</h3>
        <label className="af-field"><span>Senha atual</span><input className="field" type="password" autoComplete="current-password" value={f.current} onChange={(e) => setF({ ...f, current: e.target.value })} /></label>
        <label className="af-field"><span>Nova senha</span><input className="field" type="password" autoComplete="new-password" value={f.next} onChange={(e) => setF({ ...f, next: e.target.value })} /></label>
        {note('s')}
        <button className="btn is-sm">Trocar senha</button>
        <Link to="/entrar?modo=forgot" className="af-link">Esqueci a senha atual</Link>
      </form>
    </div>
  )
}

export default function Account() {
  const { user, ready } = useAuth()
  const nav = useNavigate()
  const [tab, setTab] = useState('proj')
  useEffect(() => {
    document.title = 'Minha conta | Prime Page'
    if (ready && !user) nav('/entrar?next=/conta', { replace: true })
  }, [ready, user, nav])
  if (!user) return null
  return (
    <>
      <Nav />
      <main className="acc wrap">
        <header className="acc-head">
          <div>
            <h1>Olá, {user.name?.split(' ')[0] || 'tudo bem'}?</h1>
            <p>{user.email}</p>
          </div>
          <div className="acc-head-actions">
            {user.isAdmin && <Link className="btn is-ghost is-sm" to="/admin">Painel admin</Link>}
            <Link className="btn is-sm" to="/construir">Novo projeto</Link>
            <button className="btn is-ghost is-sm" onClick={async () => { await auth.signOut(); nav('/') }}>Sair</button>
          </div>
        </header>
        <div className="acc-tabs" role="tablist">
          <button role="tab" aria-selected={tab === 'proj'} className={tab === 'proj' ? 'is-on' : ''} onClick={() => setTab('proj')}>Meus projetos</button>
          <button role="tab" aria-selected={tab === 'dados'} className={tab === 'dados' ? 'is-on' : ''} onClick={() => setTab('dados')}>Dados e login</button>
        </div>
        {tab === 'proj' ? <Projects user={user} /> : <Profile user={user} />}
      </main>
    </>
  )
}
