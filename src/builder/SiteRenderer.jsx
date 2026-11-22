import { createContext, lazy, Suspense, useContext, useRef } from 'react'
import Icon from '../components/Icon.jsx'
import { BLOCKS } from '../data/blocks.js'
import { imageCss } from './imageStyle.js'

const Scene3D = lazy(() => import('../components/Scene3D.jsx'))

const BLOCK_LABEL = (type) => `${BLOCKS[type].part} · ${BLOCKS[type].label}`

export function onColor(hex) {
  const n = parseInt((hex || '#000000').slice(1), 16)
  const lin = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  const L = 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255)
  return L > 0.36 ? '#111318' : '#ffffff'
}

// ---- caminhos de imagem: 'image' | 'images.2' | 'items.1.image'
export function getPath(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj)
}
export function setPathPatch(props, path, value) {
  const [head, ...rest] = path.split('.')
  if (!rest.length) return { [head]: value }
  const clone = structuredClone(props[head])
  let o = clone
  rest.slice(0, -1).forEach((k) => (o = o[k]))
  o[rest[rest.length - 1]] = value
  return { [head]: clone }
}

export function readImage(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return reject(new Error('Envie uma imagem (JPG, PNG ou WebP).'))
    if (file.size > 8 * 1024 * 1024) return reject(new Error('Imagem acima de 8 MB. Use uma versão menor.'))
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(1, 1600 / Math.max(img.width, img.height))
      const c = document.createElement('canvas')
      c.width = Math.round(img.width * scale)
      c.height = Math.round(img.height * scale)
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
      URL.revokeObjectURL(url)
      resolve(c.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.84))
    }
    img.onerror = () => reject(new Error('Não conseguimos ler essa imagem.'))
    img.src = url
  })
}

const Ctx = createContext(null)

// Texto editável direto na prévia.
function T({ as: Tag = 'span', value, onChange, className = '', multiline }) {
  const { editing } = useContext(Ctx)
  if (!editing) return <Tag className={className}>{value}</Tag>
  return (
    <Tag
      className={className + ' cs-editable'}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      onKeyDown={(e) => {
        if (!multiline && e.key === 'Enter') {
          e.preventDefault()
          e.currentTarget.blur()
        }
      }}
      onBlur={(e) => {
        const v = e.currentTarget.innerText.trim()
        if (v !== value) onChange(v)
      }}
    >
      {value}
    </Tag>
  )
}

