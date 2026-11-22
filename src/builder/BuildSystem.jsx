import { useEffect, useMemo, useState } from 'react'
import Icon from '../components/Icon.jsx'
import { MODULES, SYSTEMS } from '../data/systems.js'
import { FLAGS, computeScope } from '../lib/scope.js'

const FLAG_ICON = { payments: 'pay', database: 'db', auth: 'lock', admin: 'panel', notifications: 'bell', integrations: 'plug', reports: 'chart', '3d': 'cube', mobile: 'phone' }

// Telas de exemplo por módulo: dados ilustrativos para o cliente entender o sistema.
const SAMPLE = {
  clientes: { cols: ['Cliente', 'Telefone', 'Última visita'], rows: [['Ana Souza', '(19) 9••••-1020', '12/11'], ['Carlos Lima', '(19) 9••••-3381', '08/11'], ['Marcos Reis', '(19) 9••••-7744', '02/11']] },
  agenda: { cols: ['Horário', 'Cliente', 'Serviço'], rows: [['09:00', 'Ana Souza', 'Consulta'], ['10:30', 'Pedro Alves', 'Retorno'], ['14:00', 'Livre', '—']] },
  estoque: { cols: ['Item', 'Qtd.', 'Mínimo'], rows: [['Óleo 5W30', '14', '10'], ['Filtro de ar', '3', '8'], ['Pastilha de freio', '22', '6']] },
  os: { cols: ['OS', 'Veículo', 'Status'], rows: [['#1042', 'Gol 2018', 'Em andamento'], ['#1041', 'HB20 2021', 'Aguardando peça'], ['#1040', 'Onix 2019', 'Pronto']] },
  financeiro: { cols: ['Data', 'Descrição', 'Valor'], rows: [['20/11', 'Recebimento OS #1039', '+ R$ 680'], ['19/11', 'Fornecedor peças', '− R$ 1.240'], ['18/11', 'Recebimento OS #1037', '+ R$ 420']] },
  pagamentos: { cols: ['Pedido', 'Forma', 'Status'], rows: [['#553', 'Pix', 'Pago'], ['#552', 'Cartão', 'Pago'], ['#551', 'Boleto', 'Pendente']] },
  nfe: { cols: ['Nota', 'Cliente', 'Situação'], rows: [['000.231', 'Ana Souza', 'Autorizada'], ['000.230', 'Carlos Lima', 'Autorizada'], ['000.229', 'Marcos Reis', 'Cancelada']] },
  relatorios: { chart: [42, 58, 51, 73, 66, 88, 79] },
  usuarios: { cols: ['Usuário', 'Função', 'Acesso'], rows: [['Bruno', 'Dono', 'Total'], ['Julia', 'Recepção', 'Cadastros'], ['Rafael', 'Mecânico', 'Ordens']] },
  portal: { cols: ['Etapa', 'Situação', ''], rows: [['Pedido recebido', 'Concluído', ''], ['Em produção', 'Agora', ''], ['Entrega', 'Previsto 25/11', '']] },
  whatsapp: { cols: ['Mensagem', 'Para', 'Envio'], rows: [['Lembrete de horário', 'Ana Souza', 'Amanhã 08:00'], ['Serviço pronto', 'Carlos Lima', 'Enviado'], ['Revisão vencendo', 'Marcos Reis', 'Enviado']] },
  frota: { cols: ['Veículo', 'Km', 'Próx. revisão'], rows: [['ABC-1D23', '84.210', '90.000'], ['EFG-4H56', '41.880', '45.000'], ['IJK-7L89', '120.400', 'Vencida']] },
  pedidos: { cols: ['Pedido', 'Itens', 'Status'], rows: [['#88', '2 pizzas', 'Saiu p/ entrega'], ['#87', '1 combo', 'Preparando'], ['#86', '3 lanches', 'Entregue']] },
  app: { phone: true },
}

