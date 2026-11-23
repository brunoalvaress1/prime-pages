// Transforma o que foi lido do site (digest) ou o texto do cliente em um "spec"
// de site editável. Com ANTHROPIC_API_KEY, quem monta é o Claude; sem a chave,
// um montador por regras usa os dados reais extraídos.
import Anthropic from '@anthropic-ai/sdk'

export const BLOCK_TYPES = ['hero', 'marquee', 'about', 'services', 'stats', 'gallery', 'products', 'menu', 'booking', 'pricing', 'steps', 'team', 'testimonials', 'faq', 'blog', 'login', 'model3d', 'video', 'carousel', 'cta', 'map', 'contact', 'footer']
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
      video: int,
      images: { type: 'array', items: int },
      items: { type: 'array', items: obj({ title: str, text: str, price: str, image: int }) },
      bg: { type: 'string', enum: ['auto', 'base', 'surface', 'accent', 'dark', 'light'] },
      align: { type: 'string', enum: ['left', 'center'] },
    }),
  },
})

const LAYOUTS = 'hero: split | full | center | editorial | 3d. about: split | reverse | stacked. services: cards | list | images | feature (linhas grandes com foto em zigue-zague) | bento (mosaico com texto sobre a foto). gallery: grid | bento | strip | marquee (duas faixas de fotos passando). carousel: coverflow | 3d | slider. video: wide | split. Outros tipos: deixe layout vazio.'

const SYSTEM = `Você é o diretor de arte e redator da Prime Page, uma agência de sites de Leme-SP.
Seu trabalho: transformar a leitura de um site de referência (ou o pedido em texto de um cliente) em um site editável montado com as peças do nosso construtor.

Método (das skills recreate e impeccable que a equipe usa):
1. Identidade antes de conteúdo: descubra a paleta real (fundo dominante, superfícies, texto, UMA cor de destaque), a família tipográfica (serifada, geométrica, condensada, grotesca), o tom (luxo, popular, técnico, acolhedor) e o ritmo (faixas claras/escuras, muito ou pouco respiro).
2. Estrutura: siga a ordem e a intenção das seções do original. Não invente seções que o site não tem só para encher.
3. Conteúdo real: títulos e textos do próprio site, curtos, em português do Brasil. Descarte textos de banner de cookies, menus e botões de fechar.
4. Mídia: a melhor foto em cada lugar e o vídeo onde o original usa vídeo.
5. Acabamento sem cara de IA: nada de "kicker" em toda seção, nada de cards iguais repetidos sem motivo, contraste de texto legível, botões no estilo do original (cheio, contorno ou pílula), cantos (radius) iguais aos do original.

Regras:
- Fidelidade ao original vem primeiro quando há um site de referência: mesma paleta (fundo, superfícies, texto, cor de destaque), mesmo clima de tipografia (escolha da lista a fonte mais parecida em categoria: serifada, geométrica, condensada, grotesca), a mesma ordem e intenção das seções, os textos reais (traduza para português do Brasil quando o original estiver em outro idioma, mantendo nomes de produtos e marcas).
- Se o site bloqueou a leitura automática, use o que você sabe sobre a marca e o que a pesquisa trouxer. Nunca invente que leu algo que não leu: diga no "summary" de onde veio cada parte.
- Imagens: use apenas índices da lista "images" fornecida (0 = primeira). Escolha a imagem certa para cada lugar pelo texto alternativo e pela URL (fotos grandes de herói para a capa, produtos para cartões). Use -1 quando não houver imagem adequada. Não repita a mesma imagem em lugares vizinhos.
- Vídeos: use apenas índices da lista "videos" (0 = primeiro) no campo "video" da seção; -1 quando não houver. Vídeo marcado [fundo] (autoplay, sem som) que aparece na capa: coloque no "hero" com layout "full" (a imagem da capa vira a capa do vídeo enquanto carrega). Vídeo do YouTube/Vimeo ou vídeo de apresentação no meio da página: crie uma seção "video" com título curto.
- O site tem que PRENDER A ATENÇÃO do começo ao fim, não só na capa. Monte de 9 a 13 seções ricas em conteúdo e movimento, alternando o ritmo: depois da capa, intercale seções de impacto visual com seções de texto. Regras de conteúdo: (a) com 5 ou mais fotos, inclua pelo menos UM "carousel" (4 a 8 itens, cada um com image, title curto e text de uma frase; use coverflow ou 3d para produtos/ambientes, slider para fotos largas de impacto); (b) "services" (os destaques) sempre com foto em cada item quando houver fotos, preferindo layout feature ou bento, com 3 a 6 itens de título forte e texto de 1 a 2 frases; nunca cards só com título; (c) galeria extra em "marquee" ou "bento" com as fotos que sobrarem; (d) "stats" com números reais do site (anos, clientes, unidades) quando existirem; (e) "marquee" com frases curtas do negócio entre seções; (f) "testimonials" ou "faq" quando o original tiver. Use TODAS as boas imagens disponíveis sem repetir em seções vizinhas. Escreva um "text" de apoio curto nos títulos de seção. Sempre comece com "hero" e termine com "footer". Use as peças que o original realmente tem (loja com preço → products; reserva/agendamento → booking; cardápio → menu; login/área do cliente → login).
- Layouts permitidos: ${LAYOUTS}
- "items" só para services, stats, products, menu, pricing, steps, team, testimonials, faq, carousel (3 a 8 itens). Para os outros tipos, devolva lista vazia.
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
    videos: (d.videos || []).map((v, i) => `${i}: ${v.kind} ${v.url}${v.autoplay ? '  [fundo]' : ''}`),
  }
}

// ---------- escolha da IA (mesma lógica da Sexta-feira) ----------
// 1) Claude oficial (pago) se houver ANTHROPIC_API_KEY
// 2) Free Claude Code rodando no PC (gratuito; só alcançável em desenvolvimento local)
// 3) NVIDIA NIM (gratuito, na nuvem; funciona no Vercel)
const FCC_URL = process.env.FCC_URL || 'http://127.0.0.1:8082'
const NVIDIA_URL = 'https://integrate.api.nvidia.com/v1/chat/completions'
const NVIDIA_MODELS = (process.env.NVIDIA_MODELOS || 'nvidia/nemotron-3-ultra-550b-a55b,nvidia/nemotron-3.5-lightning-30b-a3b,mistralai/mistral-large-4-1t-a52b')
  .split(',')
  .map((m) => m.trim())
  .filter(Boolean)
export const PROVIDER_LABEL = { claude: 'Claude', fcc: 'Free Claude Code', nvidia: 'IA da Sexta-feira (NVIDIA)' }

async function fccUp() {
  try {
    const r = await fetch(FCC_URL + '/v1/models', { signal: AbortSignal.timeout(1500), headers: process.env.FCC_TOKEN ? { 'x-api-key': process.env.FCC_TOKEN } : {} })
    return r.ok
  } catch {
    return false
  }
}

export async function pickProvider() {
  if (process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN) return 'claude'
  if (process.env.PRIME_IA !== 'nvidia' && (await fccUp())) return 'fcc'
  if (process.env.NVIDIA_API_KEY) return 'nvidia'
  return null
}

// Modelos abertos não têm "formato garantido": descrevemos o JSON no próprio pedido.
const JSON_HINT = `