// Imagem com formato/ajustes. Clicar seleciona; arrastar move o enquadramento.
function Img({ block, path, className = '', label = 'Adicionar imagem' }) {
  const ctx = useContext(Ctx)
  const { editing, selImg, onSelectImage, onEdit, onMedia } = ctx
  const src = getPath(block.props, path)
  const st = block.props.media?.[path]
  const css = imageCss(st)
  const input = useRef(null)
  const drag = useRef(null)
  const isSel = editing && selImg?.blockId === block.id && selImg?.path === path

  const pick = async (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    try {
      onEdit(block.id, setPathPatch(block.props, path, await readImage(f)))
      onSelectImage?.(block.id, path)
    } catch (err) {
      alert(err.message)
    }
    e.target.value = ''
  }

  const down = (e) => {
    if (!isSel || !src) return
    e.preventDefault()
    const r = e.currentTarget.getBoundingClientRect()
    drag.current = { sx: e.clientX, sy: e.clientY, x: st?.x ?? 50, y: st?.y ?? 50, w: r.width, h: r.height }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const move = (e) => {
    const d = drag.current
    if (!d) return
    const zoom = (st?.zoom ?? 100) / 100
    const k = 100 / Math.max(zoom, 1)
    const x = Math.max(0, Math.min(100, d.x - ((e.clientX - d.sx) / d.w) * k))
    const y = Math.max(0, Math.min(100, d.y - ((e.clientY - d.sy) / d.h) * k))
    onMedia(block.id, path, { x: Math.round(x), y: Math.round(y) })
  }
  const up = () => (drag.current = null)

  return (
    <div
      className={`cs-img ${className} ${src ? '' : 'is-empty'} ${isSel ? 'is-sel' : ''}`}
      style={css.frame}
      onClick={(e) => {
        if (!editing) return
        e.stopPropagation()
        onSelectImage?.(block.id, path)
      }}
    >
      <div className="cs-img-clip" style={css.clip} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        {src ? <img src={src} alt="" draggable={false} style={css.img} /> : <span className="cs-img-ph"><Icon name="image" />{editing ? label : ''}</span>}
        {css.overlay > 0 && <span className="cs-img-overlay" style={{ opacity: css.overlay / 100 }} />}
        {css.border > 0 && <span className="cs-img-border" style={{ boxShadow: `inset 0 0 0 ${css.border}px ${css.borderColor}`, borderRadius: css.clip.borderRadius }} />}
      </div>
      {editing && (
        <>
          <button type="button" className="cs-img-btn" onClick={(e) => { e.stopPropagation(); input.current.click() }}>
            <Icon name="upload" /> {src ? 'Trocar' : 'Enviar'}
          </button>
          {isSel && src && <span className="cs-img-hint">Arraste para enquadrar</span>}
          <input ref={input} type="file" accept="image/*" hidden onChange={pick} />
        </>
      )}
    </div>
  )
}

// No modo "Testar site" (onAction definido) os botões e cartões navegam para outras telas.
const BlockCtx = createContext(null)

function Btn({ action, payload, ghost, small, children }) {
  const { onAction } = useContext(Ctx)
  const block = useContext(BlockCtx)
  const cls = `cs-btn ${ghost ? 'is-ghost' : ''} ${small ? 'is-small' : ''}`
  if (!onAction) return <span className={cls}>{children}</span>
  return (
    <button type="button" className={cls} onClick={(e) => { e.stopPropagation(); onAction(action, payload, block) }}>
      {children}
    </button>
  )
}

function useLive(block) {
  const { onAction } = useContext(Ctx)
  return (action, payload) =>
    onAction
      ? {
          'data-live': '',
          role: 'button',
          tabIndex: 0,
          onClick: (e) => { e.stopPropagation(); onAction(action, payload, block) },
          onKeyDown: (e) => e.key === 'Enter' && onAction(action, payload, block),
        }
      : {}
}

function Items({ block, edit, render }) {
  const set = (i, patch) => edit({ items: block.props.items.map((it, j) => (j === i ? { ...it, ...patch } : it)) })
  return block.props.items.map((it, i) => render(it, (patch) => set(i, patch), i))
}

function Three({ p, accent, className, interactive = true }) {
  if (useContext(Ctx).no3d) return <div className={className + " cs-3d-static"} aria-hidden="true"><span style={{ background: p.color || accent }} /></div>
  return (
    <div className={className}>
      <Suspense fallback={<div className="cs-3d-loading">Carregando 3D…</div>}>
        <Scene3D shape={p.shape} color={p.color || accent} material={p.material} glb={p.glb} interactive={interactive} />
      </Suspense>
    </div>
  )
}

function Section({ block, edit, theme }) {
  const p = block.props
  const live = useLive(block)
  const { onAction: liveAction, no3d: staticRender } = useContext(Ctx)
  const isLive = !!liveAction
  const t = (key, as, cls, multiline) => <T as={as} className={cls} value={p[key]} multiline={multiline} onChange={(v) => edit({ [key]: v })} />
  const btns = (
    <div className="cs-btns">
      <Btn action="primary">{t('cta', 'span', '')}</Btn>
      {p.cta2 ? <Btn action="secondary" ghost>{t('cta2', 'span', '')}</Btn> : null}
    </div>
  )

  switch (block.type) {
    case 'hero': {
      const L = p.layout || 'split'
      return (
        <header className={`cs-hero is-${L}`}>
          {L === 'full' && <Img block={block} path="image" className="cs-hero-bg" label="Imagem de fundo" />}
          {L === '3d' && <Three p={p} accent={theme.accent} className="cs-hero-3d" />}
          <div className="cs-hero-copy">
            {p.kicker ? t('kicker', 'span', 'cs-kicker') : null}
            {t('title', 'h1', 'cs-h1')}
            {t('subtitle', 'p', 'cs-lead', true)}
            {btns}
          </div>
          {(L === 'split' || L === 'editorial') && <Img block={block} path="image" className="cs-hero-img" />}
          {p.float3d && L !== '3d' && <Three p={p.float3d} accent={theme.accent} className={`cs-float3d at-${p.float3d.pos || 'right'}`} interactive={false} />}
        </header>
      )
    }
    case 'marquee':
      return (
        <div className="cs-marquee" aria-label={p.text}>
          <div className="cs-marquee-track">
            {[0, 1].map((k) => (
              <span key={k} aria-hidden={k === 1}>{k === 0 ? t('text', 'span', '') : p.text}<i className="cs-marquee-dot" /></span>
            ))}
          </div>
        </div>
      )
    case 'about':
      return (
        <section className={`cs-about is-${p.layout || 'split'}`}>
          <div className="cs-about-copy">
            {t('title', 'h2', 'cs-h2')}
            {t('text', 'p', 'cs-p', true)}
          </div>
          <div className="cs-about-media">
            <Img block={block} path="image" />
            {p.image2 || p.showImage2 ? <Img block={block} path="image2" className="cs-about-second" /> : null}
          </div>
        </section>
      )
    case 'services': {
      const L = p.layout || 'cards'
      return (
        <section className={`cs-list is-services is-${L}`}>
          {t('title', 'h2', 'cs-h2')}
          <div className="cs-grid">
            <Items
              block={block}
              edit={edit}
              render={(it, set, i) => (
                <article key={i} className="cs-item" {...live('service', i)}>
                  {L === 'images' && <Img block={block} path={`items.${i}.image`} />}
                  {L === 'list' && <span className="cs-num">{String(i + 1).padStart(2, '0')}</span>}
                  <div>
                    <T as="h3" className="cs-h3" value={it.title} onChange={(v) => set({ title: v })} />
                    <T as="p" className="cs-p" value={it.text} multiline onChange={(v) => set({ text: v })} />
                  </div>
                </article>
              )}
            />
          </div>
        </section>
      )
    }
    case 'stats':
      return (
        <section className="cs-stats">
          <Items
            block={block}
            edit={edit}
            render={(it, set, i) => (
              <div key={i} className="cs-stat">
                <T as="strong" value={it.title} onChange={(v) => set({ title: v })} />
                <T as="span" value={it.text} onChange={(v) => set({ text: v })} />
              </div>
            )}
          />
        </section>
      )
    case 'faq':
    case 'testimonials':
    case 'pricing':
    case 'menu':
    case 'steps':
      return (
        <section className={`cs-list is-${block.type}`}>
          {t('title', 'h2', 'cs-h2')}
          <div className="cs-grid">
            <Items
              block={block}
              edit={edit}
              render={(it, set, i) => (
                <article key={i} className="cs-item" {...(block.type === 'menu' ? live('menu-add', i) : block.type === 'pricing' ? live('plan', i) : {})}>
                  {block.type === 'testimonials' && <Icon name="quote" className="cs-quote" />}
                  {block.type === 'steps' && <span className="cs-step-n">{i + 1}</span>}
                  <T as="h3" className="cs-h3" value={it.title} onChange={(v) => set({ title: v })} />
                  {it.price !== undefined && <T as="strong" className="cs-price" value={it.price} onChange={(v) => set({ price: v })} />}
                  <T as="p" className="cs-p" value={it.text} multiline onChange={(v) => set({ text: v })} />
                </article>
              )}
            />
          </div>
        </section>
      )
    case 'products':
    case 'team':
      return (
        <section className={`cs-cards is-${block.type}`}>
          {t('title', 'h2', 'cs-h2')}
          <div className="cs-grid">
            <Items
              block={block}
              edit={edit}
              render={(it, set, i) => (
                <article key={i} className="cs-card" {...(block.type === 'products' ? live('product', i) : {})}>
                  <Img block={block} path={`items.${i}.image`} />
                  <T as="h3" className="cs-h3" value={it.title} onChange={(v) => set({ title: v })} />
                  {it.price !== undefined ? <T as="strong" className="cs-price" value={it.price} onChange={(v) => set({ price: v })} /> : <T as="p" className="cs-p" value={it.text} onChange={(v) => set({ text: v })} />}
                  {block.type === 'products' && <Btn action="add" payload={i} small>Comprar</Btn>}
                </article>
              )}
            />
          </div>
        </section>
      )
    case 'gallery':
      return (
        <section>
          {t('title', 'h2', 'cs-h2')}
          <div className={`cs-gallery is-${p.layout || 'grid'}`}>
            {p.images.map((_, i) => <Img key={i} block={block} path={`images.${i}`} />)}
          </div>
        </section>
      )
    case 'booking':
      return (
        <section className="cs-split">
          <div>
            {t('title', 'h2', 'cs-h2')}
            {t('text', 'p', 'cs-p', true)}
          </div>
          <div className="cs-cal" aria-hidden="true">
            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d, i) => (
              <div key={d} className="cs-cal-day">
                <b>{d}</b>
                {['09:00', '10:30', '14:00', '16:30'].map((h, j) => (
                  <span key={h} className={(i + j) % 3 === 0 ? 'is-taken' : i === 2 && j === 1 ? 'is-on' : ''} {...((i + j) % 3 === 0 ? {} : live('booking', { day: d, hour: h }))}>{h}</span>
                ))}
              </div>
            ))}
          </div>
        </section>
      )
    case 'blog':
      return (
        <section>
          {t('title', 'h2', 'cs-h2')}
          <div className="cs-grid">
            {[1, 2, 3].map((n) => (
              <article key={n} className="cs-card" {...live('post', n)}>
                <div className="cs-img is-empty"><div className="cs-img-clip"><span className="cs-img-ph"><Icon name="image" /></span></div></div>
                <h3 className="cs-h3">Título da publicação {n}</h3>
                <p className="cs-p">Você publica pelo painel.</p>
              </article>
            ))}
          </div>
        </section>
      )
    case 'login':
      return (
        <section className="cs-split">
          <div>
            {t('title', 'h2', 'cs-h2')}
            {t('text', 'p', 'cs-p')}
          </div>
          <form className="cs-form" onSubmit={(e) => e.preventDefault()}>
            <label>E-mail<input disabled={!isLive} placeholder="voce@email.com" /></label>
            <label>Senha<input disabled={!isLive} type="password" placeholder="••••••" /></label>
            <Btn action="login">Entrar</Btn>
          </form>
        </section>
      )
    case 'model3d':
      return (
        <section className="cs-split">
          <div>
            {t('title', 'h2', 'cs-h2')}
            {t('text', 'p', 'cs-p')}
          </div>
          <Three p={p} accent={theme.accent} className="cs-3d-stage" />
        </section>
      )
    case 'cta':
      return (
        <section className="cs-cta">
          {t('title', 'h2', 'cs-h2')}
          {t('text', 'p', 'cs-lead', true)}
          <div className="cs-btns"><Btn action="primary">{t('cta', 'span', '')}</Btn></div>
        </section>
      )
    case 'map':
      return (
        <section className="cs-split">
          <div>
            {t('title', 'h2', 'cs-h2')}
            {t('address', 'p', 'cs-p')}
            {p.hours !== undefined && t('hours', 'p', 'cs-p cs-hours')}
          </div>
          {staticRender ? <div className="cs-map-ph" aria-hidden="true"><Icon name="image" /> Mapa</div> : <iframe title="Mapa" loading="lazy" src={`https://www.google.com/maps?q=${encodeURIComponent(p.address)}&output=embed`} />}
        </section>
      )
    case 'contact':
      return (
        <section className="cs-split">
          <div>
            {t('title', 'h2', 'cs-h2')}
            {t('text', 'p', 'cs-p', true)}
          </div>
          <form className="cs-form" onSubmit={(e) => e.preventDefault()}>
            <label>Nome<input disabled={!isLive} placeholder="Seu nome" /></label>
            <label>Mensagem<textarea disabled={!isLive} rows="3" placeholder="Como podemos ajudar?" /></label>
            <Btn action="contact-sent">Enviar</Btn>
          </form>
        </section>
      )
    case 'footer':
      return <footer className="cs-footer">{t('text', 'p', '')}</footer>
    default:
      return null
  }
}

