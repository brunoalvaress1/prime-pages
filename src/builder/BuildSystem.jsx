import { useEffect, useMemo, useRef, useState } from 'react'
import Icon from '../components/Icon.jsx'
import SystemInterview from './SystemInterview.jsx'
import { MODULES, SYSTEMS } from '../data/systems.js'
import { ENTITY, domainById } from '../data/systemAI.js'
import { FLAGS, computeScope } from '../lib/scope.js'
import { readImage, onColor } from './SiteRenderer.jsx'

const FLAG_ICON = { payments: 'pay', database: 'db', auth: 'lock', admin: 'panel', notifications: 'bell', integrations: 'plug', reports: 'chart', '3d': 'cube', mobile: 'phone', storage: 'image' }
const MOD_ICON = { clientes: 'grid', agenda: 'bell', estoque: 'cube', os: 'text', financeiro: 'chart', pagamentos: 'pay', nfe: 'text', relatorios: 'chart', usuarios: 'lock', portal: 'phone', whatsapp: 'whatsapp', frota: 'system', pedidos: 'pay', app: 'phone', midia: 'image' }
const STAFF_HIDE = ['financeiro', 'relatorios', 'usuarios', 'nfe']
const GROUPS = [
  ['Operação', ['clientes', 'agenda', 'os', 'pedidos', 'estoque', 'frota']],
  ['Dinheiro', ['financeiro', 'pagamentos', 'nfe']],
  ['Comunicação e acesso', ['whatsapp', 'portal', 'app', 'usuarios']],
  ['Extras', ['relatorios', 'midia']],
]

const label = (d, m) => d.rename[m] || MODULES[m]?.label || m

// ---------------- telas do app ----------------
function Kpis({ kpis }) {
  return <div className="sa-kpis">{kpis.map(([k, v]) => <div key={k} className="sa-kpi"><span>{k}</span><b>{v}</b></div>)}</div>
}

function Chart() {
  const v = [42, 58, 51, 73, 66, 88, 79]
  return (
    <div className="sa-chart" aria-hidden="true">
      {v.map((x, i) => <span key={i} style={{ height: x + '%' }}><i>{['S', 'T', 'Q', 'Q', 'S', 'S', 'D'][i]}</i></span>)}
    </div>
  )
}

function Home({ sys, d, go, role }) {
  const list = (ENTITY.agenda.rows && sys.modules.includes('agenda') ? ENTITY.agenda.rows : ENTITY.os.rows).slice(0, 4)
  const main = sys.modules.find((m) => ['agenda', 'os', 'pedidos', 'clientes'].includes(m)) || sys.modules[0]
  return (
    <div className="sa-home">
      <div className="sa-hello">
        <div><h2>Bom dia{role === 'owner' ? ', dono' : ''}!</h2><p>Resumo de hoje · {d.label}</p></div>
        <button className="sa-btn" onClick={() => go(main, true)}><Icon name="plus" size={14} /> Novo em {label(d, main)}</button>
      </div>
      {role === 'owner' && <Kpis kpis={sys.kpis?.length ? sys.kpis : d.kpis} />}
      <div className="sa-split">
        {role === 'owner' && sys.modules.includes('relatorios') && <div className="sa-card"><h3>Movimento da semana</h3><Chart /></div>}
        <div className="sa-card">
          <h3>Próximos</h3>
          <ul className="sa-list">{list.map((r, i) => <li key={i} onClick={() => go(main)}><b>{r[2] || r[1]}</b><span>{r[0]} · {r[1]}</span></li>)}</ul>
        </div>
      </div>
    </div>
  )
}

