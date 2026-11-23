// Leitura real de um site: baixa o HTML (e algumas folhas de estilo) e extrai
// textos, imagens, cores, fontes, navegação e a ordem das seções.
// Quando o site bloqueia robôs (Cloudflare, Vercel checkpoint…), tenta um leitor
// com navegador (r.jina.ai). O resultado é um "digest" compacto que alimenta a IA.
import { parse } from 'node-html-parser'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36'
const BLOCK_TITLES = /security checkpoint|just a moment|attention required|access denied|captcha|are you a robot|verify you are human|403 forbidden|too many requests/i

async function get(url, { timeout = 9000, accept = 'text/html,application/xhtml+xml,*/*;q=0.8', headers = {} } = {}) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeout)
  try {
    const res = await fetch(url, { redirect: 'follow', signal: ctrl.signal, headers: { 'user-agent': UA, accept, 'accept-language': 'pt-BR,pt;q=0.9,en;q=0.8', ...headers } })
    const text = await res.text()
    return { status: res.status, url: res.url || url, text }
  } catch (e) {
    return { status: 0, url, text: '', error: String(e?.message || e) }
  } finally {
    clearTimeout(t)
  }
}

const clean = (s = '') => s.replace(/\s+/g, ' ').trim()
const JUNK_TXT = /^(close|fechar|ok|aceitar|accept|accept all|aceitar todos|reject|rejeitar|cookies?|menu|search|buscar|pesquisar|skip|pular|x|×|voltar|back|next|prev|anterior|próximo)$|\blogo\b|cookie/i
const okTxt = (t) => !!t && t.length < 32 && !JUNK_TXT.test(t)
const abs = (u, base) => {
  if (!u || u.startsWith('data:') || u.startsWith('blob:')) return ''
  try {
    return new URL(u.trim(), base).href
  } catch {
    return ''
  }
}
const uniq = (arr) => [...new Set(arr.filter(Boolean))]

function bestFromSrcset(srcset) {
  if (!srcset) return ''
  const parts = srcset.split(',').map((p) => p.trim().split(/\s+/))
  parts.sort((a, b) => parseFloat(b[1] || '0') - parseFloat(a[1] || '0'))
  return parts[0]?.[0] || ''
}

const JUNK_IMG = /(sprite|pixel|tracking|spacer|blank|1x1|favicon|icon-|\/icons?\/|logo.*\.svg|\.svg(\?|$)|gravatar|facebook\.com\/tr|doubleclick|analytics)/i

// ---------- cores ----------
function hexToRgb(h) {
  let x = h.replace('#', '')
  if (x.length === 3) x = x.split('').map((c) => c + c).join('')
  if (x.length !== 6) return null
  const n = parseInt(x, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
const toHex = (r, g, b) => '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')
function colorTokens(css) {
  const out = []
  for (const m of css.matchAll(/#([0-9a-f]{6}|[0-9a-f]{3})\b/gi)) out.push('#' + m[1].toLowerCase())
  for (const m of css.matchAll(/rgba?\(\s*(\d{1,3})[\s,]+(\d{1,3})[\s,]+(\d{1,3})(?:[\s,/]+([\d.]+%?))?\s*\)/gi)) {
    const a = m[4] ? parseFloat(m[4]) / (m[4].endsWith('%') ? 100 : 1) : 1
    if (a >= 0.6) out.push(toHex(+m[1], +m[2], +m[3]))
  }
  return out.map((c) => (c.length === 4 ? toHex(...hexToRgb(c)) : c))
}
function lum([r, g, b]) {
  const f = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4))
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}
function sat([r, g, b]) {
  const mx = Math.max(r, g, b) / 255
  const mn = Math.min(r, g, b) / 255
  return mx === 0 ? 0 : (mx - mn) / mx
}
function palette(css) {
  const counts = {}
  for (const c of colorTokens(css)) counts[c] = (counts[c] || 0) + 1
  const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([c, n]) => ({ c, n, rgb: hexToRgb(c) })).filter((x) => x.rgb)
  const accents = ranked.filter((x) => sat(x.rgb) > 0.35 && lum(x.rgb) > 0.03 && lum(x.rgb) < 0.8).slice(0, 4).map((x) => x.c)
  const neutrals = ranked.filter((x) => sat(x.rgb) <= 0.35).slice(0, 6).map((x) => x.c)
  return { top: ranked.slice(0, 12).map((x) => x.c), accents, neutrals }
}

