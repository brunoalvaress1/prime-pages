import { createContext, lazy, Suspense, useContext, useEffect, useRef, useState } from 'react'
import Icon from '../components/Icon.jsx'
import { BLOCKS } from '../data/blocks.js'
import { imageCss } from './imageStyle.js'
import { ensureFonts } from '../lib/fonts.js'
import InView from '../components/InView.jsx'
import { parseVideo, embedUrl } from '../lib/video.js'

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

// ---------- Carrossel de fotos: 3D (anel), coverflow ou slider grande ----------
function Carousel({ block, edit }) {
  const { editing, no3d, selImg } = useContext(Ctx)
  const p = block.props
  const items = p.items || []
  const n = items.length
  const L = p.layout || 'coverflow'
  const [idx, setIdx] = useState(0)
  const [hover, setHover] = useState(false)
  const drag = useRef(null)
  const editingThis = editing && selImg?.blockId === block.id
  const go = (d) => setIdx((i) => (i + d + n * 100) % n)

  // gira sozinho; pausa com o mouse em cima ou enquanto edita uma foto dele
  useEffect(() => {
    if (no3d || hover || editingThis || n < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setTimeout(() => go(1), L === 'slider' ? 4200 : 3200)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, hover, editingThis, n, no3d, L])

  if (!n) return null
  const set = (i, patch) => edit({ items: items.map((it, j) => (j === i ? { ...it, ...patch } : it)) })
  const cur = items[idx] || items[0]
  const rel = (i) => {
    let r = i - idx
    if (r > n / 2) r -= n
    if (r < -n / 2) r += n
    return r
  }
  const step = 360 / n

  const pointer = {
    onPointerDown: (e) => (drag.current = { x: e.clientX }),
    onPointerUp: (e) => {
      const d = drag.current
      drag.current = null
      if (d && Math.abs(e.clientX - d.x) > 40) go(e.clientX < d.x ? 1 : -1)
    },
  }

  return (
    <div className={`cs-car is-${L}`} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <div className="cs-car-stage" {...pointer}>
        {L === '3d' && (
          <div className="cs-car-ring" style={{ '--n': n, transform: `translateZ(calc(var(--r) * -1)) rotateX(-7deg) rotateY(${-idx * step}deg)` }}>
            {items.map((it, i) => (
              <div key={i} className={`cs-car-card ${i === idx ? 'is-on' : ''}`} style={{ transform: `rotateY(${i * step}deg) translateZ(var(--r))` }} onClick={() => i !== idx && setIdx(i)}>
                <Img block={block} path={`items.${i}.image`} />
              </div>
            ))}
          </div>
        )}
        {L === 'coverflow' &&
          items.map((it, i) => {
            const r = rel(i)
            const a = Math.abs(r)
            return (
              <div
                key={i}
                className={`cs-car-card ${r === 0 ? 'is-on' : ''}`}
                style={{ transform: `translateX(${r * 62}%) translateZ(${-a * 140}px) rotateY(${-Math.sign(r) * Math.min(a, 2) * 28}deg) scale(${1 - Math.min(a, 3) * 0.08})`, zIndex: 20 - a, opacity: a > 2 ? 0 : 1 - a * 0.18 }}
                onClick={() => r !== 0 && setIdx(i)}
              >
                <Img block={block} path={`items.${i}.image`} />
              </div>
            )
          })}
        {L === 'slider' && (
          <div className="cs-car-track" style={{ transform: `translateX(${-idx * 100}%)` }}>
            {items.map((it, i) => (
              <div key={i} className={`cs-car-slide ${i === idx ? 'is-on' : ''}`}>
                <Img block={block} path={`items.${i}.image`} />
                <div className="cs-car-cap">
                  <T as="h3" className="cs-h3" value={it.title} onChange={(v) => set(i, { title: v })} />
                  <T as="p" className="cs-p" value={it.text} multiline onChange={(v) => set(i, { text: v })} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {L !== 'slider' && (
        <div className="cs-car-info" key={idx}>
          <T as="h3" className="cs-h3" value={cur.title} onChange={(v) => set(idx, { title: v })} />
          <T as="p" className="cs-p" value={cur.text} multiline onChange={(v) => set(idx, { text: v })} />
        </div>
      )}
      <div className="cs-car-nav">
        <button type="button" className="cs-car-arrow" aria-label="Anterior" onClick={(e) => { e.stopPropagation(); go(-1) }}><Icon name="back" size={18} /></button>
        <div className="cs-car-dots">
          {items.map((_, i) => <button type="button" key={i} className={i === idx ? 'is-on' : ''} aria-label={`Foto ${i + 1}`} onClick={(e) => { e.stopPropagation(); setIdx(i) }} />)}
        </div>
        <button type="button" className="cs-car-arrow" aria-label="Próxima" onClick={(e) => { e.stopPropagation(); go(1) }}><Icon name="arrow" size={18} /></button>
      </div>
      {!hover && !editingThis && !no3d && <span className="cs-car-timer" key={'t' + idx} style={{ animationDuration: L === 'slider' ? '4.2s' : '3.2s' }} />}
    </div>
  )
}

// ---------- Rodapé completo: marca, navegação, contato, chamada e assinatura gigante ----------
function Footer({ block, t }) {
  const { project, onAction, editing } = useContext(Ctx)
  const p = block.props
  const name = project?.name || ''
  const blocks = project?.blocks || []
  const nav = blocks.filter((b) => !['hero', 'footer', 'marquee', 'stats', 'cta'].includes(b.type) && b.props.title).slice(0, 6)
  const map = blocks.find((b) => b.type === 'map')
  const contact = blocks.find((b) => b.type === 'contact')
  const hero = blocks.find((b) => b.type === 'hero')
  const address = p.address || map?.props.address || ''
  const hours = p.hours || map?.props.hours || ''
  const phone = p.phone || contact?.props.whatsapp || ''
  const has = (k) => typeof p[k] === 'string'
  const link = (b) =>
    onAction ? (
      <button type="button" key={b.id} onClick={() => onAction('scroll', b.id)}>{b.props.title}</button>
    ) : (
      <span key={b.id}>{b.props.title}</span>
    )
  return (
    <footer className="cs-footer">
      <div className="cs-f-top">
        <div className="cs-f-brand">
          <strong className="cs-f-name">{name}</strong>
          {has('about') && (p.about || editing) ? t('about', 'p', 'cs-f-about', true) : null}
          <div className="cs-f-social">
            {(p.instagram || editing) && <span title={p.instagram || 'Instagram'}><Icon name="instagram" size={18} /></span>}
            {(phone || editing) && <span title={phone || 'WhatsApp'}><Icon name="whatsapp" size={18} /></span>}
            {(p.email || editing) && <span title={p.email || 'E-mail'}><Icon name="mail" size={18} /></span>}
          </div>
        </div>
        {nav.length > 0 && (
          <div className="cs-f-col">
            <b>Navegação</b>
            {nav.map(link)}
          </div>
        )}
        <div className="cs-f-col">
          <b>Contato</b>
          {address && <span>{address}</span>}
          {phone && <span>{phone}</span>}
          {p.email && <span>{p.email}</span>}
          {hours && <span>{hours}</span>}
          {!address && !phone && !p.email && !hours && <span>{editing ? 'Preencha telefone, e-mail e endereço no painel.' : 'Fale com a gente pelo WhatsApp.'}</span>}
        </div>
        <div className="cs-f-cta">
          <b>Vamos conversar?</b>
          <Btn action="primary">{hero?.props.cta || 'Fale com a gente'}</Btn>
        </div>
      </div>
      <div className="cs-f-word" aria-hidden="true"><span>{name}</span></div>
      <div className="cs-f-bottom">
        {p.text === BLOCKS.footer.defaults.text && !editing ? <p>© {new Date().getFullYear()} {name}. Todos os direitos reservados.</p> : t('text', 'p', '')}
        <span>Feito com Prime Page</span>
      </div>
    </footer>
  )
}

// Número que conta do zero quando aparece na tela (ex.: "1.200+", "4,9", "15 anos").
function CountUp({ value }) {
  const ref = useRef(null)
  const m = String(value || '').match(/^(\D*?)(\d[\d.]*(?:,\d+)?)(.*)$/)
  const [shown, setShown] = useState(m ? m[1] + '0' + m[3] : value)
  useEffect(() => {
    if (!m || !ref.current) return setShown(value)
    const target = parseFloat(m[2].replace(/\./g, '').replace(',', '.'))
    const dec = (m[2].split(',')[1] || '').length
    const thousands = m[2].includes('.')
    let raf
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      io.disconnect()
      const t0 = performance.now()
      const tick = (t) => {
        const k = Math.min(1, (t - t0) / 1600)
        const v = target * (1 - Math.pow(1 - k, 3))
        let s = dec ? v.toFixed(dec).replace('.', ',') : Math.round(v).toString()
        if (thousands && !dec) s = Number(s).toLocaleString('pt-BR')
        setShown(m[1] + s + m[3])
        if (k < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    })
    io.observe(ref.current)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])
  return <strong ref={ref}>{shown}</strong>
}

// Vídeo do site: arquivo, YouTube ou Vimeo. "background" = capa (mudo, em loop, sem controles).
// Em miniaturas/exportação estática (no3d) mostra só a capa do vídeo.
function Video({ url, poster, className = '', background }) {
  const { no3d } = useContext(Ctx)
  const v = parseVideo(url)
  if (!v) return null
  const thumb = poster || v.thumb
  if (no3d) return <div className={`${className} cs-video is-static`} style={thumb ? { backgroundImage: `url(${thumb})` } : undefined}><span className="cs-video-play" aria-hidden="true" /></div>
  if (v.kind === 'file')
    return (
      <div className={`${className} cs-video`}>
        <video src={v.url} poster={thumb || undefined} autoPlay={background} muted={background} loop={background} playsInline controls={!background} preload="metadata" />
      </div>
    )
  return (
    <div className={`${className} cs-video ${background ? 'is-bg' : ''}`}>
      <iframe src={embedUrl(v, background)} title="Vídeo" loading="lazy" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen tabIndex={background ? -1 : 0} />
    </div>
  )
}

function Three({ p, accent, className, interactive = true }) {
  if (useContext(Ctx).no3d) return <div className={className + " cs-3d-static"} aria-hidden="true"><span style={{ background: p.color || accent }} /></div>
  return (
    <InView className={className} margin="100px" fallback={<div className="cs-3d-loading">Carregando 3D…</div>}>
      <Suspense fallback={<div className="cs-3d-loading">Carregando 3D…</div>}>
        <Scene3D shape={p.shape} color={p.color || accent} material={p.material} glb={p.glb} interactive={interactive} />
      </Suspense>
    </InView>
  )
}

function Section({ block, edit, theme }) {
  const p = block.props
  const live = useLive(block)
  const { onAction: liveAction, no3d: staticRender, editing: editingAny } = useContext(Ctx)
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
          {L === 'full' && (p.video ? <Video url={p.video} poster={p.image} className="cs-hero-bg" background /> : <Img block={block} path="image" className="cs-hero-bg" label="Imagem de fundo" />)}
          {L === '3d' && <Three p={p} accent={theme.accent} className="cs-hero-3d" />}
          <div className="cs-hero-copy">
            {p.kicker ? t('kicker', 'span', 'cs-kicker') : null}
            {t('title', 'h1', 'cs-h1')}
            {t('subtitle', 'p', 'cs-lead', true)}
            {btns}
          </div>
          {(L === 'split' || L === 'editorial') && (p.video ? <Video url={p.video} poster={p.image} className="cs-hero-img" background /> : <Img block={block} path="image" className="cs-hero-img" />)}
          {p.float3d && L !== '3d' && <Three p={p.float3d} accent={theme.accent} className={`cs-float3d at-${p.float3d.pos || 'right'}`} interactive={false} />}
        </header>
      )
    }
    case 'video': {
      const L = p.layout || 'wide'
      return (
        <section className={`cs-videosec is-${L}`}>
          <div className="cs-videosec-copy">
            {t('title', 'h2', 'cs-h2')}
            {p.text || isLive ? t('text', 'p', 'cs-p', true) : null}
          </div>
          {p.video ? <Video url={p.video} poster={p.poster} className="cs-videosec-player" /> : <div className="cs-videosec-player cs-video is-empty"><span>Cole o link do vídeo no painel (YouTube, Vimeo ou .mp4)</span></div>}
        </section>
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
      const withImg = L === 'images' || L === 'feature' || L === 'bento' || (L === 'cards' && p.items.some((it) => it.image))
      return (
        <section className={`cs-list is-services is-${L}`}>
          <div className="cs-sec-head">
            {t('title', 'h2', 'cs-h2')}
            {p.text || editingAny ? t('text', 'p', 'cs-p cs-sec-lead', true) : null}
          </div>
          <div className="cs-grid">
            <Items
              block={block}
              edit={edit}
              render={(it, set, i) => (
                <article key={i} className="cs-item" style={{ '--i': i }} {...live('service', i)}>
                  {withImg && <Img block={block} path={`items.${i}.image`} />}
                  {L === 'list' && <span className="cs-num">{String(i + 1).padStart(2, '0')}</span>}
                  {L === 'cards' && <span className="cs-badge" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>}
                  <div className="cs-item-body">
                    <T as="h3" className="cs-h3" value={it.title} onChange={(v) => set({ title: v })} />
                    <T as="p" className="cs-p" value={it.text} multiline onChange={(v) => set({ text: v })} />
                    {(L === 'cards' || L === 'feature' || L === 'bento') && <span className="cs-more" aria-hidden="true">Saiba mais <Icon name="arrow" size={14} /></span>}
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
                {editingAny ? <T as="strong" value={it.title} onChange={(v) => set({ title: v })} /> : <CountUp value={it.title} />}
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
          {p.layout === 'marquee' ? (
            <div className="cs-gmarq">
              {[0, 1].map((row) => (
                <div key={row} className={`cs-gmarq-row ${row ? 'is-rev' : ''}`}>
                  <div className="cs-gmarq-track">
                    {p.images.map((_, i) => <Img key={i} block={block} path={`images.${(i + row * 2) % p.images.length}`} />)}
                    {p.images.map((src, i) => <div key={'d' + i} className="cs-img" aria-hidden="true"><div className="cs-img-clip">{p.images[(i + row * 2) % p.images.length] ? <img src={p.images[(i + row * 2) % p.images.length]} alt="" draggable={false} /> : null}</div></div>)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={`cs-gallery is-${p.layout || 'grid'}`}>
              {p.images.map((_, i) => <Img key={i} block={block} path={`images.${i}`} />)}
            </div>
          )}
        </section>
      )
    case 'carousel':
      return (
        <section className="cs-carsec">
          <div className="cs-carsec-head">
            {t('title', 'h2', 'cs-h2')}
            {p.text || editingAny ? t('text', 'p', 'cs-p', true) : null}
          </div>
          <Carousel block={block} edit={edit} />
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
      return <Footer block={block} t={t} />
    default:
      return null
  }
}

// Entrada das seções ao rolar. O estado fica no React (e não só em classList),
// para a animação não 'resetar' quando a prévia re-renderiza durante a edição.
function useReveal(blocks, enabled) {
  const [seen, setSeen] = useState(() => new Set(blocks.slice(0, 1).map((b) => b.id)))
  const key = blocks.map((b) => b.id).join()
  useEffect(() => {
    if (!enabled) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      setSeen(new Set(blocks.map((b) => b.id)))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        const ids = entries.filter((e) => e.isIntersecting).map((e) => e.target.dataset.block)
        if (!ids.length) return
        entries.forEach((e) => e.isIntersecting && io.unobserve(e.target))
        setSeen((prev) => {
          const n = new Set(prev)
          ids.forEach((i) => n.add(i))
          return n
        })
      },
      { rootMargin: '0px 0px -6% 0px', threshold: 0.06 },
    )
    const t = setTimeout(() => document.querySelectorAll('.cs-block.cs-anim:not(.is-in)[data-block]').forEach((el) => io.observe(el)), 30)
    return () => {
      clearTimeout(t)
      io.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled])
  return seen
}

export default function SiteRenderer({ project, editing, selected, selImg, onSelect, onSelectImage, onEdit, onMedia, device, onAction, cartCount = 0, signedIn, page, no3d }) {
  const th = project.theme
  ensureFonts([th.font, th.headingFont])
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
  const ctx = { editing, selImg, onSelectImage, onEdit, onMedia, onAction, no3d, project }
  const seen = useReveal(project.blocks, !no3d && !page)
  const anim = !no3d && !page
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
                  className={`cs-block bg-${s.bg || 'auto'} pad-${s.pad || 'm'} align-${s.align || 'left'} ${editing ? 'is-editing' : ''} ${selected === b.id ? 'is-selected' : ''} ${anim ? 'cs-anim' : ''} ${anim && seen.has(b.id) ? 'is-in' : ''}`}
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
