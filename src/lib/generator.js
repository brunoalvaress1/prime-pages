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

// ---- Engenharia reversa por URL ----
export async function analyzeUrl(raw, onStep) {
  const url = normalizeUrl(raw)
  if (!url) throw new Error('Esse endereço não parece um site. Confira e tente de novo, ex.: www.seusite.com.br')

  if (ENDPOINT) {
    onStep?.('Enviando para análise…')
    const res = await fetch(ENDPOINT, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mode: 'url', input: url.href }) })
    if (!res.ok) throw new Error('Não conseguimos analisar esse site agora. Tente outro endereço ou comece por um modelo.')
    return await res.json()
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

  if (ENDPOINT) {
    onStep?.('Interpretando o pedido…')
    const res = await fetch(ENDPOINT, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mode: 'prompt', input: prompt }) })
    if (!res.ok) throw new Error('Não conseguimos gerar agora. Tente de novo em instantes.')
    return await res.json()
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