Responda APENAS com um objeto JSON válido (sem texto antes ou depois, sem markdown). Omita campos vazios para a resposta ficar curta. Formato:
{"name":"","segment":"","summary":"","theme":{"bg":"#rrggbb","surface":"#rrggbb","text":"#rrggbb","muted":"#rrggbb","accent":"#rrggbb","font":"${FONTS.join('|')}","headingFont":"(mesma lista)","radius":12,"button":"solid|pill|outline","headCase":"normal|tight|upper"},"imageQuery":"","float3d":{"shape":"${SHAPES.join('|')}","material":"glossy|metal|glass|matte","color":"#rrggbb"},"sections":[{"type":"${BLOCK_TYPES.join('|')}","layout":"","kicker":"","title":"","subtitle":"","text":"","cta":"","cta2":"","image":-1,"image2":-1,"video":-1,"images":[],"items":[{"title":"","text":"","price":"","image":-1}],"bg":"auto|base|surface|accent|dark|light","align":"left|center"}]}`

function parseLoose(text) {
  let t = String(text || '').replace(/<think>[\s\S]*?<\/think>/g, '').replace(/```(?:json)?/g, '')
  const a = t.indexOf('{')
  const b = t.lastIndexOf('}')
  if (a < 0 || b < a) throw new Error('A IA não devolveu JSON.')
  t = t.slice(a, b + 1)
  try {
    return JSON.parse(t)
  } catch {
    return JSON.parse(t.replace(/,\s*([}\]])/g, '$1').replace(/[“”]/g, '"'))
  }
}

