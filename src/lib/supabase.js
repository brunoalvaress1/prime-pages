import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// Sem as chaves o site funciona normalmente; só não salva o modelo no banco.
export const supabase = url && key ? createClient(url, key) : null

export async function saveQuote(project, contact, scope, message) {
  if (!supabase) return null
  // O id é gerado aqui: o visitante anônimo só pode inserir, nunca ler a tabela.
  const id = crypto.randomUUID()
  const { error } = await supabase
    .from('quote_requests')
    .insert({
      id,
      kind: project.kind,
      name: project.name,
      origin: project.origin,
      reference_url: project.reference || null,
      prompt: project.prompt || null,
      contact_name: contact.name,
      contact_phone: contact.phone || null,
      business: contact.business || null,
      flags: scope.flags,
      complexity: scope.complexity.level,
      model: stripUploads(project),
      message,
    })
  if (error) {
    console.warn('Supabase: não foi possível salvar o orçamento', error.message)
    return null
  }
  return id
}

// Imagens enviadas viram data URLs enormes; no banco guardamos só um marcador.
function stripUploads(project) {
  return JSON.parse(JSON.stringify(project, (_k, v) => (typeof v === 'string' && v.startsWith('data:') ? '[imagem enviada]' : v)))
}
