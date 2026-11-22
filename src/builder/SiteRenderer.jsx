import { lazy, Suspense, useRef } from 'react'
import Icon from '../components/Icon.jsx'
import { BLOCKS } from '../data/blocks.js'

function onColor(hex) {
  const n = parseInt((hex || '#000000').slice(1), 16)
  const lin = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  const L = 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255)
  return L > 0.36 ? '#111318' : '#ffffff'
}

const BLOCK_LABEL = (type) => `${BLOCKS[type].part} · ${BLOCKS[type].label}`

const Scene3D = lazy(() => import('../components/Scene3D.jsx'))

// Texto editável direto na prévia.
function T({ as: Tag = 'span', value, onChange, editing, className, multiline }) {
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

export function readImage(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return reject(new Error('Envie uma imagem (JPG, PNG ou WebP).'))
    if (file.size > 8 * 1024 * 1024) return reject(new Error('Imagem acima de 8 MB. Use uma versão menor.'))
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      // Reduz para no máximo 1600px para caber no navegador.
      const scale = Math.min(1, 1600 / Math.max(img.width, img.height))
      const c = document.createElement('canvas')
      c.width = Math.round(img.width * scale)
      c.height = Math.round(img.height * scale)
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
      URL.revokeObjectURL(url)
      resolve(c.toDataURL('image/jpeg', 0.82))
    }
    img.onerror = () => reject(new Error('Não conseguimos ler essa imagem.'))
    img.src = url
  })
}

function Img({ src, onChange, editing, className, label = 'Adicionar imagem' }) {
  const input = useRef(null)
  const pick = async (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    try {
      onChange(await readImage(f))
    } catch (err) {
      alert(err.message)
    }
    e.target.value = ''
  }
  return (
    <div className={`cs-img ${className || ''} ${src ? '' : 'is-empty'}`}>
      {src ? <img src={src} alt="" loading="lazy" /> : <span className="cs-img-ph"><Icon name="image" />{editing ? label : ''}</span>}
      {editing && (
        <>
          <button type="button" className="cs-img-btn" onClick={() => input.current.click()}>
            <Icon name="upload" /> {src ? 'Trocar' : 'Enviar'}
          </button>
          <input ref={input} type="file" accept="image/*" hidden onChange={pick} />
        </>
      )}
    </div>
  )
}

function Items({ block, edit, editing, render }) {
  const set = (i, patch) => {
    const items = block.props.items.map((it, j) => (j === i ? { ...it, ...patch } : it))
    edit({ items })
  }
  return block.props.items.map((it, i) => render(it, (patch) => set(i, patch), i, editing))
}

