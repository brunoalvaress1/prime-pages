// Transforma o que foi lido do site (digest) ou o texto do cliente em um "spec"
// de site editável. Com ANTHROPIC_API_KEY, quem monta é o Claude; sem a chave,
// um montador por regras usa os dados reais extraídos.
import Anthropic from '@anthropic-ai/sdk'

export const BLOCK_TYPES = ['hero', 'marquee', 'about', 'services', 'stats', 'gallery', 'products', 'menu', 'booking', 'pricing', 'steps', 'team', 'testimonials', 'faq', 'blog', 'login', 'model3d', 'cta', 'map', 'contact', 'footer']
const SHAPES = ['none', 'knot', 'sphere', 'gem', 'capsule', 'rings', 'cluster', 'gear', 'wineglass', 'bottle', 'dumbbell', 'bag', 'house', 'box', 'torus', 'phone']
const FONTS = ['Manrope', 'DM Sans', 'Archivo', 'Space Grotesk', 'Bricolage Grotesque', 'Syne', 'Unbounded', 'Fraunces', 'Playfair Display', 'Cormorant Garamond', 'Inter', 'Montserrat', 'Poppins', 'Oswald', 'Bebas Neue', 'Lora', 'Libre Baskerville', 'Raleway', 'Work Sans', 'Outfit']

const str = { type: 'string' }
const int = { type: 'integer' }
const obj = (properties) => ({ type: 'object', properties, required: Object.keys(properties), additionalProperties: false })

export const SPEC_SCHEMA = obj({
  name: str,
  segment: str,
  summary: str,
  theme: obj({
    bg: str,
    surface: str,
    text: str,
    muted: str,
    accent: str,
    font: { type: 'string', enum: FONTS },
    headingFont: { type: 'string', enum: FONTS },
    radius: int,
    button: { type: 'string', enum: ['solid', 'pill', 'outline'] },
    headCase: { type: 'string', enum: ['normal', 'tight', 'upper'] },
  }),
  imageQuery: str,
  float3d: obj({ shape: { type: 'string', enum: SHAPES }, material: { type: 'string', enum: ['glossy', 'metal', 'glass', 'matte'] }, color: str }),
  sections: {
    type: 'array',
    items: obj({
      type: { type: 'string', enum: BLOCK_TYPES },
      layout: str,
      kicker: str,
      title: str,
      subtitle: str,
      text: str,
      cta: str,
      cta2: str,
      image: int,
      image2: int,
      images: { type: 'array', items: int },
      items: { type: 'array', items: obj({ title: str, text: str, price: str, image: int }) },
      bg: { type: 'string', enum: ['auto', 'base', 'surface', 'accent', 'dark', 'light'] },
      align: { type: 'string', enum: ['left', 'center'] },
    }),
  },
})

const LAYOUTS = 'hero: split | full | center | editorial | 3d. about: split | reverse | stacked. services: cards | list | images. gallery: grid | bento | strip. Outros tipos: deixe layout vazio.'