// Garante tipos e valores válidos, venha de onde vier a resposta.
function normalizeSpec(raw) {
  const s = raw && typeof raw === 'object' ? raw : {}
  const okHex = (c, d) => (/^#[0-9a-f]{6}$/i.test(c || '') ? c : /^#[0-9a-f]{3}$/i.test(c || '') ? '#' + c.slice(1).split('').map((x) => x + x).join('') : d)
  const font = (f, d) => FONTS.find((x) => x.toLowerCase() === String(f || '').toLowerCase()) || (f ? guessFont([String(f)]) : d)
  const pick = (v, list, d) => (list.includes(v) ? v : d)
  const int = (v) => (Number.isInteger(+v) && v !== '' && v !== null ? +v : -1)
  const str = (v) => (typeof v === 'string' ? v : v == null ? '' : String(v))
  const th = s.theme || {}
  const bg = okHex(th.bg, '#0b0b0c')
  // contraste mínimo: se a IA escolheu texto quase da cor do fundo, corrige
  const contrast = (a, b) => {
    const [l1, l2] = [lumHex(a), lumHex(b)].sort((x, y) => y - x)
    return (l1 + 0.05) / (l2 + 0.05)
  }
  const darkBg = lumHex(bg) < 0.25
  if (th.text && contrast(okHex(th.text, bg), bg) < 4.5) th.text = darkBg ? '#f2f2f0' : '#121316'
  if (th.muted && contrast(okHex(th.muted, bg), bg) < 2.8) th.muted = darkBg ? '#a3a7b0' : '#5d6270'
  if (th.surface && Math.abs(lumHex(okHex(th.surface, bg)) - lumHex(bg)) > 0.5) th.surface = darkBg ? mix(bg, '#ffffff', 0.07) : mix(bg, '#000000', 0.04)
  return {
    name: str(s.name) || 'Meu site',
    segment: str(s.segment),
    summary: str(s.summary),
    theme: {
      bg,
      surface: okHex(th.surface, bg),
      text: okHex(th.text, lumHex(bg) < 0.25 ? '#f2f2f0' : '#121316'),
      muted: okHex(th.muted, '#8a8f99'),
      accent: okHex(th.accent, '#1f6fff'),
      font: font(th.font, 'Inter'),
      headingFont: font(th.headingFont, font(th.font, 'Inter')),
      radius: Math.max(0, Math.min(32, Number.isFinite(+th.radius) ? +th.radius : 12)),
      button: pick(th.button, ['solid', 'pill', 'outline'], 'solid'),
      headCase: pick(th.headCase, ['normal', 'tight', 'upper'], 'tight'),
    },
    imageQuery: str(s.imageQuery),
    float3d: (() => {
      // objeto 3D escuro some no fundo: usa a cor de destaque (ou metal claro)
      const accent = okHex(th.accent, '#1f6fff')
      let color = okHex(s.float3d?.color, accent)
      if (lumHex(color) < 0.04) color = lumHex(accent) > 0.04 ? accent : '#d6d8dc'
      return { shape: pick(s.float3d?.shape, SHAPES, 'none'), material: pick(s.float3d?.material, ['glossy', 'metal', 'glass', 'matte'], 'glossy'), color }
    })(),
    sections: (Array.isArray(s.sections) ? s.sections : [])
      .filter((x) => x && BLOCK_TYPES.includes(x.type))
      .slice(0, 14)
      .map((x) => ({
        type: x.type,
        layout: str(x.layout),
        kicker: str(x.kicker),
        title: str(x.title),
        subtitle: str(x.subtitle),
        text: str(x.text),
        cta: str(x.cta),
        cta2: str(x.cta2),
        image: int(x.image),
        image2: int(x.image2),
        video: int(x.video),
        images: (Array.isArray(x.images) ? x.images : []).map(int).filter((n) => n >= 0),
        items: (Array.isArray(x.items) ? x.items : []).slice(0, 8).map((it) => ({ title: str(it?.title), text: str(it?.text), price: str(it?.price), image: int(it?.image) })),
        bg: pick(x.bg, ['auto', 'base', 'surface', 'accent', 'dark', 'light'], 'auto'),
        align: pick(x.align, ['left', 'center'], 'left'),
      })),
  }
}

async function viaFcc(payload) {
  const client = new Anthropic({ baseURL: FCC_URL, apiKey: process.env.FCC_TOKEN || 'fcc', timeout: 110000, maxRetries: 0 })
  const msg = await client.messages.create({ model: process.env.FCC_MODELO || 'claude-opus-5-5', max_tokens: 12000, system: SYSTEM, messages: [{ role: 'user', content: payload + JSON_HINT }] })
  return msg.content.filter((b) => b.type === 'text').map((b) => b.text).join('')
}

async function viaNvidia(payload) {
  const deadline = Date.now() + 100000
  let last = null
  for (const [i, model] of NVIDIA_MODELS.entries()) {
    const left = deadline - Date.now()
    if (left < 12000) break
    // reserva tempo para o próximo modelo (mais rápido) se este não terminar
    const budget = i < NVIDIA_MODELS.length - 1 ? Math.max(12000, left - 25000) : left
    // modelos Nemotron: desliga o modo de raciocínio (fica muito mais rápido)
    const extra = /nemotron/i.test(model) ? { chat_template_kwargs: { enable_thinking: false } } : {}
    for (const json of [true, false]) {
      try {
        const r = await fetch(NVIDIA_URL, {
          method: 'POST',
          signal: AbortSignal.timeout(budget),
          headers: { authorization: `Bearer ${process.env.NVIDIA_API_KEY}`, 'content-type': 'application/json', accept: 'application/json' },
          body: JSON.stringify({ model, max_tokens: 8192, temperature: 0.4, ...extra, ...(json ? { response_format: { type: 'json_object' } } : {}), messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: payload + JSON_HINT }] }),
        })
        if (r.status === 401 || r.status === 403) throw Object.assign(new Error('Chave da NVIDIA inválida.'), { fatal: true })
        if (!r.ok) {
          last = new Error(`${model}: ${r.status}`)
          if (r.status === 400 && json) continue // tenta o mesmo modelo sem response_format
          break
        }
        const j = await r.json()
        const text = j.choices?.[0]?.message?.content || ''
        parseLoose(text) // valida antes de aceitar; se falhar, tenta o próximo modelo
        return text
      } catch (e) {
        if (e.fatal) throw e
        last = e
        break
      }
    }
  }
  throw last || new Error('Nenhum modelo da NVIDIA respondeu.')
}