function Section({ block, edit, editing }) {
  const p = block.props
  const t = (key, as, cls, multiline) => <T as={as} className={cls} value={p[key]} editing={editing} multiline={multiline} onChange={(v) => edit({ [key]: v })} />

  switch (block.type) {
    case 'hero':
      return (
        <header className={`cs-hero is-${p.layout || 'split'}`}>
          {p.layout === 'full' && p.image && <img className="cs-hero-bg" src={p.image} alt="" />}
          <div className="cs-hero-copy">
            {t('title', 'h1', 'cs-h1')}
            {t('subtitle', 'p', 'cs-lead', true)}
            <span className="cs-btn">{t('cta', 'span', '')}</span>
          </div>
          {p.layout !== 'full' && <Img src={p.image} editing={editing} onChange={(image) => edit({ image })} className="cs-hero-img" />}
          {p.layout === 'full' && editing && <Img src={p.image} editing onChange={(image) => edit({ image })} className="cs-hero-swap" label="Imagem de fundo" />}
        </header>
      )
    case 'about':
      return (
        <section className="cs-sec cs-about">
          <div>
            {t('title', 'h2', 'cs-h2')}
            {t('text', 'p', 'cs-p', true)}
          </div>
          <Img src={p.image} editing={editing} onChange={(image) => edit({ image })} />
        </section>
      )
    case 'services':
    case 'faq':
    case 'testimonials':
    case 'pricing':
    case 'menu':
      return (
        <section className={`cs-sec cs-list is-${block.type}`}>
          {t('title', 'h2', 'cs-h2')}
          <div className="cs-grid">
            <Items
              block={block}
              edit={edit}
              editing={editing}
              render={(it, set, i) => (
                <article key={i} className="cs-item">
                  {block.type === 'testimonials' && <Icon name="quote" className="cs-quote" />}
                  <T as="h3" className="cs-h3" value={it.title} editing={editing} onChange={(v) => set({ title: v })} />
                  {it.price !== undefined && <T as="strong" className="cs-price" value={it.price} editing={editing} onChange={(v) => set({ price: v })} />}
                  <T as="p" className="cs-p" value={it.text} editing={editing} multiline onChange={(v) => set({ text: v })} />
                </article>
              )}
            />
          </div>
        </section>
      )
    case 'products':
    case 'team':
      return (
        <section className={`cs-sec cs-cards is-${block.type}`}>
          {t('title', 'h2', 'cs-h2')}
          <div className="cs-grid">
            <Items
              block={block}
              edit={edit}
              editing={editing}
              render={(it, set, i) => (
                <article key={i} className="cs-card">
                  <Img src={it.image} editing={editing} onChange={(image) => set({ image })} />
                  <T as="h3" className="cs-h3" value={it.title} editing={editing} onChange={(v) => set({ title: v })} />
                  {it.price !== undefined ? <T as="strong" className="cs-price" value={it.price} editing={editing} onChange={(v) => set({ price: v })} /> : <T as="p" className="cs-p" value={it.text} editing={editing} onChange={(v) => set({ text: v })} />}
                  {block.type === 'products' && <span className="cs-btn is-small">Comprar</span>}
                </article>
              )}
            />
          </div>
        </section>
      )
    case 'gallery': {
      const setImg = (i, v) => edit({ images: p.images.map((x, j) => (j === i ? v : x)) })
      return (
        <section className="cs-sec">
          {t('title', 'h2', 'cs-h2')}
          <div className="cs-gallery">
            {p.images.map((src, i) => (
              <Img key={i} src={src} editing={editing} onChange={(v) => setImg(i, v)} />
            ))}
          </div>
        </section>
      )
    }
    case 'booking':
      return (
        <section className="cs-sec cs-booking">
          <div>
            {t('title', 'h2', 'cs-h2')}
            {t('text', 'p', 'cs-p', true)}
          </div>
          <div className="cs-cal" aria-hidden="true">
            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d, i) => (
              <div key={d} className="cs-cal-day">
                <b>{d}</b>
                {['09:00', '10:30', '14:00', '16:30'].map((h, j) => (
                  <span key={h} className={(i + j) % 3 === 0 ? 'is-taken' : (i === 2 && j === 1 ? 'is-on' : '')}>{h}</span>
                ))}
              </div>
            ))}
          </div>
        </section>
      )
    case 'blog':
      return (
        <section className="cs-sec">
          {t('title', 'h2', 'cs-h2')}
          <div className="cs-grid">
            {[1, 2, 3].map((n) => (
              <article key={n} className="cs-card">
                <div className="cs-img is-empty"><span className="cs-img-ph"><Icon name="image" /></span></div>
                <h3 className="cs-h3">Título da publicação {n}</h3>
                <p className="cs-p">Você publica pelo painel.</p>
              </article>
            ))}
          </div>
        </section>
      )
    case 'login':
      return (
        <section className="cs-sec cs-login">
          <div>
            {t('title', 'h2', 'cs-h2')}
            {t('text', 'p', 'cs-p')}
          </div>
          <form className="cs-form" onSubmit={(e) => e.preventDefault()}>
            <label>E-mail<input disabled placeholder="voce@email.com" /></label>
            <label>Senha<input disabled type="password" placeholder="••••••" /></label>
            <span className="cs-btn">Entrar</span>
          </form>
        </section>
      )
    case 'model3d':
      return (
        <section className="cs-sec cs-3d">
          <div>
            {t('title', 'h2', 'cs-h2')}
            {t('text', 'p', 'cs-p')}
          </div>
          <div className="cs-3d-stage">
            <Suspense fallback={<div className="cs-3d-loading">Carregando 3D…</div>}>
              <Scene3D shape={p.shape} color={p.color} glb={p.glb} />
            </Suspense>
          </div>
        </section>
      )
    case 'map':
      return (
        <section className="cs-sec cs-map">
          <div>
            {t('title', 'h2', 'cs-h2')}
            {t('address', 'p', 'cs-p')}
          </div>
          <iframe title="Mapa" loading="lazy" src={`https://www.google.com/maps?q=${encodeURIComponent(p.address)}&output=embed`} />
        </section>
      )
    case 'contact':
      return (
        <section className="cs-sec cs-contact">
          <div>
            {t('title', 'h2', 'cs-h2')}
            {t('text', 'p', 'cs-p', true)}
          </div>
          <form className="cs-form" onSubmit={(e) => e.preventDefault()}>
            <label>Nome<input disabled placeholder="Seu nome" /></label>
            <label>Mensagem<textarea disabled rows="3" placeholder="Como podemos ajudar?" /></label>
            <span className="cs-btn">Enviar</span>
          </form>
        </section>
      )
    case 'footer':
      return <footer className="cs-footer">{t('text', 'p', '')}</footer>
    default:
      return null
  }
}

export default function SiteRenderer({ project, editing, selected, onSelect, onEdit, device }) {
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
  }
  return (
    <div className={`cs-site is-${device || 'desktop'}`} style={style}>
      <nav className="cs-nav">
        <strong>{project.name}</strong>
        <span>{project.blocks.filter((b) => !['hero', 'footer'].includes(b.type)).slice(0, 4).map((b) => b.props.title?.split(' ').slice(0, 2).join(' ')).join(' · ')}</span>
      </nav>
      {project.blocks.length === 0 && <div className="cs-empty">Nenhuma peça encaixada ainda. Escolha peças no painel.</div>}
      {project.blocks.map((b) => (
        <div
          key={b.id}
          className={`cs-block ${editing ? 'is-editing' : ''} ${selected === b.id ? 'is-selected' : ''}`}
          onClickCapture={() => editing && onSelect?.(b.id)}
          data-block={b.id}
          data-part={editing ? BLOCK_LABEL(b.type) : undefined}
        >
          <Section block={b} editing={editing} edit={(patch) => onEdit?.(b.id, patch)} />
        </div>
      ))}
    </div>
  )
}