const SYSTEM = `Você é o diretor de arte e redator da Prime Page, uma agência de sites de Leme-SP.
Seu trabalho: transformar a leitura de um site de referência (ou o pedido em texto de um cliente) em um site editável montado com as peças do nosso construtor.

Regras:
- Fidelidade ao original vem primeiro quando há um site de referência: mesma paleta (fundo, superfícies, texto, cor de destaque), mesmo clima de tipografia (escolha da lista a fonte mais parecida em categoria: serifada, geométrica, condensada, grotesca), a mesma ordem e intenção das seções, os textos reais (traduza para português do Brasil quando o original estiver em outro idioma, mantendo nomes de produtos e marcas).
- Se o site bloqueou a leitura automática, use o que você sabe sobre a marca e o que a pesquisa trouxer. Nunca invente que leu algo que não leu: diga no "summary" de onde veio cada parte.
- Imagens: use apenas índices da lista "images" fornecida (0 = primeira). Escolha a imagem certa para cada lugar pelo texto alternativo e pela URL (fotos grandes de herói para a capa, produtos para cartões). Use -1 quando não houver imagem adequada. Não repita a mesma imagem em lugares vizinhos.
- Monte de 7 a 12 seções. Sempre comece com "hero" e termine com "footer". Use as peças que o original realmente tem (loja com preço → products; reserva/agendamento → booking; cardápio → menu; login/área do cliente → login).
- Layouts permitidos: ${LAYOUTS}
- "items" só para services, stats, products, menu, pricing, steps, team, testimonials, faq (3 a 6 itens). Para os outros tipos, devolva lista vazia.
- Cores em hexadecimal #rrggbb. "bg" de cada seção alterna o ritmo do original (ex.: faixas escuras e claras). radius em px (0 a 28).
- "float3d": um objeto 3D que combine com o negócio (ex.: carro de luxo → gem ou rings em metal; restaurante → wineglass em vidro). Use "none" quando o original for sóbrio e não pedir 3D.
- "imageQuery": 2 a 4 palavras em inglês para buscar fotos parecidas num banco de imagens abertas, caso faltem fotos.
- Textos curtos e reais, sem frases genéricas de modelo. Campos que não se aplicam ficam como string vazia.`

function digestForPrompt(scan) {
  const d = scan.digest
  if (!d) return { host: scan.host, url: scan.url, readable: false }
  return {
    host: scan.host,
    url: scan.url,
    readVia: scan.source,
    title: d.title,
    description: d.description,
    siteName: d.siteName,
    lang: d.lang,
    nav: d.nav,
    ctas: d.ctas,
    headings: d.headings,
    paragraphs: d.paragraphs.slice(0, 18),
    sections: d.sections,
    features: d.features,
    contact: d.contact,
    colors: d.colors,
    fonts: d.fonts,
    images: d.images.map((im, i) => `${i}: ${im.url}${im.alt ? '  [' + im.alt + ']' : ''}`),
  }
}

export const hasAI = () => !!(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN)

export async function aiSpec({ mode, input, scan, extra }) {
  const client = new Anthropic()
  const blocked = mode === 'url' && (!scan?.digest || scan.source === 'blocked')
  const payload =
    mode === 'url'
      ? `Site de referência para copiar como base:\n${JSON.stringify(digestForPrompt(scan), null, 1)}${extra ? '\n\nInformações públicas encontradas sobre a marca:\n' + JSON.stringify(extra, null, 1) : ''}${blocked ? '\n\nO site bloqueou a leitura automática. Pesquise a marca na web (até 3 buscas) para acertar cores, tom, produtos e estrutura da página inicial.' : ''}`
      : `Pedido do cliente (monte o site a partir disto):\n"""${input}"""\n\nFotos disponíveis:\n${JSON.stringify((extra?.images || []).map((im, i) => `${i}: ${im.url}  [${im.alt}]`))}`

  const params = {
    model: 'claude-opus-5-5',
    max_tokens: 16000,
    system: SYSTEM,
    output_config: { effort: 'medium', format: { type: 'json_schema', schema: SPEC_SCHEMA } },
    messages: [{ role: 'user', content: payload }],
  }
  if (blocked) params.tools = [{ type: 'web_search_20260209', name: 'web_search', max_uses: 3 }]

  let msg
  try {
    msg = await client.messages.stream(params).finalMessage()
  } catch (e) {
    // se a combinação busca + formato não for aceita, tenta sem a busca
    if (params.tools && e instanceof Anthropic.BadRequestError) {
      delete params.tools
      msg = await client.messages.stream(params).finalMessage()
    } else throw e
  }
  if (msg.stop_reason === 'refusal') throw new Error('A IA recusou montar esse site.')
  const text = msg.content.filter((b) => b.type === 'text').map((b) => b.text).join('')
  const start = text.indexOf('{')
  return JSON.parse(text.slice(start))
}