function Screen({ id }) {
  const s = SAMPLE[id] || {}
  if (s.chart)
    return (
      <div className="sys-chart" aria-hidden="true">
        {s.chart.map((v, i) => <span key={i} style={{ height: v + '%' }}><i>{['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'][i]}</i></span>)}
      </div>
    )
  if (s.phone)
    return (
      <div className="sys-phone" aria-hidden="true">
        <div><b>Olá, Ana</b><span>Seu pedido está em produção</span><em /></div>
      </div>
    )
  return (
    <table className="sys-table">
      <thead><tr>{s.cols.map((c) => <th key={c}>{c}</th>)}</tr></thead>
      <tbody>{s.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
    </table>
  )
}

export default function BuildSystem({ state, dispatch, onNext }) {
  const sys = SYSTEMS.find((s) => s.id === state.system.type) || SYSTEMS[0]
  const mods = state.system.modules
  const [view, setView] = useState(mods[0])
  const [step, setStep] = useState(0)
  const scope = useMemo(() => computeScope(state), [state])
  const flow = sys.flow.filter((f) => mods.includes(f.module))

  useEffect(() => {
    if (!mods.includes(view)) setView(mods[0])
  }, [mods, view])

  useEffect(() => {
    if (!flow.length) return
    const t = setInterval(() => setStep((s) => (s + 1) % flow.length), 1800)
    return () => clearInterval(t)
  }, [flow.length])

  return (
    <div className="b-work is-system">
      <aside className="b-parts">
        <section>
          <h3 className="b-h">Tipo de sistema</h3>
          <select className="field is-sm" value={sys.id} onChange={(e) => dispatch({ type: 'load-system', id: e.target.value })}>
            {SYSTEMS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </section>
        <section>
          <h3 className="b-h">Módulos <span className="part-no">{mods.length} ligados</span></h3>
          <ul className="b-mods">
            {sys.modules.map((m) => (
              <li key={m}>
                <label className={mods.includes(m) ? 'is-on' : ''}>
                  <input type="checkbox" checked={mods.includes(m)} disabled={mods.includes(m) && mods.length === 1} onChange={() => dispatch({ type: 'module', id: m })} />
                  <span className="b-switch" aria-hidden="true" />
                  <span>
                    <b>{MODULES[m].label}</b>
                    <small>{MODULES[m].hint}</small>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      </aside>

      <main className="b-canvas">
        <div className="b-canvas-bar">
          <span className="b-badge">Dados ilustrativos</span>
          <div className="b-scope">
            {scope.flags.map((f) => <span key={f} className="b-flag"><Icon name={FLAG_ICON[f]} size={13} /> {FLAGS[f].short}</span>)}
          </div>
        </div>

        <div className="sys-app">
          <nav className="sys-nav">
            <strong>{state.name}</strong>
            {mods.map((m) => (
              <button key={m} className={view === m ? 'is-on' : ''} onClick={() => setView(m)}>{MODULES[m].label}</button>
            ))}
          </nav>
          <section className="sys-main">
            <header>
              <h2>{MODULES[view]?.label}</h2>
              <span className="sys-new"><Icon name="plus" size={14} /> Novo</span>
            </header>
            {view && <Screen id={view} />}
          </section>
        </div>

        {flow.length > 0 && (
          <div className="sys-flow">
            <h3>Como funcionaria no dia a dia</h3>
            <ol>
              {flow.map((f, i) => (
                <li key={i} className={i === step ? 'is-now' : i < step ? 'is-done' : ''} onClick={() => { setStep(i); setView(f.module) }}>
                  <b>{f.who}</b>
                  <span>{f.what}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </main>

      <aside className="b-inspector">
        <div className="b-piece">
          <div className="b-piece-head">
            <span className="part-no">KIT DE SISTEMA</span>
            <h3>{sys.name}</h3>
            <p>{sys.pitch}</p>
            {sys.proof && <p className="b-proof"><Icon name="check" size={14} /> {sys.proof}</p>}
          </div>
          <label className="b-field">
            <span className="b-label">Quantas pessoas vão usar?</span>
            <select className="field is-sm" value={state.system.users} onChange={(e) => dispatch({ type: 'system', patch: { users: e.target.value } })}>
              {['Só eu', '2 a 5', '6 a 20', 'Mais de 20'].map((o) => <option key={o}>{o}</option>)}
            </select>
          </label>
          <label className="b-field">
            <span className="b-label">O que mais o sistema precisa fazer?</span>
            <textarea className="field is-sm" rows="5" placeholder="Ex.: imprimir a ordem de serviço, controlar garantia das peças…" value={state.system.notes} onChange={(e) => dispatch({ type: 'system', patch: { notes: e.target.value } })} />
          </label>
          <button className="btn" onClick={onNext}>Pedir orçamento <Icon name="arrow" size={16} /></button>
        </div>
      </aside>
    </div>
  )
}
