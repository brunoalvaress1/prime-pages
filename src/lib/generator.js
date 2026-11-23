// Camada de geração. Hoje roda uma SIMULAÇÃO local por regras.
// Quando a IA for ligada, defina VITE_GENERATOR_ENDPOINT (ex.: Supabase Edge Function)
// que receba { mode: 'url' | 'prompt', input } e devolva { name, themeKey, theme, blocks, analysis }.

import { makeBlock } from '../data/blocks.js'
import { TEMPLATES, THEMES } from '../data/templates.js'

const ENDPOINT = import.meta.env.VITE_GENERATOR_ENDPOINT

const SEGMENTS = [
  { tpl: 'restaurante', words: ['restaurante', 'pizza', 'pizzaria', 'lanche', 'hamburg', 'burger', 'bar', 'comida', 'cardapio', 'cardápio', 'delivery', 'padaria', 'cafe', 'café', 'sushi', 'food', 'bistro'] },
  { tpl: 'clinica', words: ['clinica', 'clínica', 'dentista', 'odonto', 'medic', 'médic', 'saude', 'saúde', 'psicolog', 'fisio', 'nutri', 'vet', 'hospital', 'consultorio', 'consultório', 'health'] },
  { tpl: 'salao', words: ['salao', 'salão', 'barbearia', 'barber', 'estetica', 'estética', 'beleza', 'unha', 'manicure', 'cabelo', 'spa', 'beauty', 'sobrancelha'] },
  { tpl: 'loja', words: ['loja', 'roupa', 'moda', 'vender', 'venda', 'produto', 'ecommerce', 'e-commerce', 'shop', 'store', 'boutique', 'calçado', 'modas'] },
  { tpl: 'oficina', words: ['oficina', 'mecanica', 'mecânica', 'carro', 'auto', 'moto', 'pneu', 'funilaria', 'logistic', 'transporte', 'frota'] },
  { tpl: 'advocacia', words: ['advoga', 'advocacia', 'juridic', 'jurídic', 'contab', 'contador', 'law', 'consultoria', 'imobiliaria', 'imobiliária'] },
  { tpl: 'academia', words: ['academia', 'personal', 'pilates', 'crossfit', 'fitness', 'gym', 'treino', 'yoga', 'dança'] },
  { tpl: 'imobiliaria', words: ['imobiliaria', 'imobiliária', 'imovel', 'imóvel', 'imoveis', 'imóveis', 'arquitet', 'construtora', 'engenharia', 'interiores', 'casa', 'apartamento'] },
  { tpl: 'tech', words: ['startup', 'saas', 'software', 'app', 'aplicativo', 'tecnologia', 'tech', 'plataforma', 'sistema'] },
  { tpl: 'landing', words: ['curso', 'infoproduto', 'lançamento', 'mentoria', 'ebook', 'landing', 'freelancer', 'evento', 'eventos', 'festa'] },
]

const FEATURES = [
  { block: 'booking', words: ['agenda', 'agendamento', 'horário', 'horario', 'marcar', 'reserva'] },
  { block: 'products', words: ['pagamento', 'pagar', 'pix', 'cartão', 'vender online', 'loja virtual', 'carrinho', 'checkout'] },
  { block: 'model3d', words: ['3d', 'tridimensional', 'girar', 'interativo'] },
  { block: 'login', words: ['login', 'área do cliente', 'area do cliente', 'conta', 'senha', 'membros', 'aluno'] },
  { block: 'blog', words: ['blog', 'notícia', 'noticia', 'artigo', 'publicar'] },
  { block: 'map', words: ['mapa', 'endereço', 'endereco', 'localização', 'como chegar'] },
  { block: 'testimonials', words: ['depoimento', 'avaliação', 'avaliacoes', 'avaliações', 'review'] },
  { block: 'gallery', words: ['galeria', 'fotos', 'portfólio', 'portfolio', 'imagens'] },
  { block: 'menu', words: ['cardápio', 'cardapio', 'menu'] },
  { block: 'team', words: ['equipe', 'time', 'profissionais', 'quem somos'] },
  { block: 'pricing', words: ['plano', 'planos', 'pacote', 'mensalidade', 'preços', 'precos'] },
  { block: 'faq', words: ['dúvida', 'duvida', 'perguntas', 'faq'] },
]

const COLORS = [
  { words: ['azul'], hex: '#1f6fff' },
  { words: ['verde'], hex: '#14897a' },
  { words: ['vermelho'], hex: '#d63a2f' },
  { words: ['rosa'], hex: '#c2526b' },
  { words: ['roxo', 'lilás', 'lilas'], hex: '#7b4dd6' },
  { words: ['laranja'], hex: '#e0782c' },
  { words: ['amarelo'], hex: '#f2b705' },
  { words: ['dourado', 'ouro'], hex: '#b08a3e' },
  { words: ['preto'], hex: '#111111' },
]

const has = (text, words) => words.some((w) => text.includes(w))
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

function hashHue(s) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) % 360
  return h
}

function hslHex(h, s, l) {
  s /= 100
  l /= 100
  const k = (n) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return '#' + [f(0), f(8), f(4)].map((x) => Math.round(x * 255).toString(16).padStart(2, '0')).join('')
}