// ---------- montador por regras (sem chave de IA) ----------
const hex = (c) => (/^#[0-9a-f]{6}$/i.test(c || '') ? c.toLowerCase() : '')
function lumHex(h) {
  const n = parseInt(h.slice(1), 16)
  const f = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4))
  return 0.2126 * f((n >> 16) & 255) + 0.7152 * f((n >> 8) & 255) + 0.0722 * f(n & 255)
}
function mix(a, b, t) {
  const pa = parseInt(a.slice(1), 16)
  const pb = parseInt(b.slice(1), 16)
  const ch = (s) => Math.round((((pa >> s) & 255) * (1 - t)) + (((pb >> s) & 255) * t)).toString(16).padStart(2, '0')
  return '#' + ch(16) + ch(8) + ch(0)
}
function guessFont(list) {
  const f = list.join(' ').toLowerCase()
  const direct = FONTS.find((x) => f.includes(x.toLowerCase()))
  if (direct) return direct
  if (/garamond|didot|bodoni|serif|times|baskerville|caslon|playfair/.test(f)) return 'Playfair Display'
  if (/condensed|oswald|bebas|veneer|compressed|narrow|impact/.test(f)) return 'Oswald'
  if (/mono/.test(f)) return 'Space Grotesk'
  if (/futura|geometric|avenir|gotham|montserrat|circular|product sans/.test(f)) return 'Montserrat'
  return 'Inter'
}