function Table({ sys, d, mod, openNew, setOpenNew, flash }) {
  const ent = ENTITY[mod] || { fields: ['Nome', 'Detalhe', 'Status'], rows: [['Registro 1', '—', 'Ativo']] }
  const extra = d.extra[mod] || []
  const fields = [...ent.fields, ...extra]
  const [rows, setRows] = useState(() => ent.rows.map((r) => [...r, ...extra.map((_, i) => ['Particular', 'Unimed', 'Sim', 'Dr. Paulo', 'Turma A'][(r[0].length + i) % 5])]))
  const [form, setForm] = useState({})
  const [files, setFiles] = useState([])
  const [detail, setDetail] = useState(null)
  const [q, setQ] = useState('')
  const f = sys.features || {}
  const media = f.photos || f.videos || f.docs
  const input = useRef(null)
  const shown = rows.filter((r) => !q || r.join(' ').toLowerCase().includes(q.toLowerCase()))

  if (ent.chart) return <div className="sa-card"><h3>{label(d, mod)}</h3><Kpis kpis={sys.kpis?.length ? sys.kpis : d.kpis} /><Chart /></div>
  if (ent.gallery)
    return (
      <div className="sa-card">
        <div className="sa-head"><h3>{label(d, mod)}</h3><button className="sa-btn" onClick={() => input.current.click()}><Icon name="upload" size={14} /> Enviar</button></div>
        <input ref={input} type="file" hidden multiple accept="image/*,video/*,.pdf" onChange={async (e) => { const out = []; for (const fl of e.target.files) out.push(fl.type.startsWith('image/') ? { type: 'img', src: await readImage(fl), name: fl.name } : { type: fl.type.startsWith('video/') ? 'video' : 'doc', name: fl.name }); setFiles((x) => [...out, ...x]) }} />
        <div className="sa-gallery">
          {files.map((x, i) => <div key={i}>{x.type === 'img' ? <img src={x.src} alt="" /> : <span><Icon name={x.type === 'video' ? 'eye' : 'text'} /> {x.name}</span>}</div>)}
          {['Antes', 'Depois', 'Vistoria', 'Contrato.pdf', 'Vídeo do serviço', 'Laudo.pdf'].map((n, i) => <div key={n} className="is-ph"><Icon name={n.endsWith('.pdf') ? 'text' : i === 4 ? 'eye' : 'image'} /><small>{n}</small></div>)}
        </div>
      </div>
    )

  return (
    <div className="sa-card">
      <div className="sa-head">
        <h3>{label(d, mod)}</h3>
        <input className="sa-search" placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="sa-btn" onClick={() => setOpenNew(true)}><Icon name="plus" size={14} /> Novo</button>
      </div>
      <div className="sa-table-wrap">
        <table className="sa-table">
          <thead><tr>{fields.map((x) => <th key={x}>{x}</th>)}</tr></thead>
          <tbody>{shown.map((r, i) => <tr key={i} onClick={() => setDetail(r)}>{r.map((c, j) => <td key={j}>{/Pago|Concluído|Autorizada|Entregue|Total|Enviado/.test(c) ? <em className="sa-tag is-ok">{c}</em> : /Pendente|Aguardando|Vencida|Cancelada/.test(c) ? <em className="sa-tag is-warn">{c}</em> : c}</td>)}</tr>)}</tbody>
        </table>
      </div>

      {openNew && (
        <div className="sa-drawer" role="dialog" aria-label="Novo registro">
          <div className="sa-drawer-head"><h3>Novo em {label(d, mod)}</h3><button onClick={() => setOpenNew(false)} aria-label="Fechar"><Icon name="x" size={16} /></button></div>
          {fields.map((x) => <label key={x} className="sa-field"><span>{x}</span><input value={form[x] || ''} onChange={(e) => setForm({ ...form, [x]: e.target.value })} /></label>)}
          {media && (
            <div className="sa-field">
              <span>Anexos {[f.photos && 'fotos', f.videos && 'vídeos', f.docs && 'documentos'].filter(Boolean).join(', ')}</span>
              <button className="sa-drop" onClick={() => input.current.click()}><Icon name="upload" /> Arraste ou clique para enviar</button>
              <input ref={input} type="file" hidden multiple onChange={(e) => setFiles([...e.target.files].map((x) => ({ name: x.name })))} />
              {files.map((x, i) => <small key={i} className="sa-file"><Icon name="check" size={12} /> {x.name}</small>)}
            </div>
          )}
          <button className="sa-btn is-lg" onClick={() => { setRows([fields.map((x) => form[x] || '—'), ...rows]); setForm({}); setFiles([]); setOpenNew(false); flash('Registro salvo') }}>Salvar</button>
        </div>
      )}
      {detail && (
        <div className="sa-drawer" role="dialog" aria-label="Detalhes">
          <div className="sa-drawer-head"><h3>{detail[0]}</h3><button onClick={() => setDetail(null)} aria-label="Fechar"><Icon name="x" size={16} /></button></div>
          <dl className="sa-dl">{fields.map((x, i) => <div key={x}><dt>{x}</dt><dd>{detail[i]}</dd></div>)}</dl>
          {media && <div className="sa-thumbs">{[0, 1, 2].map((i) => <span key={i}><Icon name={i === 2 && f.videos ? 'eye' : 'image'} /></span>)}</div>}
          <h4>Histórico</h4>
          <ol className="sa-timeline"><li>Criado por Julia · 18/11 09:12</li><li>Atualizado por Rafael · 19/11 14:40</li>{sys.modules.includes('whatsapp') && <li>Aviso enviado no WhatsApp · 19/11 14:41</li>}</ol>
        </div>
      )}
    </div>
  )
}

