// POST /api/generate  { mode: 'url' | 'prompt', input }
// Devolve { spec, images, meta } — o navegador converte o spec em peças do construtor.
import { scrape, openImages } from './_lib/scrape.js'
import { aiSpec, heuristicSpec, hasAI, brandFacts } from './_lib/build.js'

export const config = { maxDuration: 120 }

function normalizeUrl(raw) {
  const t = String(raw || '').trim()
  try {
    const u = new URL(/^https?:\/\//i.test(t) ? t : 'https://' + t)
    if (!u.hostname.includes('.') || /^(localhost|127\.|10\.|192\.168\.|169\.254\.)/.test(u.hostname)) return null
    return u
  } catch {
    return null
  }
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}')
  const chunks = []
  for await (const c of req) chunks.push(c)
  return JSON.parse(Buffer.concat(chunks).toString() || '{}')
}

export async function run({ mode, input }) {
  const ai = hasAI()
  if (mode === 'url') {
    const url = normalizeUrl(input)
    if (!url) throw Object.assign(new Error('Esse endereço não parece um site. Ex.: www.seusite.com.br'), { status: 400 })
    const scan = await scrape(url.href)
    let extra = null
    if (scan.source === 'blocked' || (scan.digest?.images.length || 0) < 4) {
      const facts = scan.source === 'blocked' ? await brandFacts(scan.host) : null
      const q = facts?.title || scan.digest?.siteName || scan.host.split('.')[0]
      const pics = await openImages(q, 10)
      const imgs = [...(facts?.image ? [{ url: facts.image, alt: facts.title }] : []), ...pics]
      if (!scan.digest) scan.digest = { title: facts?.title || '', description: facts?.summary || '', siteName: facts?.title || '', lang: '', themeColor: '', logo: '', nav: [], headings: [], paragraphs: facts?.summary ? [facts.summary] : [], ctas: [], sections: [], images: [], features: {}, contact: {}, colors: { top: [], accents: [], neutrals: [], body: '', theme: '' }, fonts: { google: [], declared: [] } }
      scan.digest.images.push(...imgs.map((i) => ({ url: i.url, alt: i.alt, credit: i.credit })))
      extra = facts
    }
    const spec = ai ? await aiSpec({ mode, input: url.href, scan, extra }) : heuristicSpec(scan, extra)
    return { spec, images: scan.digest.images.map((i) => i.url), meta: { ai, source: scan.source, host: scan.host, read: { headings: scan.digest.headings.length, images: scan.digest.images.length, colors: scan.digest.colors.top?.slice(0, 6) || [], fonts: [...(scan.digest.fonts.google || []), ...(scan.digest.fonts.declared || [])].slice(0, 3) } } }
  }

  const text = String(input || '').trim()
  if (text.length < 12) throw Object.assign(new Error('Escreva um pouco mais: que tipo de negócio é e o que o site precisa ter.'), { status: 400 })
  if (!ai) return { spec: null, images: [], meta: { ai: false } } // navegador usa o montador local
  const images = await openImages(text.split(/\s+/).slice(0, 6).join(' '), 10)
  const spec = await aiSpec({ mode: 'prompt', input: text, extra: { images } })
  if (spec.imageQuery) {
    const more = await openImages(spec.imageQuery, 10)
    if (more.length > images.length) {
      // a IA indicou índices na primeira lista; mantém e acrescenta as novas no fim
      images.push(...more)
    }
  }
  return { spec, images: images.map((i) => i.url), meta: { ai: true } }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405
    return res.end('POST only')
  }
  try {
    const body = await readBody(req)
    const out = await run(body)
    res.setHeader('content-type', 'application/json')
    res.statusCode = 200
    res.end(JSON.stringify(out))
  } catch (e) {
    res.setHeader('content-type', 'application/json')
    res.statusCode = e.status || 500
    res.end(JSON.stringify({ error: e.status ? e.message : 'Não conseguimos montar agora. Tente de novo em instantes.', detail: String(e?.message || e).slice(0, 200) }))
  }
}
