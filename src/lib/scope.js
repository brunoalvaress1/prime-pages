import { BLOCKS } from '../data/blocks.js'
import { MODULES, SYSTEMS } from '../data/systems.js'
import { THEMES } from '../data/templates.js'

export const WHATSAPP_NUMBER = '5519998839704'

// Requisitos técnicos que mudam o preço: é o que a equipe precisa ver primeiro.
export const FLAGS = {
  payments: { label: 'Pagamento online', short: 'Pagamentos' },
  database: { label: 'Banco de dados', short: 'Banco de dados' },
  auth: { label: 'Login de usuários', short: 'Login' },
  admin: { label: 'Painel para o cliente editar', short: 'Painel admin' },
  notifications: { label: 'Avisos automáticos (e-mail/WhatsApp)', short: 'Avisos' },
  integrations: { label: 'Integrações externas (NF, APIs)', short: 'Integrações' },
  reports: { label: 'Relatórios e painéis', short: 'Relatórios' },
  '3d': { label: 'Elementos 3D', short: '3D' },
  mobile: { label: 'Versão aplicativo', short: 'App' },
}

export function computeScope(project) {
  const flags = new Set()
  const reasons = {}
  const add = (flag, why) => {
    flags.add(flag)
    ;(reasons[flag] ||= []).push(why)
  }

  if (project.kind === 'site') {
    project.blocks.forEach((b) => BLOCKS[b.type]?.needs.forEach((n) => add(n, BLOCKS[b.type].label)))
  } else {
    project.system.modules.forEach((m) => MODULES[m]?.needs.forEach((n) => add(n, MODULES[m].label)))
  }

  const extras = project.extras || {}
  if (extras.admin) add('admin', 'Pedido no resumo')

  const uploaded = project.kind === 'site' ? countUploads(project.blocks) : 0

  return {
    flags: Object.keys(FLAGS).filter((f) => flags.has(f)),
    reasons,
    uploaded,
    sections: project.kind === 'site' ? project.blocks.length : 0,
    modules: project.kind === 'system' ? project.system.modules.length : 0,
    complexity: complexityOf(flags.size, project),
  }
}

function countUploads(blocks) {
  let n = 0
  const walk = (v) => {
    if (typeof v === 'string' && v.startsWith('data:')) n++
    else if (Array.isArray(v)) v.forEach(walk)
    else if (v && typeof v === 'object') Object.values(v).forEach(walk)
  }
  blocks.forEach((b) => walk(b.props))
  return n
}

function complexityOf(flagCount, project) {
  const size = project.kind === 'site' ? project.blocks.length : project.system.modules.length * 1.6
  const score = flagCount * 2 + size
  if (score <= 9) return { level: 'Simples', note: 'Site de apresentação' }
  if (score <= 16) return { level: 'Intermediário', note: 'Recursos dinâmicos' }
  return { level: 'Avançado', note: 'Sistema com back-end' }
}

export function projectCode(project) {
  if (project.remoteId) return project.remoteId.slice(0, 8).toUpperCase()
  let h = 0
  const s = project.createdAt + project.name
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return 'PP-' + Math.abs(h).toString(36).toUpperCase().slice(0, 6)
}

export function buildWhatsAppMessage(project, contact) {
  const scope = computeScope(project)
  const L = []
  const yes = (f) => (scope.flags.includes(f) ? 'SIM' : 'não')

  L.push(`*Novo pedido de orçamento — Prime Page*`)
  L.push(`Código: *${projectCode(project)}*`)
  L.push('')
  L.push(`*Cliente:* ${contact.name || '-'}`)
  if (contact.business) L.push(`*Negócio:* ${contact.business}`)
  if (contact.phone) L.push(`*WhatsApp:* ${contact.phone}`)
  L.push('')

  if (project.kind === 'site') {
    L.push(`*Tipo:* Site — ${project.name}`)
    L.push(`*Origem:* ${originLabel(project.origin)}`)
    L.push(`*Seções (${scope.sections}):* ${project.blocks.map((b) => BLOCKS[b.type].label).join(', ')}`)
    const theme = project.theme
    L.push(`*Visual:* ${THEMES[project.themeKey]?.name || 'Personalizado'} · cor ${theme.accent} · fonte ${theme.font}`)
    if (scope.uploaded) L.push(`*Imagens próprias enviadas:* ${scope.uploaded}`)
  } else {
    const sys = SYSTEMS.find((s) => s.id === project.system.type)
    L.push(`*Tipo:* Sistema — ${sys?.name || project.name}`)
    L.push(`*Módulos (${scope.modules}):* ${project.system.modules.map((m) => MODULES[m].label).join(', ')}`)
    L.push(`*Usuários estimados:* ${project.system.users || '-'}`)
  }

  L.push('')
  L.push(`*RESUMO TÉCNICO*`)
  L.push(`• Pagamento online: ${yes('payments')}`)
  L.push(`• Banco de dados: ${yes('database')}`)
  L.push(`• Login de usuários: ${yes('auth')}`)
  L.push(`• Painel admin: ${yes('admin')}`)
  L.push(`• Avisos automáticos: ${yes('notifications')}`)
  L.push(`• Integrações (NF/APIs): ${yes('integrations')}`)
  L.push(`• Relatórios: ${yes('reports')}`)
  L.push(`• 3D: ${yes('3d')}`)
  L.push(`• App celular: ${yes('mobile')}`)
  L.push(`• Complexidade estimada: *${scope.complexity.level}*`)

  const ex = project.extras || {}
  L.push('')
  L.push(`*Já tem domínio:* ${ex.hasDomain ? 'sim' : 'não'}`)
  L.push(`*Já tem logo:* ${ex.hasLogo ? 'sim' : 'não'}`)
  L.push(`*Textos:* ${ex.copy === 'own' ? 'cliente envia' : 'Prime Page escreve'}`)
  L.push(`*Prazo desejado:* ${ex.deadline || 'sem pressa'}`)
  if (project.reference) L.push(`*Site de referência:* ${project.reference}`)
  if (project.prompt) L.push(`*Pedido em texto:* "${project.prompt.slice(0, 280)}"`)
  if (contact.notes) L.push(`*Observações:* ${contact.notes.slice(0, 400)}`)
  if (project.remoteId) L.push('', `Modelo salvo no painel com o código acima.`)

  return L.join('\n')
}

export function whatsappUrl(text) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`
}

export function originLabel(o) {
  return { template: 'Modelo pronto', url: 'Cópia de site (engenharia reversa)', prompt: 'Descrição em texto', blank: 'Do zero' }[o] || 'Do zero'
}