function bodyBg(css) {
  const m = css.match(/(?:^|[}\s,])(?:html|body|:root)\s*\{[^}]*?background(?:-color)?\s*:\s*([^;}]+)/i)
  if (m) {
    const c = colorTokens(m[1])[0] || (/(\bblack\b)/i.test(m[1]) ? '#000000' : /\bwhite\b/i.test(m[1]) ? '#ffffff' : '')
    if (c) return c
  }
  // sem regra no body: a cor neutra mais usada em declarações de fundo
  const counts = {}
  for (const d of css.matchAll(/background(?:-color)?\s*:\s*([^;}]+)/gi)) {
    for (const c of colorTokens(d[1])) {
      const rgb = hexToRgb(c)
      if (rgb && sat(rgb) < 0.2) counts[c] = (counts[c] || 0) + 1
    }
    if (/\bblack\b/i.test(d[1])) counts['#000000'] = (counts['#000000'] || 0) + 1
  }
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])
  return top[0] && top[0][1] >= 3 ? top[0][0] : ''
}

function fonts(css, html) {
  const fams = {}
  for (const m of css.matchAll(/font-family\s*:\s*([^;}]+)/gi)) {
    const first = m[1].split(',')[0].replace(/["']/g, '').trim()
    if (first && !/^(inherit|initial|var\(|-apple|system-ui|sans-serif|serif|monospace|icomoon|font ?awesome)/i.test(first)) fams[first] = (fams[first] || 0) + 1
  }
  const google = uniq([...html.matchAll(/fonts\.googleapis\.com\/css2?\?([^"'\s>]+)/g)].flatMap((m) => [...m[1].matchAll(/family=([^&:]+)/g)].map((f) => decodeURIComponent(f[1]).replace(/\+/g, ' '))))
  return { google, declared: Object.entries(fams).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([f]) => f) }
}

// ---------- HTML ----------
function digestHtml(html, base, cssText) {
  const root = parse(html, { comment: false, blockTextElements: { script: false, style: true, noscript: false, pre: true } })
  const meta = (sel) => root.querySelector(sel)?.getAttribute('content') || ''
  const title = clean(root.querySelector('title')?.text || '')
  const description = meta('meta[name="description"]') || meta('meta[property="og:description"]')
  const siteName = meta('meta[property="og:site_name"]')
  const themeColor = meta('meta[name="theme-color"]')
  const ogImage = abs(meta('meta[property="og:image"]') || meta('meta[name="twitter:image"]'), base)
  const lang = root.querySelector('html')?.getAttribute('lang') || ''

  const logoEl = root.querySelectorAll('img').find((i) => /logo/i.test((i.getAttribute('class') || '') + (i.getAttribute('alt') || '') + (i.getAttribute('src') || '') + (i.getAttribute('id') || '')))
  const logo = abs(logoEl?.getAttribute('src'), base) || abs(root.querySelector('link[rel="apple-touch-icon"]')?.getAttribute('href'), base) || abs(root.querySelector('link[rel~="icon"]')?.getAttribute('href'), base)

  root.querySelectorAll('script,style,noscript,svg,template,iframe[src*="googletagmanager"]').forEach((n) => n.remove())

  const nav = uniq((root.querySelector('nav') || root.querySelector('header'))?.querySelectorAll('a').map((a) => clean(a.text)).filter(okTxt) || []).slice(0, 10)

  // imagens (img, srcset, data-src, picture source, background-image inline)
  const imgs = []
  for (const i of root.querySelectorAll('img')) {
    const src = bestFromSrcset(i.getAttribute('srcset') || i.getAttribute('data-srcset')) || i.getAttribute('data-src') || i.getAttribute('data-lazy-src') || i.getAttribute('src')
    const u = abs(src, base)
    const w = parseInt(i.getAttribute('width') || '0', 10)
    if (u && !JUNK_IMG.test(u) && !(w && w < 120)) imgs.push({ url: u, alt: clean(i.getAttribute('alt') || '').slice(0, 80) })
  }
  for (const s of root.querySelectorAll('source')) {
    const u = abs(bestFromSrcset(s.getAttribute('srcset') || s.getAttribute('data-srcset')), base)
    if (u && !JUNK_IMG.test(u) && /\.(jpe?g|png|webp|avif)/i.test(u)) imgs.push({ url: u, alt: '' })
  }
  for (const m of html.matchAll(/background(?:-image)?\s*:\s*url\(\s*['"]?([^'")]+)['"]?\s*\)/gi)) {
    const u = abs(m[1], base)
    if (u && !JUNK_IMG.test(u)) imgs.push({ url: u, alt: '' })
  }
  if (ogImage) imgs.unshift({ url: ogImage, alt: 'og' })
  const seen = new Set()
  const images = imgs.filter((i) => (seen.has(i.url) ? false : seen.add(i.url))).slice(0, 40)

  // seções na ordem
  const body = root.querySelector('main') || root.querySelector('body') || root
  const candidates = body.querySelectorAll('section, header, footer, article, [class*="section"], [class*="hero"], [class*="banner"]')
  const sections = []
  const taken = new Set()
  for (const el of candidates) {
    const h = el.querySelector('h1, h2, h3')
    const heading = clean(h?.text || '')
    const key = heading || clean(el.text).slice(0, 40)
    if (!key || taken.has(key)) continue
    taken.add(key)
    const paras = el.querySelectorAll('p').map((p) => clean(p.text)).filter((t) => t.length > 25).slice(0, 3)
    const items = el.querySelectorAll('h3, h4').map((x) => clean(x.text)).filter((t) => t && t.length < 80).slice(0, 8)
    const buttons = uniq(el.querySelectorAll('a, button').map((a) => clean(a.text)).filter((t) => okTxt(t) && t.length < 28)).slice(0, 4)
    const prices = (el.text.match(/(R\$|US\$|\$|€)\s?\d[\d.,]*/g) || []).slice(0, 6)
    const imgCount = el.querySelectorAll('img').length
    const tag = el.tagName.toLowerCase()
    const cls = (el.getAttribute('class') || '').slice(0, 60)
    sections.push({ tag, cls, heading: heading.slice(0, 120), paras: paras.map((p) => p.slice(0, 280)), items, buttons, prices, imgCount, hasForm: !!el.querySelector('form'), hasVideo: !!el.querySelector('video'), hasMap: /maps\.google|google\.com\/maps/.test(el.toString()) })
    if (sections.length >= 18) break
  }

  const headings = root.querySelectorAll('h1, h2, h3').map((h) => ({ l: h.tagName.toLowerCase(), t: clean(h.text).slice(0, 120) })).filter((h) => h.t).slice(0, 40)
  const paragraphs = uniq(root.querySelectorAll('p').map((p) => clean(p.text)).filter((t) => t.length > 40)).slice(0, 25).map((p) => p.slice(0, 300))
  const ctas = uniq(root.querySelectorAll('a.btn, a.button, button, a[class*="btn"], a[class*="button"], a[class*="cta"]').map((a) => clean(a.text)).filter((t) => okTxt(t) && t.length < 30)).slice(0, 10)

  const text = root.text.toLowerCase()
  const features = {
    cart: /carrinho|add to cart|adicionar ao carrinho|comprar agora|cart\b|checkout/.test(text),
    login: /entrar|login|minha conta|sign in|my account|log in/.test(text),
    booking: /agendar|agende|reservar|reserva|book now|appointment|marcar hor/.test(text),
    prices: /(r\$|us\$|€)\s?\d/.test(text),
    blog: /blog|notícias|noticias|news|artigos/.test(text),
    whatsapp: /wa\.me|whatsapp/.test(html.toLowerCase()),
    video: !!root.querySelector('video') || /youtube\.com\/embed|player\.vimeo/.test(html),
    form: !!root.querySelector('form'),
    map: /maps\.google|google\.com\/maps/.test(html),
  }
  const contact = {
    phone: (root.text.match(/\(?\d{2}\)?\s?9?\d{4}[-\s]?\d{4}/) || [])[0] || '',
    email: (root.text.match(/[\w.+-]+@[\w-]+\.[\w.]+/) || [])[0] || '',
    address: clean((root.querySelector('address')?.text || '')).slice(0, 140),
  }

  const allCss = cssText + '\n' + (html.match(/style="[^"]*"/g) || []).join('\n')
  return {
    title,
    description: clean(description).slice(0, 300),
    siteName,
    lang,
    themeColor,
    logo,
    nav,
    headings,
    paragraphs,
    ctas,
    sections,
    images,
    features,
    contact,
    colors: { ...palette(allCss), body: bodyBg(cssText), theme: themeColor },
    fonts: fonts(cssText, html),
  }
}

// ---------- leitor com navegador (para sites que bloqueiam) ----------
function digestMarkdown(raw, base) {
  // imagens antes de limpar os links
  const imgList = uniq([...raw.matchAll(/!\[([^\]]*)\]\(([^)\s]+)/g)].map((m) => abs(m[2], base)))
  const md = raw
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\]\([^)]*\)/g, '')
    .replace(/[[\]]/g, '')
  const lines = md.split('\n')
  const title = (md.match(/^Title:\s*(.+)$/m) || [])[1] || ''
  const headings = lines.filter((l) => /^#{1,3}\s/.test(l)).map((l) => ({ l: 'h' + l.match(/^#+/)[0].length, t: clean(l.replace(/^#+/, '')).slice(0, 120) })).slice(0, 40)
  const paragraphs = uniq(lines.map((l) => clean(l.replace(/!?\[[^\]]*\]\([^)]*\)/g, ''))).filter((l) => l.length > 50 && !/^(Title|URL Source|Markdown Content|Warning):/.test(l))).slice(0, 25).map((p) => p.slice(0, 300))
  const images = imgList.filter((u) => u && !JUNK_IMG.test(u)).slice(0, 40).map((url) => ({ url, alt: '' }))
  return { title: clean(title), description: '', siteName: '', lang: '', themeColor: '', logo: '', nav: [], headings, paragraphs, ctas: [], sections: [], images, features: {}, contact: {}, colors: { top: [], accents: [], neutrals: [], body: '', theme: '' }, fonts: { google: [], declared: [] } }
}

function isBlocked(r) {
  if (!r || r.status === 0 || r.status === 403 || r.status === 429 || r.status === 503) return true
  const t = (r.text.match(/<title[^>]*>([^<]*)/i) || [])[1] || ''
  return BLOCK_TITLES.test(t) || r.text.length < 600
}

export async function scrape(href) {
  const first = await get(href)
  let source = 'direct'
  let digest = null
  const withCss = async (html, base) => {
    // até 4 folhas de estilo para cores e fontes
    const sheetUrls = uniq([...html.matchAll(/<link[^>]+rel=["']?stylesheet["']?[^>]*>/gi)].map((m) => abs((m[0].match(/href=["']([^"']+)/) || [])[1], base))).slice(0, 4)
    const inline = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join('\n')
    const sheets = await Promise.all(sheetUrls.map((u) => get(u, { timeout: 5000, accept: 'text/css,*/*' })))
    const css = inline + '\n' + sheets.map((s) => (s.status === 200 ? s.text.slice(0, 400000) : '')).join('\n')
    return digestHtml(html, base, css)
  }
  if (!isBlocked(first)) {
    digest = await withCss(first.text, first.url)
  } else {
    // 1) navegador remoto devolvendo o HTML já renderizado; 2) a versão em texto
    const rendered = await get('https://r.jina.ai/' + href, { timeout: 20000, accept: 'text/html', headers: { 'x-respond-with': 'html' } })
    if (!isBlocked(rendered)) {
      source = 'reader'
      digest = await withCss(rendered.text, href)
    } else {
      const jina = await get('https://r.jina.ai/' + href, { timeout: 15000, accept: 'text/plain', headers: { 'x-with-images-summary': 'true' } })
      if (jina.status === 200 && !BLOCK_TITLES.test(jina.text.slice(0, 300)) && jina.text.length > 800) {
        source = 'reader'
        digest = digestMarkdown(jina.text, href)
      } else {
        source = 'blocked'
      }
    }
  }
  const host = new URL(href).hostname.replace(/^www\./, '')
  return { source, host, url: href, digest }
}

// ---------- banco de imagens abertas (quando o site não entrega fotos) ----------
export async function openImages(query, n = 8) {
  if (!query) return []
  const r = await get(`https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&page_size=${n + 4}&mature=false&aspect_ratio=wide,square`, { timeout: 7000, accept: 'application/json' })
  try {
    const j = JSON.parse(r.text)
    return (j.results || []).filter((x) => x.url && (x.width || 1000) >= 640).slice(0, n).map((x) => ({ url: x.url, alt: x.title || '', credit: x.attribution || '' }))
  } catch {
    return []
  }
}