export async function aiSpec({ mode, input, scan, extra, provider = 'claude' }) {
  const blocked = mode === 'url' && (!scan?.digest || scan.source === 'blocked')
  const payload =
    mode === 'url'
      ? `Site de referência para copiar como base:\n${JSON.stringify(digestForPrompt(scan), null, 1)}${extra ? '\n\nInformações públicas encontradas sobre a marca:\n' + JSON.stringify(extra, null, 1) : ''}${blocked ? (provider === 'claude' ? '\n\nO site bloqueou a leitura automática. Pesquise a marca na web (até 3 buscas) para acertar cores, tom, produtos e estrutura da página inicial.' : '\n\nO site bloqueou a leitura automática. Use o que você sabe sobre a marca para acertar cores, tom, produtos e estrutura da página inicial.') : ''}`
      : `Pedido do cliente (monte o site a partir disto):\n"""${input}"""\n\nFotos disponíveis:\n${JSON.stringify((extra?.images || []).map((im, i) => `${i}: ${im.url}  [${im.alt}]`))}`

  if (provider === 'fcc') return normalizeSpec(parseLoose(await viaFcc(payload)))
  if (provider === 'nvidia') return normalizeSpec(parseLoose(await viaNvidia(payload)))

  const client = new Anthropic()
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
  return normalizeSpec(parseLoose(text))
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
  const blank = { layout: '', kicker: '', title: '', subtitle: '', text: '', cta: '', cta2: '', image: -1, image2: -1, video: -1, images: [], items: [], bg: 'auto', align: 'left' }
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
  // carrossel com as fotos que sobraram (legendas vêm dos títulos do site)
  if (d.images.length - img >= 4) {
    const caps = H.slice(1)
    const n = Math.min(7, d.images.length - img)
    S.splice(Math.min(2, S.length), 0, { ...blank, type: 'carousel', layout: 'coverflow', title: 'Destaques', items: Array.from({ length: n }, (_, k) => ({ title: caps[k] || `${name} ${k + 1}`, text: P[k + 1]?.slice(0, 110) || '', price: '', image: nextImg() })) })
  }
  if (d.images.length - img >= 4) push({ type: 'gallery', layout: 'marquee', title: 'Galeria', images: Array.from({ length: Math.min(8, d.images.length - img) }, nextImg) })
  if (d.nav.length >= 3) S.splice(1, 0, { ...blank, type: 'marquee', text: d.nav.slice(0, 6).join(' · ') })
  if (d.features.booking && !S.some((s) => s.type === 'booking')) push({ type: 'booking', title: 'Agende agora', text: '' })
  if (d.features.login) push({ type: 'login', title: 'Área do cliente', text: 'Entre para ver pedidos e reservas.' })
  // vídeos: de fundo vai para a capa; YouTube/Vimeo ou apresentação vira seção de vídeo
  const V = d.videos || []
  const bgVid = V.findIndex((v) => v.autoplay && v.kind === 'file')
  if (bgVid >= 0) Object.assign(S[0], { video: bgVid, layout: 'full' })
  V.forEach((v, i) => {
    if (i === bgVid || S.filter((x) => x.type === 'video').length >= 2) return
    const owner = d.sections.find((sec) => sec.video === i)
    S.splice(Math.min(2, S.length), 0, { ...blank, type: 'video', layout: owner?.paras?.length ? 'split' : 'wide', title: owner?.heading || 'Assista', text: owner?.paras?.[0] || '', video: i })
  })
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