function titleFromHost(host) {
  const base = host.replace(/^www\./, '').split('.')[0].replace(/[-_]+/g, ' ')
  return base.replace(/\b\w/g, (c) => c.toUpperCase())
}

export function normalizeUrl(raw) {
  const t = raw.trim()
  if (!t) return null
  try {
    const u = new URL(/^https?:\/\//i.test(t) ? t : 'https://' + t)
    if (!u.hostname.includes('.')) return null
    return u
  } catch {
    return null
  }
}

function fromTemplate(tplId, themeKey) {
  const tpl = TEMPLATES.find((t) => t.id === tplId) || TEMPLATES.find((t) => t.id === 'landing')
  return { tpl, blocks: tpl.blocks(), themeKey: themeKey || tpl.theme }
}

// ---- spec do servidor → peças do construtor ----
const ITEM_TYPES = ['services', 'stats', 'products', 'menu', 'pricing', 'steps', 'team', 'testimonials', 'faq']
const LAYOUT_OK = { video: ['wide', 'split'], hero: ['split', 'full', 'center', 'editorial', '3d'], about: ['split', 'reverse', 'stacked'], services: ['cards', 'list', 'images'], gallery: ['grid', 'bento', 'strip'] }

export function specToProject(spec, images = [], videos = []) {
  const pic = (i) => (Number.isInteger(i) && i >= 0 && images[i] ? images[i] : '')
  const vid = (i) => (Number.isInteger(i) && i >= 0 && videos[i] ? videos[i] : null)
  const f3 = spec.float3d && spec.float3d.shape && spec.float3d.shape !== 'none' ? spec.float3d : null
  const blocks = []
  for (const s of spec.sections || []) {
    if (!BLOCKS_OK.has(s.type)) continue
    const p = {}
    for (const k of ['title', 'subtitle', 'text', 'cta']) if (s[k]) p[k] = s[k]
    p.kicker = s.kicker || ''
    if (s.type === 'hero') {
      p.cta2 = s.cta2 || ''
      p.subtitle = s.subtitle || '' // sem o texto de exemplo do modelo
    }
    if (s.type === 'about' && !p.text) p.text = s.subtitle || ''
    if (LAYOUT_OK[s.type]?.includes(s.layout)) p.layout = s.layout
    if (pic(s.image)) p.image = pic(s.image)
    if (s.type === 'about' && pic(s.image2)) {
      p.image2 = pic(s.image2)
      p.showImage2 = true
    }
    if (s.type === 'gallery') {
      const g = (s.images || []).map(pic).filter(Boolean)
      if (g.length) p.images = g.length >= 3 ? g.slice(0, 8) : [...g, ...images.filter((u) => !g.includes(u)).slice(0, 3 - g.length)]
    }
    if (ITEM_TYPES.includes(s.type) && s.items?.length) {
      p.items = s.items.slice(0, 8).map((it) => {
        const o = { title: it.title || '', text: it.text || '' }
        if (['products', 'menu', 'pricing'].includes(s.type)) o.price = it.price || ''
        if (['services', 'products', 'team'].includes(s.type)) o.image = pic(it.image)
        return o
      })
    }
    if (s.type === 'hero' && f3) {
      if (p.layout === '3d') Object.assign(p, { shape: f3.shape, color: f3.color })
      else p.float3d = { shape: f3.shape, material: f3.material, color: f3.color, pos: 'right' }
    }
    const v = vid(s.video)
    if (v && (s.type === 'hero' || s.type === 'video')) {
      p.video = v.url
      if (s.type === 'video' && v.poster) p.poster = v.poster
      if (s.type === 'hero' && !p.image && v.poster) p.image = v.poster
      if (s.type === 'hero' && !['full', 'split', 'editorial'].includes(p.layout)) p.layout = 'full'
    }
    if (s.type === 'video' && !p.video) continue // seção de vídeo sem vídeo não serve
    if (s.type === 'hero' && p.layout === 'full' && p.image) p.media = { image: { overlay: 40 } }
    p.style = { bg: s.bg || 'auto', align: s.align || 'left', ...(s.type === 'hero' ? { pad: 'l' } : {}) }
    blocks.push(makeBlock(s.type, p))
  }
  if (!blocks.some((b) => b.type === 'footer')) blocks.push(makeBlock('footer', { text: `© ${spec.name}` }))
  const t = spec.theme || {}
  const theme = { ...THEMES.prime, ...t, name: 'Do site', radius: Number.isFinite(t.radius) ? t.radius : 12 }
  return { name: spec.name || 'Meu site', themeKey: 'custom', theme, blocks }
}
const BLOCKS_OK = new Set(['hero', 'marquee', 'about', 'services', 'stats', 'gallery', 'products', 'menu', 'booking', 'pricing', 'steps', 'team', 'testimonials', 'faq', 'blog', 'login', 'model3d', 'video', 'cta', 'map', 'contact', 'footer'])

async function callServer(body, onStep, steps) {
  let i = 0
  onStep?.(steps[0])
  const timer = setInterval(() => {
    i = Math.min(i + 1, steps.length - 1)
    onStep?.(steps[i])
  }, 2600)
  try {
    const res = await fetch(ENDPOINT || '/api/generate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
    const ct = res.headers.get('content-type') || ''
    if (!ct.includes('json')) return null // sem servidor (ex.: hospedagem estática): usa o modo local
    const j = await res.json()
    if (!res.ok) throw new Error(j.error || 'Não conseguimos montar agora.')
    return j
  } catch (e) {
    if (e instanceof TypeError) return null
    throw e
  } finally {
    clearInterval(timer)
  }
}

// ---- Engenharia reversa por URL ----
export async function analyzeUrl(raw, onStep) {
  const url = normalizeUrl(raw)
  if (!url) throw new Error('Esse endereço não parece um site. Confira e tente de novo, ex.: www.seusite.com.br')

  const r = await callServer({ mode: 'url', input: url.href }, onStep, [
    `Conectando em ${url.hostname}`,
    'Baixando a página e as folhas de estilo',
    'Extraindo textos, imagens, cores e fontes',
    'Identificando as seções na ordem do original',
    'A IA está montando o kit com base no site',
    'Ajustando paleta e tipografia',
    'Quase lá…',
  ])
  if (r?.spec) {
    const proj = specToProject(r.spec, r.images, r.videos)
    onStep?.(`Pronto: ${proj.blocks.length} seções montadas`)
    return { ...proj, analysis: { ...r.meta, host: url.hostname, summary: r.spec.summary, sections: proj.blocks.map((b) => b.type), palette: [proj.theme.bg, proj.theme.surface, proj.theme.accent, proj.theme.text], font: proj.theme.headingFont } }
  }

  const text = (url.hostname + url.pathname).toLowerCase()
  const seg = SEGMENTS.find((s) => has(text, s.words))
  const { tpl, blocks, themeKey } = fromTemplate(seg?.tpl || 'landing')
  const name = titleFromHost(url.hostname)
  const hue = hashHue(url.hostname)
  const accent = hslHex(hue, 72, 48)

  const steps = [
    `Conectando em ${url.hostname}`,
    'Lendo a estrutura da página',
    `Identificadas ${blocks.length} seções`,
    'Extraindo paleta de cores e tipografia',
    'Mapeando textos, imagens e chamadas',
    'Montando o kit editável',
  ]
  for (const s of steps) {
    onStep?.(s)
    await wait(520)
  }

  const hero = blocks.find((b) => b.type === 'hero')
  if (hero) hero.props.title = name
  return {
    name,
    themeKey,
    theme: { ...THEMES[themeKey], accent },
    blocks,
    analysis: {
      simulated: true,
      host: url.hostname,
      segment: tpl.segment,
      sections: blocks.map((b) => b.type),
      palette: [THEMES[themeKey].bg, THEMES[themeKey].surface, accent, THEMES[themeKey].text],
      font: THEMES[themeKey].font,
    },
  }
}

// ---- Geração por texto ----
export async function generateFromPrompt(prompt, onStep) {
  const text = prompt.toLowerCase().trim()
  if (text.length < 12) throw new Error('Escreva um pouco mais: que tipo de negócio é e o que o site precisa ter.')

  const r = await callServer({ mode: 'prompt', input: prompt }, onStep, ['Lendo o seu pedido', 'A IA está entendendo o negócio', 'Escolhendo seções e textos', 'Buscando fotos que combinam', 'Aplicando cores e fontes', 'Quase lá…'])
  if (r?.spec) {
    const proj = specToProject(r.spec, r.images)
    return { ...proj, analysis: { ...r.meta, summary: r.spec.summary, segment: r.spec.segment } }
  }

  const seg = SEGMENTS.find((s) => has(text, s.words))
  let themeKey
  if (has(text, ['escuro', 'dark', 'preto e'])) themeKey = 'prime'
  else if (has(text, ['claro', 'branco', 'clean', 'minimalista'])) themeKey = 'claro'
  const { tpl, blocks, themeKey: tk } = fromTemplate(seg?.tpl || 'landing', themeKey)

  const wanted = FEATURES.filter((f) => has(text, f.words) && !blocks.some((b) => b.type === f.block))
  const footerIdx = blocks.findIndex((b) => b.type === 'footer')
  wanted.forEach((f) => blocks.splice(footerIdx < 0 ? blocks.length : footerIdx, 0, makeBlock(f.block)))

  const color = COLORS.find((c) => has(text, c.words))
  const theme = { ...THEMES[tk], ...(color ? { accent: color.hex } : {}) }

  const steps = ['Entendendo o seu negócio', `Segmento: ${tpl.segment}`, wanted.length ? `Adicionando: ${wanted.map((w) => w.block).join(', ')}` : 'Escolhendo as seções', 'Aplicando cores e fontes', 'Montando o kit editável']
  for (const s of steps) {
    onStep?.(s)
    await wait(480)
  }

  return { name: `Site de ${tpl.segment.toLowerCase()}`, themeKey: tk, theme, blocks, analysis: { simulated: true, segment: tpl.segment, added: wanted.map((w) => w.block) } }
}
