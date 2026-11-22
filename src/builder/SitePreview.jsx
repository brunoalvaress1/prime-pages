import { useEffect, useMemo, useRef, useState } from 'react'
import Icon from '../components/Icon.jsx'
import SiteRenderer from './SiteRenderer.jsx'
import { imageCss } from './imageStyle.js'

// "Testar site": o cliente navega pelo site montado como se ele estivesse no ar.
// Cada botão leva a uma tela real do fluxo (produto, carrinho, checkout, agenda, login, área do cliente…).

const money = (n) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const parsePrice = (s) => {
  const n = parseFloat(String(s || '').replace(/[^\d,]/g, '').replace(',', '.'))
  return Number.isFinite(n) && n > 0 ? n : 0
}
const slug = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

function Pic({ block, path, src, className = '' }) {
  const st = block?.props.media?.[path]
  const css = imageCss(st)
  return (
    <div className={`cs-img ${className} ${src ? '' : 'is-empty'}`} style={css.frame}>
      <div className="cs-img-clip" style={css.clip}>
        {src ? <img src={src} alt="" style={css.img} /> : <span className="cs-img-ph"><Icon name="image" /></span>}
      </div>
    </div>
  )
}

function Steps({ list, at }) {
  return (
    <ol className="pv-steps">
      {list.map((s, i) => <li key={s} className={i === at ? 'is-on' : i < at ? 'is-done' : ''}><span>{i < at ? <Icon name="check" size={12} /> : i + 1}</span>{s}</li>)}
    </ol>
  )
}

