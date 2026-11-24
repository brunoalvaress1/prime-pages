// POST /api/generate  { mode: 'prompt', input }
// Devolve { spec, images, meta } — o navegador converte o spec em peças do construtor.
import { openImages } from './_lib/scrape.js'
import { aiSpec, pickProvider, PROVIDER_LABEL } from './_lib/build.js'

// Tenta a IA; se ela falhar, segue com o montador por regras em vez de dar erro.
async function tryAI(provider, args) {
  if (!provider) return { spec: null, error: null }
  try {
    return { spec: await aiSpec({ ...args, provider }), error: null }
  } catch (e) {
    console.error('[generate] IA falhou:', provider, e?.message)
    return { spec: null, error: String(e?.message || e).slice(0, 160) }
  }
}

export const config = { maxDuration: 120 }

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}')
  const chunks = []
  for await (const c of req) chunks.push(c)
  return JSON.parse(Buffer.concat(chunks).toString() || '{}')
}

export async function run({ mode, input }) {
  const provider = await pickProvider()
  // Copiar site por link foi desativado: o construtor só oferece modelos prontos e descrição em texto.
  if (mode !== 'prompt') throw Object.assign(new Error('Esse modo não está disponível. Escolha um modelo pronto ou descreva o seu site.'), { status: 400 })

  const text = String(input || '').trim()
  if (text.length < 12) throw Object.assign(new Error('Escreva um pouco mais: que tipo de negócio é e o que o site precisa ter.'), { status: 400 })
  if (!provider) return { spec: null, images: [], meta: { ai: false } } // navegador usa o montador local
  const images = await openImages(text.split(/\s+/).slice(0, 6).join(' '), 10)
  const r = await tryAI(provider, { mode: 'prompt', input: text, extra: { images } })
  if (!r.spec) return { spec: null, images: [], meta: { ai: false, aiError: r.error } } // navegador usa o montador local
  const spec = r.spec
  if (spec.imageQuery) {
    const more = await openImages(spec.imageQuery, 10)
    if (more.length > images.length) {
      // a IA indicou índices na primeira lista; mantém e acrescenta as novas no fim
      images.push(...more)
    }
  }
  return { spec, images: images.map((i) => i.url), meta: { ai: true, provider: PROVIDER_LABEL[provider] } }
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
