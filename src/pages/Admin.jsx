import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Logo from '../components/Logo.jsx'
import Icon from '../components/Icon.jsx'
import SiteRenderer from '../builder/SiteRenderer.jsx'
import { useAuth } from '../lib/useAuth.jsx'
import { auth, projects, quotes, allUsers, STATUS, MODE } from '../lib/backend.js'
import { FLAGS } from '../lib/scope.js'
import { MODULES } from '../data/systems.js'
import { exportJson, exportHtml } from '../lib/exportSite.js'
import '../styles/builder.css'

const FLAG_ICON = { payments: 'pay', database: 'db', auth: 'lock', admin: 'panel', notifications: 'bell', integrations: 'plug', reports: 'chart', '3d': 'cube', mobile: 'phone', storage: 'image' }

function Detail({ q, onClose, onStatus }) {
  const nav = useNavigate()
  const [proj, setProj] = useState(undefined)
  const [note, setNote] = useState(q.admin_note || '')
  useEffect(() => {
    setProj(undefined)
    if (q.project_id) projects.get(q.project_id).then((p) => setProj(p || null))
    else setProj(null)
  }, [q.project_id])
  const data = proj?.data
  const phone = (q.contact_phone || '').replace(/\D/g, '')

  return (
    <aside className="adm-detail" aria-label="Detalhes do pedido">
      <div className="adm-detail-head">
        <div>
          <span className="part-no">{q.kind === 'site' ? 'SITE' : 'SISTEMA'} · {new Date(q.created_at).toLocaleString('pt-BR')}</span>
          <h2>{q.name}</h2>
          <p>{q.contact_name} · {q.business || 'sem negócio informado'}</p>
        </div>
        <button className="b-icon" onClick={onClose} aria-label="Fechar"><Icon name="x" size={16} /></button>
      </div>

      <div className="adm-contact">
        {phone && <a className="btn is-wa is-sm" href={`https://wa.me/${phone.length <= 11 ? '55' + phone : phone}`} target="_blank" rel="noopener"><Icon name="whatsapp" size={16} /> {q.contact_phone}</a>}
        {q.contact_email && <a className="btn is-ghost is-sm" href={`mailto:${q.contact_email}`}><Icon name="mail" size={16} /> {q.contact_email}</a>}
      </div>

      <div className="adm-status">
        <span className="b-label">Status</span>
        <div className="b-seg is-wrap">
          {Object.entries(STATUS).map(([k, l]) => <button key={k} className={q.status === k ? 'is-on' : ''} onClick={() => onStatus(q.id, k, note)}>{l}</button>)}
        </div>
        <textarea className="field" rows="2" placeholder="Anotação interna (valor, prazo, combinados…)" value={note} onChange={(e) => setNote(e.target.value)} onBlur={() => note !== (q.admin_note || '') && onStatus(q.id, q.status, note)} />
      </div>

      <div className="adm-flags">
        {Object.keys(FLAGS).map((f) => (
          <span key={f} className={q.flags?.includes(f) ? 'is-on' : ''}><Icon name={FLAG_ICON[f]} size={14} /> {FLAGS[f].short}</span>
        ))}
        <span className="is-level">Complexidade: <b>{q.complexity}</b></span>
      </div>

      <div className="adm-block">
        <div className="adm-block-head">
          <h3>Modelo montado pelo cliente</h3>
          {data && (
            <div className="adm-tools">
              <button className="btn is-sm" onClick={() => nav(`/construir?projeto=${proj.id}`)}>Abrir no construtor</button>
              <button className="btn is-ghost is-sm" onClick={() => exportJson(data)}>JSON</button>
              {data.kind === 'site' && <button className="btn is-ghost is-sm" onClick={() => exportHtml(data)}>HTML</button>}
            </div>
          )}
        </div>
        {proj === undefined && <p className="acc-muted">Carregando modelo…</p>}
        {proj === null && <p className="acc-muted">Modelo não encontrado (o cliente pode ter apagado).</p>}
        {data?.kind === 'site' && (
          <div className="adm-preview"><div className="adm-preview-inner"><SiteRenderer project={data} device="desktop" no3d /></div></div>
        )}
        {data?.kind === 'system' && (
          <div className="adm-sys">
            <p><b>Tipo:</b> {data.system.type} · <b>Usuários:</b> {data.system.users}</p>
            {data.system.prompt && <p><b>Pedido do cliente:</b> “{data.system.prompt}”</p>}
            <div className="adm-chips">{data.system.modules.map((m) => <span key={m}>{MODULES[m]?.label || m}</span>)}</div>
            {data.system.answers && (
              <dl className="adm-answers">
                {Object.entries(data.system.answerLabels || {}).map(([k, v]) => (
                  <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
                ))}
              </dl>
            )}
          </div>
        )}
      </div>

      <div className="adm-block">
        <h3>Mensagem enviada</h3>
        <pre className="adm-msg">{q.message}</pre>
      </div>
    </aside>
  )
}