export default function SiteRenderer({ project, editing, selected, selImg, onSelect, onSelectImage, onEdit, onMedia, device, onAction, cartCount = 0, signedIn, page, no3d }) {
  const th = project.theme
  const style = {
    '--cs-bg': th.bg,
    '--cs-surface': th.surface,
    '--cs-text': th.text,
    '--cs-muted': th.muted,
    '--cs-accent': th.accent,
    '--cs-on-accent': onColor(th.accent),
    '--cs-radius': th.radius + 'px',
    '--cs-font': `'${th.font} Variable', '${th.font}', system-ui, sans-serif`,
    '--cs-head': `'${th.headingFont || th.font} Variable', '${th.headingFont || th.font}', system-ui, sans-serif`,
  }
  const ctx = { editing, selImg, onSelectImage, onEdit, onMedia, onAction, no3d }
  const navBlocks = project.blocks.filter((b) => !['hero', 'footer', 'marquee', 'stats', 'cta'].includes(b.type) && b.props.title).slice(0, 4)
  const hasShop = project.blocks.some((b) => b.type === 'products' || b.type === 'menu')
  const hasLogin = project.blocks.some((b) => b.type === 'login')
  const footer = project.blocks.find((b) => b.type === 'footer')
  return (
    <Ctx.Provider value={ctx}>
      <div className={`cs-site is-${device || 'desktop'} btn-${th.button || 'solid'} head-${th.headCase || 'normal'} ${onAction ? 'is-live' : ''}`} style={style}>
        <nav className="cs-nav">
          {onAction ? <button type="button" className="cs-nav-brand" onClick={() => onAction('home')}>{project.name}</button> : <strong>{project.name}</strong>}
          {onAction ? (
            <span className="cs-nav-links">
              {navBlocks.map((b) => <button type="button" key={b.id} onClick={() => onAction('scroll', b.id)}>{b.props.title.split(' ').slice(0, 2).join(' ')}</button>)}
            </span>
          ) : (
            <span>{navBlocks.map((b) => b.props.title.split(' ').slice(0, 2).join(' ')).join('   ')}</span>
          )}
          {onAction && hasLogin && <button type="button" className="cs-nav-icon" aria-label="Minha conta" onClick={() => onAction(signedIn ? 'account' : 'login-page')}><Icon name="lock" size={18} />{signedIn ? <small>Conta</small> : <small>Entrar</small>}</button>}
          {onAction && hasShop && <button type="button" className="cs-nav-icon" aria-label="Carrinho" onClick={() => onAction('cart')}><Icon name="pay" size={18} /><small>Carrinho</small>{cartCount > 0 && <i>{cartCount}</i>}</button>}
          {onAction ? <button type="button" className="cs-nav-cta" onClick={() => onAction('primary')}>{project.blocks.find((b) => b.type === 'hero')?.props.cta || 'Contato'}</button> : <em className="cs-nav-cta">{project.blocks.find((b) => b.type === 'hero')?.props.cta || 'Contato'}</em>}
        </nav>
        {page ? (
          <>
            <div className="cs-page">{page}</div>
            {footer && <div className="cs-block"><BlockCtx.Provider value={footer}><Section block={footer} theme={th} edit={() => {}} /></BlockCtx.Provider></div>}
          </>
        ) : (
          <>
            {project.blocks.length === 0 && <div className="cs-empty">Nenhuma peça encaixada ainda. Escolha peças no painel.</div>}
            {project.blocks.map((b) => {
              const s = b.props.style || {}
              return (
                <div
                  key={b.id}
                  className={`cs-block bg-${s.bg || 'auto'} pad-${s.pad || 'm'} align-${s.align || 'left'} ${editing ? 'is-editing' : ''} ${selected === b.id ? 'is-selected' : ''}`}
                  onClickCapture={() => editing && onSelect?.(b.id)}
                  data-block={b.id}
                  data-part={editing ? BLOCK_LABEL(b.type) : undefined}
                >
                  <BlockCtx.Provider value={b}>
                    <Section block={b} theme={th} edit={(patch) => onEdit?.(b.id, patch)} />
                  </BlockCtx.Provider>
                </div>
              )
            })}
          </>
        )}
      </div>
    </Ctx.Provider>
  )
}