function Portal({ sys, d }) {
  const b = sys.brand || {}
  return (
    <div className="sa-portal">
      <div className="sa-portal-top">{b.logo ? <img src={b.logo} alt="" /> : <b>{b.name || 'Seu sistema'}</b>}</div>
      <h2>Olá, Ana!</h2>
      <div className="sa-portal-card is-accent">
        <small>{sys.modules.includes('agenda') ? 'Próximo horário' : 'Seu pedido'}</small>
        <b>{sys.modules.includes('agenda') ? 'Amanhã, 14:00' : '#1042 · Em andamento'}</b>
        <span>{sys.modules.includes('agenda') ? label(d, 'agenda') : 'Previsão: hoje às 17h'}</span>
      </div>
      <div className="sa-portal-actions">
        {sys.modules.includes('agenda') && <button><Icon name="plus" size={16} /> Agendar</button>}
        {sys.modules.includes('pagamentos') && <button><Icon name="pay" size={16} /> Pagar</button>}
        <button><Icon name="text" size={16} /> Histórico</button>
        {sys.features?.docs && <button><Icon name="upload" size={16} /> Documentos</button>}
      </div>
      <div className="sa-portal-card"><small>Avisos</small><span>Seu atendimento foi confirmado. Até breve!</span></div>
    </div>
  )
}

function SysApp({ sys, d, role, device, flash }) {
  const b = sys.brand || {}
  const visible = sys.modules.filter((m) => m !== 'app' && (role === 'owner' || !STAFF_HIDE.includes(m)))
  const [view, setView] = useState('home')
  const [openNew, setOpenNew] = useState(false)
  useEffect(() => { if (view !== 'home' && !visible.includes(view)) setView('home') }, [visible, view])
  const go = (m, isNew) => { setView(m); setOpenNew(!!isNew) }
  const accent = b.color || '#1f6fff'
  const style = { '--sa-accent': accent, '--sa-on': onColor(accent) }

  if (role === 'client')
    return <div className={`sa is-${b.theme || 'light'} is-client is-${device}`} style={style}><Portal sys={sys} d={d} /></div>

  return (
    <div className={`sa is-${b.theme || 'light'} menu-${b.menu || 'side'} is-${device}`} style={style}>
      <nav className="sa-nav">
        <div className="sa-brand">{b.logo ? <img src={b.logo} alt="" /> : <span className="sa-mark">{(b.name || 'S').slice(0, 1)}</span>}<b>{b.name || 'Seu sistema'}</b></div>
        <button className={view === 'home' ? 'is-on' : ''} onClick={() => go('home')}><Icon name="grid" size={15} /> Início</button>
        {visible.map((m) => <button key={m} className={view === m ? 'is-on' : ''} onClick={() => go(m)}><Icon name={MOD_ICON[m] || 'grid'} size={15} /> {label(d, m)}</button>)}
      </nav>
      <main className="sa-main">
        <header className="sa-top">
          <span>{view === 'home' ? 'Início' : label(d, view)}</span>
          {sys.features?.multi && <select aria-label="Unidade"><option>Unidade Centro</option><option>Unidade 2</option><option>Todas</option></select>}
          <span className="sa-avatar">{role === 'owner' ? 'D' : 'J'}</span>
        </header>
        <div className="sa-body">
          {view === 'home' ? <Home sys={sys} d={d} go={go} role={role} /> : (view === 'portal' ? <Portal sys={sys} d={d} /> : <Table key={view} sys={sys} d={d} mod={view} openNew={openNew} setOpenNew={setOpenNew} flash={flash} />)}
        </div>
      </main>
    </div>
  )
}