// ---------------- telas ----------------
function ProductPage({ block, i, go, addToCart }) {
  const it = block.props.items[i]
  const [size, setSize] = useState('M')
  const [qty, setQty] = useState(1)
  const others = block.props.items.map((x, j) => ({ ...x, j })).filter((x) => x.j !== i).slice(0, 3)
  return (
    <section className="pv-wrap">
      <button className="pv-back" onClick={() => go('home')}><Icon name="back" size={14} /> Voltar à loja</button>
      <div className="pv-product">
        <Pic block={block} path={`items.${i}.image`} src={it.image} className="pv-product-img" />
        <div className="pv-product-info">
          <span className="cs-kicker">Coleção atual</span>
          <h1 className="cs-h2">{it.title}</h1>
          <strong className="pv-price">{it.price}</strong>
          <small className="pv-muted">ou 6x de {money(parsePrice(it.price) / 6)} sem juros</small>
          <div className="pv-opt">
            <span>Tamanho</span>
            <div className="pv-chips">{['PP', 'P', 'M', 'G', 'GG'].map((s) => <button key={s} className={size === s ? 'is-on' : ''} onClick={() => setSize(s)}>{s}</button>)}</div>
          </div>
          <div className="pv-opt">
            <span>Quantidade</span>
            <div className="pv-qty"><button onClick={() => setQty(Math.max(1, qty - 1))}>−</button><b>{qty}</b><button onClick={() => setQty(qty + 1)}>+</button></div>
          </div>
          <div className="cs-btns">
            <button className="cs-btn" onClick={() => { addToCart({ title: it.title, price: parsePrice(it.price), image: it.image, size, qty }); go('cart') }}>Comprar agora</button>
            <button className="cs-btn is-ghost" onClick={() => addToCart({ title: it.title, price: parsePrice(it.price), image: it.image, size, qty })}>Adicionar ao carrinho</button>
          </div>
          <ul className="pv-perks"><li><Icon name="check" size={14} /> Frete grátis acima de R$ 299</li><li><Icon name="check" size={14} /> Troca em até 30 dias</li><li><Icon name="check" size={14} /> Pagamento seguro</li></ul>
        </div>
      </div>
      {others.length > 0 && (
        <>
          <h2 className="cs-h3 pv-related-t">Você também pode gostar</h2>
          <div className="cs-grid">
            {others.map((x) => (
              <article key={x.j} className="cs-card" data-live="" onClick={() => go('product', { blockId: block.id, i: x.j })}>
                <Pic block={block} path={`items.${x.j}.image`} src={x.image} />
                <h3 className="cs-h3">{x.title}</h3>
                <strong className="cs-price">{x.price}</strong>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  )
}

function CartPage({ cart, setCart, go }) {
  const [cep, setCep] = useState('')
  const sub = cart.reduce((s, x) => s + x.price * x.qty, 0)
  const frete = cep.replace(/\D/g, '').length === 8 ? (sub >= 299 ? 0 : 19.9) : null
  if (!cart.length)
    return (
      <section className="pv-wrap pv-center">
        <Icon name="pay" size={40} />
        <h1 className="cs-h2">Seu carrinho está vazio</h1>
        <button className="cs-btn" onClick={() => go('home')}>Continuar comprando</button>
      </section>
    )
  return (
    <section className="pv-wrap">
      <h1 className="cs-h2">Carrinho</h1>
      <div className="pv-cart">
        <ul className="pv-lines">
          {cart.map((x, k) => (
            <li key={k}>
              <div className="pv-thumb">{x.image ? <img src={x.image} alt="" /> : <Icon name="image" />}</div>
              <div><b>{x.title}</b><small className="pv-muted">{x.size ? `Tamanho ${x.size}` : x.note || ''}</small></div>
              <div className="pv-qty"><button onClick={() => setCart(cart.map((y, j) => (j === k ? { ...y, qty: Math.max(1, y.qty - 1) } : y)))}>−</button><b>{x.qty}</b><button onClick={() => setCart(cart.map((y, j) => (j === k ? { ...y, qty: y.qty + 1 } : y)))}>+</button></div>
              <strong>{money(x.price * x.qty)}</strong>
              <button className="pv-x" aria-label="Remover" onClick={() => setCart(cart.filter((_, j) => j !== k))}><Icon name="x" size={14} /></button>
            </li>
          ))}
        </ul>
        <aside className="pv-summary">
          <h3 className="cs-h3">Resumo</h3>
          <label className="pv-field"><span>Calcular frete</span><input placeholder="CEP 00000-000" value={cep} onChange={(e) => setCep(e.target.value)} /></label>
          <p><span>Subtotal</span><b>{money(sub)}</b></p>
          <p><span>Frete</span><b>{frete === null ? '—' : frete === 0 ? 'Grátis' : money(frete)}</b></p>
          <p className="pv-total"><span>Total</span><b>{money(sub + (frete || 0))}</b></p>
          <button className="cs-btn" onClick={() => go('checkout')}>Finalizar compra</button>
          <button className="pv-link" onClick={() => go('home')}>Continuar comprando</button>
        </aside>
      </div>
    </section>
  )
}

function CheckoutPage({ cart, signedIn, setSignedIn, go, placeOrder }) {
  const [step, setStep] = useState(signedIn ? 1 : 0)
  const [pay, setPay] = useState('pix')
  const sub = cart.reduce((s, x) => s + x.price * x.qty, 0)
  return (
    <section className="pv-wrap">
      <h1 className="cs-h2">Finalizar compra</h1>
      <Steps list={['Identificação', 'Entrega', 'Pagamento']} at={step} />
      <div className="pv-cart">
        <div className="pv-panel">
          {step === 0 && (
            <div className="pv-form">
              <h3 className="cs-h3">Entre ou continue como convidado</h3>
              <label className="pv-field"><span>E-mail</span><input placeholder="voce@email.com" /></label>
              <label className="pv-field"><span>Senha</span><input type="password" placeholder="••••••" /></label>
              <div className="cs-btns"><button className="cs-btn" onClick={() => { setSignedIn(true); setStep(1) }}>Entrar e continuar</button><button className="cs-btn is-ghost" onClick={() => setStep(1)}>Comprar como convidado</button></div>
            </div>
          )}
          {step === 1 && (
            <div className="pv-form">
              <h3 className="cs-h3">Endereço de entrega</h3>
              <div className="pv-row"><label className="pv-field"><span>CEP</span><input placeholder="13610-000" /></label><label className="pv-field"><span>Número</span><input placeholder="123" /></label></div>
              <label className="pv-field"><span>Rua</span><input placeholder="Rua Exemplo" /></label>
              <div className="pv-row"><label className="pv-field"><span>Bairro</span><input placeholder="Centro" /></label><label className="pv-field"><span>Cidade</span><input defaultValue="Leme - SP" /></label></div>
              <label className="pv-radio"><input type="radio" name="ent" defaultChecked /> Entrega padrão · 3 a 5 dias úteis</label>
              <label className="pv-radio"><input type="radio" name="ent" /> Retirar na loja · grátis</label>
              <button className="cs-btn" onClick={() => setStep(2)}>Continuar para pagamento</button>
            </div>
          )}
          {step === 2 && (
            <div className="pv-form">
              <h3 className="cs-h3">Pagamento</h3>
              <div className="pv-tabs">{[['pix', 'Pix'], ['card', 'Cartão'], ['boleto', 'Boleto']].map(([k, l]) => <button key={k} className={pay === k ? 'is-on' : ''} onClick={() => setPay(k)}>{l}</button>)}</div>
              {pay === 'pix' && <p className="pv-muted">O QR Code e o código copia-e-cola aparecem na próxima tela. Aprovação na hora.</p>}
              {pay === 'card' && (
                <>
                  <label className="pv-field"><span>Número do cartão</span><input placeholder="0000 0000 0000 0000" /></label>
                  <div className="pv-row"><label className="pv-field"><span>Validade</span><input placeholder="MM/AA" /></label><label className="pv-field"><span>CVV</span><input placeholder="000" /></label></div>
                  <label className="pv-field"><span>Parcelas</span><select>{[1, 2, 3, 4, 5, 6].map((n) => <option key={n}>{n}x de {money(sub / n)}</option>)}</select></label>
                </>
              )}
              {pay === 'boleto' && <p className="pv-muted">O boleto vence em 2 dias úteis. O pedido é liberado após a compensação.</p>}
              <button className="cs-btn" onClick={() => placeOrder(pay)}>Confirmar pedido · {money(sub)}</button>
            </div>
          )}
        </div>
        <aside className="pv-summary">
          <h3 className="cs-h3">Seu pedido</h3>
          {cart.map((x, k) => <p key={k}><span>{x.qty}× {x.title}</span><b>{money(x.price * x.qty)}</b></p>)}
          <p className="pv-total"><span>Total</span><b>{money(sub)}</b></p>
        </aside>
      </div>
    </section>
  )
}

function OrderDone({ order, go }) {
  return (
    <section className="pv-wrap pv-center">
      <span className="pv-ok"><Icon name="check" size={30} /></span>
      <h1 className="cs-h2">Pedido #{order.id} confirmado!</h1>
      <p className="cs-p">Enviamos os detalhes para o seu e-mail e WhatsApp.</p>
      {order.pay === 'pix' && (
        <div className="pv-pix">
          <div className="pv-qr" aria-hidden="true">{Array.from({ length: 81 }, (_, k) => <i key={k} className={((k * 2654435761 + order.id * 40503) >>> 7) % 5 < 2 || [0, 1, 7, 8, 9, 10, 16, 17, 63, 64, 72, 73].includes(k) ? 'on' : ''} />)}</div>
          <div><b>Pague com Pix</b><code>00020126580014br.gov.bcb.pix0136exemplo-de-codigo-pix</code><button className="cs-btn is-small">Copiar código</button></div>
        </div>
      )}
      <ol className="pv-track"><li className="is-done">Pedido recebido</li><li className={order.pay === 'card' ? 'is-done' : ''}>Pagamento aprovado</li><li>Separando</li><li>A caminho</li></ol>
      <div className="cs-btns"><button className="cs-btn" onClick={() => go('account')}>Acompanhar meus pedidos</button><button className="cs-btn is-ghost" onClick={() => go('home')}>Voltar ao início</button></div>
    </section>
  )
}

function BookingPage({ project, preset, go, signedIn, setSignedIn, addBooking }) {
  const services = project.blocks.find((b) => b.type === 'services')?.props.items.map((x) => x.title) || ['Atendimento', 'Avaliação', 'Retorno']
  const team = project.blocks.find((b) => b.type === 'team')?.props.items.map((x) => x.title) || []
  const [step, setStep] = useState(preset ? 1 : 0)
  const [sel, setSel] = useState({ service: services[0], pro: team[0] || 'Sem preferência', day: preset?.day || '', hour: preset?.hour || '' })
  const days = ['Seg 24', 'Ter 25', 'Qua 26', 'Qui 27', 'Sex 28', 'Sáb 29']
  const hours = ['09:00', '09:30', '10:30', '11:00', '14:00', '15:30', '16:30', '17:00']
  return (
    <section className="pv-wrap">
      <h1 className="cs-h2">Agendar horário</h1>
      <Steps list={['Serviço', 'Data e horário', 'Seus dados', 'Confirmado']} at={step} />
      {step === 0 && (
        <div className="pv-panel">
          <div className="pv-pick">{services.map((s) => <button key={s} className={sel.service === s ? 'is-on' : ''} onClick={() => setSel({ ...sel, service: s })}><b>{s}</b><small>Duração aprox. 45 min</small></button>)}</div>
          {team.length > 0 && (<><h3 className="cs-h3 pv-sub">Profissional</h3><div className="pv-chips">{['Sem preferência', ...team].map((t) => <button key={t} className={sel.pro === t ? 'is-on' : ''} onClick={() => setSel({ ...sel, pro: t })}>{t}</button>)}</div></>)}
          <button className="cs-btn" onClick={() => setStep(1)}>Escolher horário</button>
        </div>
      )}
      {step === 1 && (
        <div className="pv-panel">
          <div className="pv-days">{days.map((d) => <button key={d} className={sel.day.startsWith(d.slice(0, 3)) ? 'is-on' : ''} onClick={() => setSel({ ...sel, day: d })}>{d}</button>)}</div>
          <div className="pv-hours">{hours.map((h, k) => <button key={h} disabled={k % 3 === 1} className={sel.hour === h ? 'is-on' : ''} onClick={() => setSel({ ...sel, hour: h })}>{h}</button>)}</div>
          <button className="cs-btn" disabled={!sel.day || !sel.hour} onClick={() => setStep(2)}>Continuar</button>
        </div>
      )}
      {step === 2 && (
        <div className="pv-panel pv-form">
          {!signedIn && <p className="pv-muted">Já tem conta? <button className="pv-link" onClick={() => setSignedIn(true)}>Entrar</button></p>}
          <label className="pv-field"><span>Nome</span><input placeholder="Seu nome" /></label>
          <label className="pv-field"><span>WhatsApp</span><input placeholder="(19) 9 0000-0000" /></label>
          <p className="pv-muted">{sel.service} · {sel.pro} · {sel.day} às {sel.hour}</p>
          <button className="cs-btn" onClick={() => { addBooking(sel); setStep(3) }}>Confirmar agendamento</button>
        </div>
      )}
      {step === 3 && (
        <div className="pv-panel pv-center">
          <span className="pv-ok"><Icon name="check" size={30} /></span>
          <h2 className="cs-h3">Agendado: {sel.day} às {sel.hour}</h2>
          <p className="cs-p">{sel.service} com {sel.pro}. Você recebe um lembrete no WhatsApp um dia antes.</p>
          <div className="cs-btns"><button className="cs-btn" onClick={() => go('account')}>Ver meus agendamentos</button><button className="cs-btn is-ghost" onClick={() => go('home')}>Voltar ao início</button></div>
        </div>
      )}
    </section>
  )
}

function LoginPage({ go, setSignedIn }) {
  const [mode, setMode] = useState('login')
  return (
    <section className="pv-wrap pv-narrow">
      <h1 className="cs-h2">{mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Criar conta' : 'Recuperar senha'}</h1>
      <div className="pv-panel pv-form">
        {mode === 'signup' && <label className="pv-field"><span>Nome</span><input /></label>}
        <label className="pv-field"><span>E-mail</span><input placeholder="voce@email.com" /></label>
        {mode !== 'forgot' && <label className="pv-field"><span>Senha</span><input type="password" /></label>}
        <button className="cs-btn" onClick={() => (mode === 'forgot' ? setMode('login') : (setSignedIn(true), go('account')))}>{mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Criar conta' : 'Enviar código'}</button>
        <div className="pv-links">
          {mode !== 'login' && <button className="pv-link" onClick={() => setMode('login')}>Já tenho conta</button>}
          {mode !== 'signup' && <button className="pv-link" onClick={() => setMode('signup')}>Criar conta</button>}
          {mode === 'login' && <button className="pv-link" onClick={() => setMode('forgot')}>Esqueci a senha</button>}
        </div>
      </div>
    </section>
  )
}

function AccountPage({ orders, bookings, go, setSignedIn }) {
  const [tab, setTab] = useState(orders.length || !bookings.length ? 'orders' : 'bookings')
  return (
    <section className="pv-wrap">
      <div className="pv-acc-head"><h1 className="cs-h2">Minha conta</h1><button className="pv-link" onClick={() => { setSignedIn(false); go('home') }}>Sair</button></div>
      <div className="pv-tabs">{[['orders', 'Pedidos'], ['bookings', 'Agendamentos'], ['data', 'Meus dados']].map(([k, l]) => <button key={k} className={tab === k ? 'is-on' : ''} onClick={() => setTab(k)}>{l}</button>)}</div>
      <div className="pv-panel">
        {tab === 'orders' && (orders.length ? orders.map((o) => (
          <div key={o.id} className="pv-orderrow"><b>Pedido #{o.id}</b><span>{o.items} itens · {money(o.total)}</span><em>{o.pay === 'card' ? 'Pagamento aprovado' : 'Aguardando pagamento'}</em></div>
        )) : <p className="pv-muted">Nenhum pedido ainda. <button className="pv-link" onClick={() => go('home')}>Ir às compras</button></p>)}
        {tab === 'bookings' && (bookings.length ? bookings.map((b, k) => (
          <div key={k} className="pv-orderrow"><b>{b.day} às {b.hour}</b><span>{b.service} · {b.pro}</span><em>Confirmado</em></div>
        )) : <p className="pv-muted">Nenhum agendamento. <button className="pv-link" onClick={() => go('booking')}>Agendar agora</button></p>)}
        {tab === 'data' && (
          <div className="pv-form">
            <label className="pv-field"><span>Nome</span><input defaultValue="Cliente Exemplo" /></label>
            <label className="pv-field"><span>E-mail</span><input defaultValue="cliente@email.com" /></label>
            <label className="pv-field"><span>WhatsApp</span><input defaultValue="(19) 9 0000-0000" /></label>
            <button className="cs-btn is-small">Salvar</button>
          </div>
        )}
      </div>
    </section>
  )
}

function ServicePage({ block, i, go, primary }) {
  const it = block.props.items[i]
  return (
    <section className="pv-wrap">
      <button className="pv-back" onClick={() => go('home')}><Icon name="back" size={14} /> Voltar</button>
      <div className="pv-product">
        <Pic block={block} path={`items.${i}.image`} src={it.image} className="pv-product-img" />
        <div className="pv-product-info">
          <span className="cs-kicker">Serviço</span>
          <h1 className="cs-h2">{it.title}</h1>
          <p className="cs-lead">{it.text}</p>
          <p className="cs-p">Explique aqui como funciona, quanto tempo leva, o que está incluso e para quem é indicado.</p>
          <div className="cs-btns"><button className="cs-btn" onClick={primary}>Quero este serviço</button><button className="cs-btn is-ghost" onClick={() => go('whatsapp', { text: `Olá! Tenho interesse em ${it.title}.` })}>Tirar dúvida no WhatsApp</button></div>
        </div>
      </div>
    </section>
  )
}

function PostPage({ n, go }) {
  return (
    <section className="pv-wrap pv-narrow">
      <button className="pv-back" onClick={() => go('home')}><Icon name="back" size={14} /> Voltar</button>
      <span className="cs-kicker">Artigo · 4 min de leitura</span>
      <h1 className="cs-h2">Título da publicação {n}</h1>
      <div className="cs-img is-empty pv-post-img"><div className="cs-img-clip"><span className="cs-img-ph"><Icon name="image" /></span></div></div>
      <p className="cs-p">Aqui entra o texto completo do artigo. Você publica e edita pelo painel administrativo do seu site, com imagens, vídeos e links.</p>
    </section>
  )
}

function WhatsAppPage({ name, text, go }) {
  return (
    <section className="pv-wrap pv-narrow">
      <div className="pv-wa">
        <div className="pv-wa-top"><Icon name="whatsapp" size={20} /> <b>{name}</b><small>online</small></div>
        <div className="pv-wa-body"><p className="pv-wa-in">Olá! Como podemos ajudar?</p><p className="pv-wa-out">{text || 'Olá! Vim pelo site e gostaria de mais informações.'}</p></div>
      </div>
      <p className="pv-muted pv-center-t">No site no ar, este botão abre o WhatsApp da empresa com a mensagem pronta.</p>
      <div className="cs-btns pv-center-t"><button className="cs-btn is-ghost" onClick={() => go('home')}>Voltar ao site</button></div>
    </section>
  )
}

// ---------------- container ----------------
export default function SitePreview({ project, onClose }) {
  const [route, setRoute] = useState({ name: 'home' })
  const [hist, setHist] = useState([])
  const [cart, setCart] = useState([])
  const [orders, setOrders] = useState([])
  const [bookings, setBookings] = useState([])
  const [signedIn, setSignedIn] = useState(false)
  const [device, setDevice] = useState('desktop')
  const [toast, setToast] = useState('')
  const scroller = useRef(null)
  const blocks = project.blocks
  const find = (type) => blocks.find((b) => b.type === type)

  const go = (name, params = {}) => {
    setHist((h) => [...h, route])
    setRoute({ name, ...params })
    scroller.current?.scrollTo({ top: 0 })
  }
  const back = () => {
    if (!hist.length) return
    setRoute(hist[hist.length - 1])
    setHist((h) => h.slice(0, -1))
  }
  const flash = (t) => {
    setToast(t)
    clearTimeout(flash.t)
    flash.t = setTimeout(() => setToast(''), 2400)
  }
  const scrollTo = (id) => {
    const run = () => scroller.current?.querySelector(`[data-block="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    if (route.name !== 'home') {
      go('home')
      setTimeout(run, 60)
    } else run()
  }
  const addToCart = (item) => {
    setCart((c) => {
      const k = c.findIndex((x) => x.title === item.title && x.size === item.size)
      if (k >= 0) return c.map((x, j) => (j === k ? { ...x, qty: x.qty + item.qty } : x))
      return [...c, item]
    })
    flash(`${item.title} no carrinho`)
  }

  const primaryKind = find('booking') ? 'booking' : find('products') ? 'shop' : find('menu') ? 'menu' : find('pricing') ? 'plans' : 'whatsapp'
  const primary = () => {
    if (primaryKind === 'booking') go('booking')
    else if (primaryKind === 'shop') scrollTo(find('products').id)
    else if (primaryKind === 'menu') scrollTo(find('menu').id)
    else if (primaryKind === 'plans') scrollTo(find('pricing').id)
    else go('whatsapp')
  }

  const onAction = (action, payload, block) => {
    switch (action) {
      case 'home': return go('home')
      case 'scroll': return scrollTo(payload)
      case 'primary': return primary()
      case 'secondary': {
        const i = blocks.findIndex((b) => b.type === 'hero')
        const next = blocks.slice(i + 1).find((b) => !['marquee', 'stats'].includes(b.type))
        return next ? scrollTo(next.id) : primary()
      }
      case 'product': return go('product', { blockId: block.id, i: payload })
      case 'add': {
        const it = block.props.items[payload]
        return addToCart({ title: it.title, price: parsePrice(it.price), image: it.image, size: 'M', qty: 1 })
      }
      case 'menu-add': {
        const it = block.props.items[payload]
        return addToCart({ title: it.title, price: parsePrice(it.price), image: '', qty: 1, note: it.text })
      }
      case 'plan': {
        const it = block.props.items[payload]
        setCart([{ title: `Plano ${it.title}`, price: parsePrice(it.price), image: '', qty: 1, note: it.text }])
        return go('checkout')
      }
      case 'service': return go('service', { blockId: block.id, i: payload })
      case 'booking': return go('booking', { preset: payload })
      case 'login': setSignedIn(true); return go('account')
      case 'login-page': return go('login')
      case 'account': return go(signedIn ? 'account' : 'login')
      case 'cart': return go('cart')
      case 'post': return go('post', { n: payload })
      case 'contact-sent': return flash('Mensagem enviada! Responderemos em breve.')
      default:
    }
  }

  const placeOrder = (pay) => {
    const id = 1000 + orders.length + Math.floor(Math.random() * 90)
    const order = { id, pay, total: cart.reduce((s, x) => s + x.price * x.qty, 0), items: cart.reduce((s, x) => s + x.qty, 0) }
    setOrders((o) => [order, ...o])
    setCart([])
    setSignedIn(true)
    go('done', { order })
  }

  const blockById = (id) => blocks.find((b) => b.id === id)
  let page = null
  if (route.name === 'product') page = <ProductPage block={blockById(route.blockId)} i={route.i} go={go} addToCart={addToCart} />
  if (route.name === 'cart') page = <CartPage cart={cart} setCart={setCart} go={go} />
  if (route.name === 'checkout') page = <CheckoutPage cart={cart} signedIn={signedIn} setSignedIn={setSignedIn} go={go} placeOrder={placeOrder} />
  if (route.name === 'done') page = <OrderDone order={route.order} go={go} />
  if (route.name === 'booking') page = <BookingPage project={project} preset={route.preset} go={go} signedIn={signedIn} setSignedIn={setSignedIn} addBooking={(b) => { setBookings((x) => [b, ...x]); setSignedIn(true) }} />
  if (route.name === 'login') page = <LoginPage go={go} setSignedIn={setSignedIn} />
  if (route.name === 'account') page = <AccountPage orders={orders} bookings={bookings} go={go} setSignedIn={setSignedIn} />
  if (route.name === 'service') page = <ServicePage block={blockById(route.blockId)} i={route.i} go={go} primary={primary} />
  if (route.name === 'post') page = <PostPage n={route.n} go={go} />
  if (route.name === 'whatsapp') page = <WhatsAppPage name={project.name} text={route.text} go={go} />

  const path = useMemo(() => {
    const host = slug(project.name).replace(/-/g, '') || 'seusite'
    const p = {
      home: '',
      product: route.name === 'product' ? `produto/${slug(blockById(route.blockId)?.props.items[route.i]?.title)}` : '',
      cart: 'carrinho',
      checkout: 'checkout',
      done: 'pedido-confirmado',
      booking: 'agendar',
      login: 'entrar',
      account: 'minha-conta',
      service: 'servico',
      post: 'blog/artigo',
      whatsapp: 'contato',
    }[route.name]
    return `${host}.com.br/${p || ''}`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route, project.name])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="pv" role="dialog" aria-label="Testar site">
      <div className="pv-bar">
        <div className="pv-nav">
          <button className="b-icon" onClick={back} disabled={!hist.length} aria-label="Voltar"><Icon name="back" size={16} /></button>
          <button className="b-icon" onClick={() => go('home')} aria-label="Início"><Icon name="reset" size={16} /></button>
        </div>
        <div className="pv-url"><Icon name="lock" size={12} /> {path}</div>
        <div className="b-seg is-dark">
          <button className={device === 'desktop' ? 'is-on' : ''} onClick={() => setDevice('desktop')}><Icon name="desktop" size={16} /></button>
          <button className={device === 'mobile' ? 'is-on' : ''} onClick={() => setDevice('mobile')}><Icon name="mobile" size={16} /></button>
        </div>
        <span className="pv-hint">Clique nos botões, produtos e menus: tudo leva a uma tela.</span>
        <button className="btn is-sm" onClick={onClose}>Voltar a editar</button>
      </div>
      <div className={`pv-stage is-${device}`}>
        <div className="pv-scroll" ref={scroller}>
          <SiteRenderer project={project} device={device} onAction={onAction} cartCount={cart.reduce((s, x) => s + x.qty, 0)} signedIn={signedIn} page={page} />
        </div>
      </div>
      {toast && (
        <div className="pv-toast" role="status">
          <Icon name="check" size={16} /> {toast}
          {cart.length > 0 && route.name !== 'cart' && <button onClick={() => go('cart')}>Ver carrinho</button>}
        </div>
      )}
    </div>
  )
}
