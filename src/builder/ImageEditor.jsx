import { useRef, useState } from 'react'
import Icon from '../components/Icon.jsx'
import { IMAGE_SHAPES, FILTERS, RATIOS, DEFAULT_IMG, applyShape, shapePreview, imageCss } from './imageStyle.js'
import { getPath, setPathPatch, readImage } from './SiteRenderer.jsx'

function Slider({ label, value, min, max, step = 1, unit = '', onChange }) {
  return (
    <label className="ie-slider">
      <span><b>{label}</b><em>{value}{unit}</em></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} />
    </label>
  )
}

const CORNERS = [
  ['Sup. esq.', 0, 4],
  ['Sup. dir.', 1, 5],
  ['Inf. dir.', 2, 6],
  ['Inf. esq.', 3, 7],
]

function allImagePaths(block) {
  const p = block.props
  const paths = []
  if ('image' in p) paths.push('image')
  if ('image2' in p) paths.push('image2')
  if (Array.isArray(p.images)) p.images.forEach((_, i) => paths.push(`images.${i}`))
  if (Array.isArray(p.items) && p.items[0] && 'image' in p.items[0]) p.items.forEach((_, i) => paths.push(`items.${i}.image`))
  return paths
}

export default function ImageEditor({ block, path, dispatch, onClose }) {
  const st = { ...DEFAULT_IMG, ...(block.props.media?.[path] || {}) }
  const src = getPath(block.props, path)
  const set = (patch) => dispatch({ type: 'media', blockId: block.id, path, patch })
  const [open, setOpen] = useState('shape')
  const input = useRef(null)
  const css = imageCss(st)

  const r = st.r || [0, 0, 0, 0, 0, 0, 0, 0]
  const setCorner = (h, v, val, linked) => {
    const next = [...r]
    if (linked) for (let i = 0; i < 4; i++) { next[i] = val; next[i + 4] = val }
    else { next[h] = val; next[v] = val }
    set({ r: next, clip: null, shape: 'custom', px: false })
  }
  const [linked, setLinked] = useState(false)

  const section = (id, title, children) => (
    <div className={`ie-sec ${open === id ? 'is-open' : ''}`}>
      <button className="ie-sec-head" onClick={() => setOpen(open === id ? '' : id)} aria-expanded={open === id}>
        {title}
        <Icon name={open === id ? 'up' : 'down'} size={14} />
      </button>
      {open === id && <div className="ie-sec-body">{children}</div>}
    </div>
  )

  return (
    <div className="ie">
      <div className="ie-head">
        <div>
          <span className="part-no">IMAGEM</span>
          <h3>Modelar a foto</h3>
        </div>
        <button className="b-icon" onClick={onClose} aria-label="Fechar editor de imagem"><Icon name="x" size={16} /></button>
      </div>

      <div className="ie-preview">
        <div className="ie-preview-frame" style={{ ...css.frame, aspectRatio: css.frame.aspectRatio || '4/3' }}>
          <div className="ie-preview-clip" style={css.clip}>
            {src ? <img src={src} alt="" style={css.img} /> : <span>Sem imagem</span>}
          </div>
        </div>
      </div>

      <div className="ie-actions">
        <button className="b-add" onClick={() => input.current.click()}><Icon name="upload" size={14} /> {src ? 'Trocar foto' : 'Enviar foto'}</button>
        <button className="b-add" onClick={() => dispatch({ type: 'media', blockId: block.id, path, reset: true })}><Icon name="reset" size={14} /> Resetar</button>
        <input ref={input} type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) try { dispatch({ type: 'props', id: block.id, patch: setPathPatch(block.props, path, await readImage(f)) }) } catch (err) { alert(err.message) } e.target.value = '' }} />
      </div>

      {section('shape', 'Formato', (
        <>
          <div className="ie-shapes">
            {IMAGE_SHAPES.map((s) => (
              <button key={s.id} className={st.shape === s.id ? 'is-on' : ''} onClick={() => set(applyShape(s.id))} title={s.label}>
                <i style={shapePreview(s)} />
                <small>{s.label}</small>
              </button>
            ))}
          </div>
          <span className="b-label">Proporção</span>
          <div className="b-seg is-wrap ie-ratios">
            {RATIOS.map(([v, l]) => <button key={v} className={st.ratio === v ? 'is-on' : ''} onClick={() => set({ ratio: v })}>{l}</button>)}
          </div>
        </>
      ))}

      {section('corners', 'Modelar cantos', (
        <>
          <label className="r-check is-sm"><input type="checkbox" checked={linked} onChange={(e) => setLinked(e.target.checked)} /> Mexer todos juntos</label>
          {CORNERS.map(([label, h, v]) => (
            <Slider key={label} label={label} value={Math.round(r[h])} min={0} max={100} unit="%" onChange={(val) => setCorner(h, v, val, linked)} />
          ))}
          <p className="b-hint">Combine os cantos para criar arcos, folhas, gotas e formas orgânicas.</p>
        </>
      ))}

      {section('frame', 'Enquadrar', (
        <>
          <Slider label="Zoom" value={st.zoom} min={100} max={300} unit="%" onChange={(zoom) => set({ zoom })} />
          <Slider label="Horizontal" value={st.x} min={0} max={100} unit="%" onChange={(x) => set({ x })} />
          <Slider label="Vertical" value={st.y} min={0} max={100} unit="%" onChange={(y) => set({ y })} />
          <Slider label="Girar" value={st.rotate} min={-180} max={180} unit="°" onChange={(rotate) => set({ rotate })} />
          <label className="r-check is-sm"><input type="checkbox" checked={st.flip} onChange={(e) => set({ flip: e.target.checked })} /> Espelhar</label>
          <p className="b-hint">Dica: com a foto selecionada, arraste direto nela para enquadrar.</p>
        </>
      ))}

      {section('filter', 'Filtros e cor', (
        <>
          <div className="ie-filters">
            {FILTERS.map((f) => (
              <button key={f.id} onClick={() => set({ brightness: 100, contrast: 100, saturate: 100, grayscale: 0, sepia: 0, ...f.f })}>
                <span style={{ backgroundImage: src ? `url(${src})` : undefined, filter: imageCss(f.f).img.filter }} />
                <small>{f.label}</small>
              </button>
            ))}
          </div>
          <Slider label="Brilho" value={st.brightness} min={40} max={160} unit="%" onChange={(brightness) => set({ brightness })} />
          <Slider label="Contraste" value={st.contrast} min={40} max={180} unit="%" onChange={(contrast) => set({ contrast })} />
          <Slider label="Saturação" value={st.saturate} min={0} max={220} unit="%" onChange={(saturate) => set({ saturate })} />
          <Slider label="Preto e branco" value={st.grayscale} min={0} max={100} unit="%" onChange={(grayscale) => set({ grayscale })} />
          <Slider label="Desfoque" value={st.blur} min={0} max={12} unit="px" onChange={(blur) => set({ blur })} />
          <Slider label="Escurecer" value={st.overlay} min={0} max={80} unit="%" onChange={(overlay) => set({ overlay })} />
          <Slider label="Opacidade" value={st.opacity} min={10} max={100} unit="%" onChange={(opacity) => set({ opacity })} />
        </>
      ))}

      {section('effects', 'Borda, sombra e 3D', (
        <>
          <Slider label="Borda" value={st.border} min={0} max={24} unit="px" onChange={(border) => set({ border })} />
          <label className="b-field is-row">
            <span className="b-label">Cor da borda</span>
            <input type="color" value={st.borderColor} onChange={(e) => set({ borderColor: e.target.value })} />
          </label>
          <Slider label="Sombra" value={st.shadow} min={0} max={60} onChange={(shadow) => set({ shadow })} />
          <Slider label="Inclinação 3D lateral" value={st.tilt} min={-35} max={35} unit="°" onChange={(tilt) => set({ tilt })} />
          <Slider label="Inclinação 3D vertical" value={st.tiltY} min={-35} max={35} unit="°" onChange={(tiltY) => set({ tiltY })} />
        </>
      ))}

      <button className="b-add ie-all" onClick={() => dispatch({ type: 'media-all', blockId: block.id, paths: allImagePaths(block), style: st })}>
        <Icon name="copy" size={14} /> Aplicar este estilo em todas as fotos da seção
      </button>
    </div>
  )
}