export default function Admin() {
  const { user, ready } = useAuth()
  const nav = useNavigate()
  const [tab, setTab] = useState('pedidos')
  const [list, setList] = useState([])
  const [projs, setProjs] = useState([])
  const [users, setUsers] = useState([])
  const [sel, setSel] = useState(null)
  const [filter, setFilter] = useState('todos')
  const [q, setQ] = useState('')

  useEffect(() => {
    document.title = 'Admin | Prime Page'
    if (ready && !user) nav('/entrar?next=/admin', { replace: true })
  }, [ready, user, nav])

  const load = async () => {
    setList(await quotes.all())
    setProjs(await projects.all())
    setUsers(await allUsers())
  }
  useEffect(() => {
    if (user?.isAdmin) load()
  }, [user?.isAdmin])

  const shown = useMemo(
    () => list.filter((x) => (filter === 'todos' || x.status === filter) && (!q || [x.name, x.contact_name, x.business, x.contact_email].join(' ').toLowerCase().includes(q.toLowerCase()))),
    [list, filter, q],
  )

  if (!ready) return null
  if (!user?.isAdmin)
    return (
      <div className="auth-page is-simple">
        <div className="acc-card">
          <h2>Acesso restrito</h2>
          <p>Esta área é só da equipe Prime Page.</p>
          <Link to="/" className="btn is-sm">Voltar ao site</Link>
        </div>
      </div>
    )

  const count = (s) => list.filter((x) => x.status === s).length
  const setStatus = async (id, status, note) => {
    await quotes.setStatus(id, status, note)
    const fresh = await quotes.all()
    setList(fresh)
    setSel(fresh.find((x) => x.id === id))
  }

  return (
    <div className="adm">
      <header className="adm-top">
        <Link to="/"><Logo height={24} /></Link>
        <span className="adm-badge">Painel admin{MODE === 'local' ? ' · modo demonstração' : ''}</span>
        <div className="adm-top-right">
          <button className="btn is-ghost is-sm" onClick={load}><Icon name="reset" size={14} /> Atualizar</button>
          <button className="btn is-ghost is-sm" onClick={async () => { await auth.signOut(); nav('/') }}>Sair</button>
        </div>
      </header>

      <main className="adm-main">
        <section className="adm-kpis">
          {[['novo', 'Novos'], ['em_analise', 'Em análise'], ['orcado', 'Orçados'], ['fechado', 'Fechados']].map(([k, l]) => (
            <button key={k} className={`adm-kpi ${filter === k ? 'is-on' : ''}`} onClick={() => setFilter(filter === k ? 'todos' : k)}>
              <b>{count(k)}</b><span>{l}</span>
            </button>
          ))}
          <div className="adm-kpi is-static"><b>{users.length}</b><span>Clientes cadastrados</span></div>
          <div className="adm-kpi is-static"><b>{projs.length}</b><span>Projetos montados</span></div>
        </section>

        <div className="acc-tabs">
          <button className={tab === 'pedidos' ? 'is-on' : ''} onClick={() => setTab('pedidos')}>Pedidos de orçamento</button>
          <button className={tab === 'projetos' ? 'is-on' : ''} onClick={() => setTab('projetos')}>Todos os projetos</button>
          <button className={tab === 'clientes' ? 'is-on' : ''} onClick={() => setTab('clientes')}>Clientes</button>
          <input className="field is-sm adm-search" placeholder="Buscar por nome, negócio ou e-mail" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>

        {tab === 'pedidos' && (
          <div className="adm-table-wrap">
            {shown.length === 0 ? (
              <p className="acc-muted">Nenhum pedido {filter !== 'todos' ? `com status "${STATUS[filter]}"` : 'ainda'}.</p>
            ) : (
              <table className="adm-table">
                <thead><tr><th>Data</th><th>Cliente</th><th>Projeto</th><th>Precisa de</th><th>Complexidade</th><th>Status</th></tr></thead>
                <tbody>
                  {shown.map((x) => (
                    <tr key={x.id} onClick={() => setSel(x)} className={sel?.id === x.id ? 'is-sel' : ''}>
                      <td>{new Date(x.created_at).toLocaleDateString('pt-BR')}</td>
                      <td><b>{x.contact_name}</b><small>{x.business}</small></td>
                      <td>{x.name}<small>{x.kind === 'site' ? 'Site' : 'Sistema'}</small></td>
                      <td className="adm-flagcell">{(x.flags || []).map((f) => <span key={f} title={FLAGS[f]?.label}><Icon name={FLAG_ICON[f]} size={14} /></span>)}</td>
                      <td>{x.complexity}</td>
                      <td><span className={`acc-status is-${x.status}`}>{STATUS[x.status]}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === 'projetos' && (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead><tr><th>Atualizado</th><th>Projeto</th><th>Tipo</th><th>Cliente</th><th /></tr></thead>
              <tbody>
                {projs.map((p) => (
                  <tr key={p.id}>
                    <td>{new Date(p.updated_at).toLocaleDateString('pt-BR')}</td>
                    <td><b>{p.name}</b></td>
                    <td>{p.kind === 'site' ? 'Site' : 'Sistema'}</td>
                    <td>{users.find((u) => u.id === p.user_id)?.name || '—'}</td>
                    <td><button className="btn is-sm" onClick={() => nav(`/construir?projeto=${p.id}`)}>Abrir</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'clientes' && (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead><tr><th>Nome</th><th>E-mail</th><th>Telefone</th><th>Projetos</th></tr></thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td><b>{u.name}</b></td>
                    <td>{u.email}</td>
                    <td>{u.phone}</td>
                    <td>{projs.filter((p) => p.user_id === u.id).length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {sel && <Detail q={sel} onClose={() => setSel(null)} onStatus={setStatus} />}
    </div>
  )
}
