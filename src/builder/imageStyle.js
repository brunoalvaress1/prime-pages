// Formatos e ajustes de imagem. Cada imagem do site guarda um objeto de estilo
// em block.props.media[caminho], onde caminho é 'image', 'images.2' ou 'items.1.image'.

// r = raios dos cantos em % no formato [h-tl, h-tr, h-br, h-bl, v-tl, v-tr, v-br, v-bl]
export const IMAGE_SHAPES = [
  { id: 'rect', label: 'Reto', r: [0, 0, 0, 0, 0, 0, 0, 0] },
  { id: 'soft', label: 'Suave', r: [6, 6, 6, 6, 6, 6, 6, 6] },
  { id: 'round', label: 'Arredondado', r: [14, 14, 14, 14, 14, 14, 14, 14] },
  { id: 'circle', label: 'Círculo', r: [50, 50, 50, 50, 50, 50, 50, 50], ratio: '1/1' },
  { id: 'oval', label: 'Oval', r: [50, 50, 50, 50, 50, 50, 50, 50] },
  { id: 'arch', label: 'Arco', r: [50, 50, 0, 0, 40, 40, 0, 0] },
  { id: 'half-top', label: 'Meia-lua cima', r: [50, 50, 0, 0, 100, 100, 0, 0], ratio: '2/1' },
  { id: 'half-bottom', label: 'Meia-lua baixo', r: [0, 0, 50, 50, 0, 0, 100, 100], ratio: '2/1' },
  { id: 'half-left', label: 'Meia-lua lado', r: [100, 0, 0, 100, 50, 0, 0, 50], ratio: '1/2' },
  { id: 'pill', label: 'Pílula', r: [999, 999, 999, 999, 999, 999, 999, 999], px: true },
  { id: 'leaf', label: 'Folha', r: [50, 0, 50, 0, 50, 0, 50, 0] },
  { id: 'drop', label: 'Gota', r: [50, 50, 0, 50, 50, 50, 0, 50], ratio: '1/1' },
  { id: 'blob', label: 'Orgânico', r: [30, 70, 70, 30, 30, 30, 70, 70] },
  { id: 'blob2', label: 'Orgânico 2', r: [63, 37, 54, 46, 55, 48, 52, 45] },
  { id: 'ticket', label: 'Recorte', clip: 'polygon(0 12%, 12% 0, 88% 0, 100% 12%, 100% 88%, 88% 100%, 12% 100%, 0 88%)' },
  { id: 'hex', label: 'Hexágono', clip: 'polygon(25% 3%, 75% 3%, 100% 50%, 75% 97%, 25% 97%, 0 50%)', ratio: '1.15/1' },
  { id: 'diamond', label: 'Losango', clip: 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%)', ratio: '1/1' },
  { id: 'slant', label: 'Inclinado', clip: 'polygon(0 0, 100% 8%, 100% 100%, 0 92%)' },
  { id: 'star', label: 'Estrela', clip: 'polygon(50% 0, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)', ratio: '1/1' },
]

export const FILTERS = [
  { id: 'none', label: 'Original', f: {} },
  { id: 'bw', label: 'P&B', f: { grayscale: 100, contrast: 110 } },
  { id: 'sepia', label: 'Sépia', f: { sepia: 70, contrast: 105 } },
  { id: 'vivid', label: 'Vívido', f: { saturate: 150, contrast: 110 } },
  { id: 'soft', label: 'Suave', f: { brightness: 108, contrast: 90, saturate: 85 } },
  { id: 'night', label: 'Noite', f: { brightness: 80, contrast: 120, saturate: 80 } },
  { id: 'warm', label: 'Quente', f: { sepia: 30, saturate: 120 } },
  { id: 'fade', label: 'Desbotado', f: { contrast: 80, brightness: 112, saturate: 70 } },
]