export function heuristicSpec(scan, extra) {
  const d = scan.digest || { title: '', description: '', headings: [], paragraphs: [], sections: [], images: [], features: {}, colors: { accents: [], neutrals: [] }, fonts: { declared: [], google: [] }, ctas: [], nav: [], contact: {} }
  const brand = (d.siteName || d.title.split(/[|\-–—:·]/)[0] || scan.host.split('.')[0]).replace(/\b(official|oficial|site|website|home|página inicial|homepage)\b/gi, '').replace(/\s+/g, ' ').trim() || scan.host.split('.')[0]
  const name = brand.length > 3 && brand === brand.toUpperCase() ? brand : brand.replace(/\b\w/g, (c) => c.toUpperCase())
  const neutrals = (d.colors.neutrals || []).map(hex).filter(Boolean)
  const noColors = !neutrals.length && !(d.colors.accents || []).length
  const accent = hex(d.colors.theme) && lumHex(hex(d.colors.theme)) < 0.85 && lumHex(hex(d.colors.theme)) > 0.02 ? hex(d.colors.theme) : hex(d.colors.accents?.[0]) || (noColors ? '#c8ccd4' : '#1f6fff')
  // sem cores legíveis (site bloqueou): base escura e sóbria, que funciona para marcas premium
  const bg = hex(d.colors.body) || neutrals[0] || (noColors ? '#0b0b0c' : '#ffffff')
  const dark = lumHex(bg) < 0.25
  const text = dark ? '#f2f2f0' : '#121316'
  const head = guessFont([...(d.fonts.google || []), ...(d.fonts.declared || [])])
  const H = d.headings.map((h) => h.t)
  const P = d.paragraphs
  const cta = d.ctas[0] || 'Saiba mais'
  let img = 0
  const nextImg = () => (img < d.images.length ? img++ : -1)
  const S = []
  const blank = { layout: '', kicker: '', title: '', subtitle: '', text: '', cta: '', cta2: '', image: -1, image2: -1, images: [], items: [], bg: 'auto', align: 'left' }
  const push = (s) => S.push({ ...blank, ...s })

  push({ type: 'hero', layout: d.images.length ? 'full' : '3d', kicker: d.nav.slice(0, 3).join(' · '), title: H[0] || name, subtitle: d.description || P[0] || '', cta, cta2: d.ctas[1] || '', image: nextImg() })
  const secs = d.sections.filter((s) => s.heading && s.heading !== H[0]).slice(0, 8)
  for (const s of secs) {
    const priced = s.prices.length >= 2
    if (priced && s.items.length >= 2) push({ type: 'products', title: s.heading, items: s.items.slice(0, 6).map((t, i) => ({ title: t, text: '', price: s.prices[i] || '', image: nextImg() })) })
    else if (s.hasMap) push({ type: 'map', title: s.heading })
    else if (s.hasForm) push({ type: 'contact', title: s.heading, text: s.paras[0] || '' })
    else if (s.items.length >= 3) push({ type: 'services', layout: s.imgCount >= 3 ? 'images' : 'cards', title: s.heading, items: s.items.slice(0, 6).map((t) => ({ title: t, text: '', price: '', image: s.imgCount >= 3 ? nextImg() : -1 })) })
    else if (s.imgCount >= 4) push({ type: 'gallery', layout: 'bento', title: s.heading, images: [nextImg(), nextImg(), nextImg(), nextImg(), nextImg(), nextImg()].filter((x) => x >= 0) })
    else push({ type: 'about', layout: S.filter((x) => x.type === 'about').length % 2 ? 'reverse' : 'split', title: s.heading, text: s.paras.join(' ') || P[S.length] || '', image: s.imgCount ? nextImg() : -1 })
  }
  if (S.length < 4 && H.length > 2) {
    push({ type: 'about', layout: 'split', title: H[1], text: P.slice(1, 3).join(' '), image: nextImg() })
    if (H.length > 4) push({ type: 'services', layout: 'cards', title: H[2], items: H.slice(3, 7).map((t, i) => ({ title: t, text: P[3 + i] || '', price: '', image: -1 })) })
  }
  if (extra?.summary && S.length < 3) push({ type: 'about', layout: 'split', title: `Sobre ${name}`, text: extra.summary, image: nextImg() })
  if (d.images.length - img >= 4) push({ type: 'gallery', layout: 'bento', title: 'Galeria', images: Array.from({ length: Math.min(6, d.images.length - img) }, nextImg) })
  if (d.features.booking && !S.some((s) => s.type === 'booking')) push({ type: 'booking', title: 'Agende agora', text: '' })
  if (d.features.login) push({ type: 'login', title: 'Área do cliente', text: 'Entre para ver pedidos e reservas.' })
  push({ type: 'cta', title: H[H.length - 1] && H.length > 3 ? H[H.length - 1] : `Fale com a ${name}`, text: '', cta, bg: 'accent', align: 'center' })
  push({ type: 'footer', text: `© ${name}. ${d.contact.address || ''}`.trim() })

  return {
    name,
    segment: '',
    summary:
      scan.source === 'blocked'
        ? `${scan.host} bloqueia leitura automática. Montamos a base com dados públicos da marca.`
        : scan.source === 'reader'
          ? `${scan.host} bloqueia robôs; lemos pela versão renderizada: ${d.headings.length} títulos e ${d.images.length} imagens${noColors ? ' (cores não disponíveis, usamos base escura)' : ''}.`
          : `Lido direto de ${scan.host}: ${d.headings.length} títulos, ${d.images.length} imagens, cores e fontes do próprio site.`,
    theme: { bg, surface: dark ? mix(bg, '#ffffff', 0.06) : mix(bg, '#000000', 0.035), text, muted: mix(text, bg, 0.4), accent, font: head === 'Playfair Display' ? 'Inter' : head, headingFont: head, radius: noColors ? 2 : 8, button: noColors ? 'outline' : 'solid', headCase: noColors ? 'upper' : 'tight' },
    imageQuery: name,
    float3d: { shape: 'none', material: 'glossy', color: accent },
    sections: S,
  }
}

// Busca dados públicos da marca (Wikipédia) quando o site bloqueia leitura.
export async function brandFacts(host) {
  const term = host.replace(/^www\./, '').split('.')[0]
  for (const lang of ['pt', 'en']) {
    try {
      const r = await fetch(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(term.charAt(0).toUpperCase() + term.slice(1))}`, { headers: { 'user-agent': 'PrimePageBuilder/1.0' } })
      if (!r.ok) continue
      const j = await r.json()
      if (j.extract) return { title: j.title, summary: j.extract, image: j.originalimage?.source || j.thumbnail?.source || '' }
    } catch {
      /* segue */
    }
  }
  return null
}