// ---------------- fluxo e estrutura ----------------
function Flow({ sys, d }) {
  const steps = (d.flow || []).filter(([, , m]) => sys.modules.includes(m) || m === 'clientes')
  const actors = [...new Set(steps.map((s) => s[0]))]
  const [at, setAt] = useState(0)
  const [play, setPlay] = useState(true)
  useEffect(() => {
    if (!play || !steps.length) return
    const t = setInterval(() => setAt((x) => (x + 1) % steps.length), 1600)
    return () => clearInterval(t)
  }, [play, steps.length])
  if (!steps.length) return <p className="b-empty">Ligue módulos para ver o fluxo.</p>
  return (
    <div className="sf">
      <div className="sf-bar"><h3>Como o sistema funciona no dia a dia</h3><button className="b-add" onClick={() => setPlay(!play)}>{play ? 'Pausar' : 'Reproduzir'}</button></div>
      <div className="sf-lanes" style={{ gridTemplateColumns: `140px repeat(${steps.length}, minmax(130px, 1fr))` }}>
        {actors.map((a) => (
          <div key={a} className="sf-lane" style={{ display: 'contents' }}>
            <div className="sf-actor">{a}</div>
            {steps.map((s, i) => (
              <div key={i} className="sf-cell">
                {s[0] === a && (
                  <button className={`sf-step ${i === at ? 'is-now' : i < at ? 'is-done' : ''}`} onClick={() => { setAt(i); setPlay(false) }}>
                    <span className="part-no">{i + 1}</span>
                    <b>{s[1]}</b>
                    <small>{label(d, s[2])}</small>
                  </button>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function DataModel({ sys, d }) {
  const ents = sys.modules.filter((m) => ENTITY[m]?.fields)
  const rel = { agenda: 'clientes', os: 'clientes', pedidos: 'clientes', pagamentos: 'pedidos', financeiro: 'pagamentos', nfe: 'pedidos', whatsapp: 'clientes', estoque: 'os' }
  return (
    <div className="sd">
      <h3>Estrutura de dados</h3>
      <p className="b-hint">O que o sistema guarda e como as informações se ligam. É a base que a equipe usa para desenvolver.</p>
      <div className="sd-grid">
        {ents.map((m) => (
          <div key={m} className="sd-card">
            <b><Icon name={MOD_ICON[m]} size={14} /> {label(d, m)}</b>
            <ul>{['id', ...ENTITY[m].fields, ...(d.extra[m] || [])].map((f) => <li key={f}>{f}</li>)}{sys.features?.photos && ['clientes', 'os'].includes(m) && <li className="is-media">fotos[]</li>}</ul>
            {rel[m] && sys.modules.includes(rel[m]) && <small>pertence a <b>{label(d, rel[m])}</b></small>}
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------- estúdio ----------------
export default function BuildSystem({ state, dispatch, onNext }) {
  const sys = state.system
  const d = domainById(sys.type)
  const scope = useMemo(() => computeScope(state), [state])
  const [tab, setTab] = useState('app')
  const [role, setRole] = useState('owner')
  const [toast, setToast] = useState('')
  const logo = useRef(null)
  const setSys = (patch) => dispatch({ type: 'system', patch })
  const setBrand = (patch) => setSys({ brand: { ...(sys.brand || {}), ...patch } })
  const flash = (t) => { setToast(t); setTimeout(() => setToast(''), 2000) }

  if (sys.stage === 'interview')
    return (
      <div className="ai-wrap">
        <SystemInterview
          initialText={sys.prompt || ''}
          onFinish={(r) => {
            dispatch({ type: 'system', patch: { ...r, stage: 'studio' } })
            dispatch({ type: 'set', patch: { name: r.brand?.name || `Sistema de ${domainById(r.type).label.toLowerCase()}` } })
          }}
        />
      </div>
    )

  const toggle = (m) => dispatch({ type: 'module', id: m })

  return (
    <div className="b-work is-system">
      <aside className="b-parts">
        <section>
          <h3 className="b-h">Ramo</h3>
          <p className="ss-domain"><Icon name="spark" size={14} /> {d.label}</p>
          <button className="b-add" onClick={() => setSys({ stage: 'interview' })}><Icon name="text" size={14} /> Refazer as perguntas</button>
        </section>
        <section>
          <h3 className="b-h">Módulos <span className="part-no">{sys.modules.length} ligados</span></h3>
          {GROUPS.map(([g, list]) => (
            <div key={g} className="b-group">
              <span className="b-group-label">{g}</span>
              <ul className="b-mods">
                {list.map((m) => (
                  <li key={m}>
                    <label className={sys.modules.includes(m) ? 'is-on' : ''}>
                      <input type="checkbox" checked={sys.modules.includes(m)} disabled={sys.modules.includes(m) && sys.modules.length === 1} onChange={() => toggle(m)} />
                      <span className="b-switch" aria-hidden="true" />
                      <span><b>{label(d, m)}</b><small>{MODULES[m].hint}</small></span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
        {sys.answerLabels && Object.keys(sys.answerLabels).length > 0 && (
          <section>
            <h3 className="b-h">O que você respondeu</h3>
            <dl className="ss-answers">{Object.entries(sys.answerLabels).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
          </section>
        )}
      </aside>

      <main className="b-canvas">
        <div className="b-canvas-bar">
          <div className="b-seg is-dark" role="tablist">
            {[['app', 'Telas', 'desktop'], ['flow', 'Como funciona', 'spark'], ['data', 'Dados', 'db'], ['mobile', 'Celular', 'mobile']].map(([k, l, ic]) => (
              <button key={k} className={tab === k ? 'is-on' : ''} onClick={() => setTab(k)}><Icon name={ic} size={15} /> {l}</button>
            ))}
          </div>
          {(tab === 'app' || tab === 'mobile') && (
            <div className="b-seg is-dark" aria-label="Ver como">
              {[['owner', 'Dono'], ['staff', 'Funcionário'], ...(sys.modules.includes('portal') || sys.modules.includes('app') ? [['client', 'Cliente']] : [])].map(([k, l]) => (
                <button key={k} className={role === k ? 'is-on' : ''} onClick={() => setRole(k)}>{l}</button>
              ))}
            </div>
          )}
          <div className="b-scope">
            {scope.flags.map((f) => <span key={f} className="b-flag"><Icon name={FLAG_ICON[f]} size={13} /> {FLAGS[f].short}</span>)}
          </div>
        </div>
        <div className="ss-stage">
          {tab === 'app' && <SysApp sys={sys} d={d} role={role} device="desktop" flash={flash} />}
          {tab === 'mobile' && <div className="ss-phone"><SysApp sys={sys} d={d} role={role} device="mobile" flash={flash} /></div>}
          {tab === 'flow' && <Flow sys={sys} d={d} />}
          {tab === 'data' && <DataModel sys={sys} d={d} />}
          <p className="ss-note">Dados ilustrativos. Clique nos menus, em “Novo” e nas linhas para ver o sistema funcionando.</p>
        </div>
        {toast && <div className="pv-toast"><Icon name="check" size={16} /> {toast}</div>}
      </main>

      <aside className="b-inspector">
        <div className="b-piece">
          <div className="b-piece-head">
            <span className="part-no">PERSONALIZAR</span>
            <h3>{sys.brand?.name || state.name}</h3>
            <p>{SYSTEMS.find((s) => s.id === sys.type)?.proof || 'Do seu jeito, com a sua marca.'}</p>
          </div>
          <label className="b-field"><span className="b-label">Nome do sistema</span><input className="field is-sm" value={sys.brand?.name || ''} onChange={(e) => { setBrand({ name: e.target.value }); dispatch({ type: 'set', patch: { name: e.target.value || state.name } }) }} /></label>
          <div className="b-field">
            <span className="b-label">Logo</span>
            <div className="ss-logo">{sys.brand?.logo ? <img src={sys.brand.logo} alt="" /> : <Icon name="image" />}<button className="b-add" onClick={() => logo.current.click()}><Icon name="upload" size={14} /> {sys.brand?.logo ? 'Trocar' : 'Enviar'}</button>{sys.brand?.logo && <button className="b-link" onClick={() => setBrand({ logo: '' })}>remover</button>}</div>
            <input ref={logo} type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) try { setBrand({ logo: await readImage(f) }) } catch (err) { alert(err.message) } }} />
          </div>
          <label className="b-field is-row"><span className="b-label">Cor da marca</span><span className="b-color"><input type="color" value={sys.brand?.color || '#1f6fff'} onChange={(e) => setBrand({ color: e.target.value })} /><code>{sys.brand?.color || '#1f6fff'}</code></span></label>
          <div className="b-field"><span className="b-label">Tema</span><div className="b-seg">{[['light', 'Claro'], ['dark', 'Escuro']].map(([k, l]) => <button key={k} className={(sys.brand?.theme || 'light') === k ? 'is-on' : ''} onClick={() => setBrand({ theme: k })}>{l}</button>)}</div></div>
          <div className="b-field"><span className="b-label">Menu</span><div className="b-seg">{[['side', 'Lateral'], ['top', 'No topo']].map(([k, l]) => <button key={k} className={(sys.brand?.menu || 'side') === k ? 'is-on' : ''} onClick={() => setBrand({ menu: k })}>{l}</button>)}</div></div>
          <div className="b-field b-style">
            <span className="b-label">Recursos</span>
            {[['photos', 'Guardar fotos'], ['videos', 'Guardar vídeos'], ['docs', 'Guardar documentos'], ['multi', 'Mais de uma unidade']].map(([k, l]) => (
              <label key={k} className="r-check is-sm"><input type="checkbox" checked={!!sys.features?.[k]} onChange={(e) => { const features = { ...(sys.features || {}), [k]: e.target.checked }; const media = features.photos || features.videos || features.docs; setSys({ features, modules: media ? [...new Set([...sys.modules, 'midia'])] : sys.modules.filter((m) => m !== 'midia') }) }} /> {l}</label>
            ))}
          </div>
          <label className="b-field">
            <span className="b-label">Quantas pessoas vão usar?</span>
            <select className="field is-sm" value={sys.users} onChange={(e) => setSys({ users: e.target.value })}>{['Só eu', '2 a 5', '6 a 20', 'Mais de 20'].map((o) => <option key={o}>{o}</option>)}</select>
          </label>
          <label className="b-field">
            <span className="b-label">O que mais precisa?</span>
            <textarea className="field is-sm" rows="4" placeholder="Ex.: imprimir a ordem de serviço, controlar garantia das peças…" value={sys.notes} onChange={(e) => setSys({ notes: e.target.value })} />
          </label>
          <button className="btn" onClick={onNext}>Pedir orçamento <Icon name="arrow" size={16} /></button>
        </div>
      </aside>
    </div>
  )
}