export const RATIOS = [
  ['auto', 'Padrão'],
  ['1/1', '1:1'],
  ['4/5', '4:5'],
  ['3/4', '3:4'],
  ['4/3', '4:3'],
  ['16/9', '16:9'],
  ['2/1', '2:1'],
]

export const DEFAULT_IMG = {
  shape: null,
  r: null, // cantos personalizados (sobrepõe o formato)
  clip: null,
  ratio: 'auto',
  zoom: 100,
  x: 50,
  y: 50,
  rotate: 0,
  flip: false,
  brightness: 100,
  contrast: 100,
  saturate: 100,
  grayscale: 0,
  sepia: 0,
  blur: 0,
  opacity: 100,
  border: 0,
  borderColor: '#ffffff',
  shadow: 0,
  tilt: 0,
  tiltY: 0,
  overlay: 0,
}

export function shapeById(id) {
  return IMAGE_SHAPES.find((s) => s.id === id)
}

export function applyShape(id) {
  const s = shapeById(id)
  if (!s) return {}
  return { shape: id, r: s.clip ? null : s.r, clip: s.clip || null, ratio: s.ratio || 'auto', px: !!s.px }
}

function radius(st) {
  const r = st.r
  if (!r) return undefined
  if (st.px) return '9999px'
  return `${r[0]}% ${r[1]}% ${r[2]}% ${r[3]}% / ${r[4]}% ${r[5]}% ${r[6]}% ${r[7]}%`
}

// Gera os estilos: frame (sombra), clip (formato), img (ajustes)
export function imageCss(raw) {
  const st = { ...DEFAULT_IMG, ...(raw || {}) }
  const frame = {}
  const clip = {}
  const img = {}
  if (st.ratio && st.ratio !== 'auto') frame.aspectRatio = st.ratio
  if (st.shadow) frame.filter = `drop-shadow(0 ${st.shadow * 0.5}px ${st.shadow}px rgba(0,0,0,${0.18 + st.shadow / 160}))`
  if (st.tilt || st.tiltY) frame.transform = `perspective(900px) rotateY(${st.tilt}deg) rotateX(${st.tiltY}deg)`
  const br = radius(st)
  if (br) clip.borderRadius = br
  if (st.clip) clip.clipPath = st.clip
  if (st.border) clip.boxShadow = `inset 0 0 0 ${st.border}px ${st.borderColor}`
  img.objectPosition = `${st.x}% ${st.y}%`
  const tf = []
  if (st.zoom !== 100) tf.push(`scale(${st.zoom / 100})`)
  if (st.rotate) tf.push(`rotate(${st.rotate}deg)`)
  if (st.flip) tf.push('scaleX(-1)')
  if (tf.length) {
    img.transform = tf.join(' ')
    img.transformOrigin = `${st.x}% ${st.y}%`
  }
  const f = []
  if (st.brightness !== 100) f.push(`brightness(${st.brightness}%)`)
  if (st.contrast !== 100) f.push(`contrast(${st.contrast}%)`)
  if (st.saturate !== 100) f.push(`saturate(${st.saturate}%)`)
  if (st.grayscale) f.push(`grayscale(${st.grayscale}%)`)
  if (st.sepia) f.push(`sepia(${st.sepia}%)`)
  if (st.blur) f.push(`blur(${st.blur}px)`)
  if (f.length) img.filter = f.join(' ')
  if (st.opacity !== 100) img.opacity = st.opacity / 100
  return { frame, clip, img, overlay: st.overlay, border: st.border, borderColor: st.borderColor }
}

// Preview pequeno do formato para os botões do editor
export function shapePreview(s) {
  if (s.clip) return { clipPath: s.clip }
  if (s.px) return { borderRadius: '999px' }
  const r = s.r
  return { borderRadius: `${r[0]}% ${r[1]}% ${r[2]}% ${r[3]}% / ${r[4]}% ${r[5]}% ${r[6]}% ${r[7]}%` }
}
