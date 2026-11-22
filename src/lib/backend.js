// Camada de dados da Prime Page.
// - Com VITE_SUPABASE_URL/ANON_KEY: usa Supabase Auth + tabelas (modo real, seguro via RLS).
// - Sem as chaves: MODO DEMONSTRAÇÃO, salvo só neste navegador (para testar as telas).
import { supabase } from './supabase.js'

export const MODE = supabase ? 'cloud' : 'local'
export const ADMIN_EMAIL = 'primepagesleme@gmail.com'

// Hash (sal + SHA-256) da senha do admin para o modo demonstração. A senha em si não fica no código.
const LOCAL_ADMIN_HASH = '9a0257443026157da23735baa94fd095387034d1d92a3be932b48b518615345f'

const uid = () => crypto.randomUUID()
const now = () => new Date().toISOString()

async function sha(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('primepage:' + text))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

// Imagens enviadas viram data URLs enormes; guardamos assim mesmo (o admin precisa delas),
// mas o modo demonstração pode estourar o limite do navegador.
const L = {
  get: (k, d) => {
    try {
      return JSON.parse(localStorage.getItem('pp:' + k)) ?? d
    } catch {
      return d
    }
  },
  set: (k, v) => {
    try {
      localStorage.setItem('pp:' + k, JSON.stringify(v))
    } catch {
      throw new Error('O navegador ficou sem espaço (imagens grandes). Remova algumas fotos e tente de novo.')
    }
  },
}

function clean(e) {
  const m = e?.message || String(e)
  if (/Invalid login credentials/i.test(m)) return 'E-mail ou senha incorretos.'
  if (/already registered|already exists/i.test(m)) return 'Este e-mail já tem conta. Faça login.'
  if (/Password should be/i.test(m)) return 'A senha precisa ter pelo menos 6 caracteres.'
  if (/Token has expired|invalid/i.test(m) && /otp|token/i.test(m)) return 'Código inválido ou expirado. Peça outro.'
  return m
}

const listeners = new Set()
const emit = (u) => listeners.forEach((fn) => fn(u))

// ======================= AUTH =======================
export const auth = {
  onChange(fn) {
    listeners.add(fn)
    let sub
    if (MODE === 'cloud') {
      sub = supabase.auth.onAuthStateChange(async (_e, session) => fn(session ? await auth.current() : null)).data.subscription
    }
    return () => {
      listeners.delete(fn)
      sub?.unsubscribe()
    }
  },

  async current() {
    if (MODE === 'cloud') {
      const { data } = await supabase.auth.getUser()
      const u = data.user
      if (!u) return null
      const { data: prof } = await supabase.from('profiles').select('name, phone').eq('id', u.id).maybeSingle()
      const { data: adm } = await supabase.rpc('is_admin')
      return { id: u.id, email: u.email, name: prof?.name ?? u.user_metadata?.name ?? '', phone: prof?.phone ?? u.user_metadata?.phone ?? '', isAdmin: !!adm }
    }
    const sid = L.get('session', null)
    if (!sid) return null
    if (sid === 'admin') return { id: 'admin', email: ADMIN_EMAIL, name: 'Prime Page', phone: '', isAdmin: true }
    const u = L.get('users', []).find((x) => x.id === sid)
    return u ? { id: u.id, email: u.email, name: u.name, phone: u.phone, isAdmin: false } : null
  },

  async signUp({ email, password, name, phone }) {
    email = email.trim().toLowerCase()
    if (password.length < 6) throw new Error('A senha precisa ter pelo menos 6 caracteres.')
    if (MODE === 'cloud') {
      const { error } = await supabase.auth.signUp({ email, password, options: { data: { name, phone } } })
      if (error) throw new Error(clean(error))
      const u = await auth.current()
      if (!u) throw new Error('Conta criada. Confirme o e-mail que enviamos e depois faça login.')
      emit(u)
      return u
    }
    if (email === ADMIN_EMAIL) throw new Error('Este e-mail já tem conta. Faça login.')
    const users = L.get('users', [])
    if (users.some((u) => u.email === email)) throw new Error('Este e-mail já tem conta. Faça login.')
    const user = { id: uid(), email, name, phone, pass: await sha(password), created_at: now() }
    L.set('users', [...users, user])
    L.set('session', user.id)
    const u = await auth.current()
    emit(u)
    return u
  },

  async signIn({ email, password }) {
    email = email.trim().toLowerCase()
    if (MODE === 'cloud') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw new Error(clean(error))
      const u = await auth.current()
      emit(u)
      return u
    }
    if (email === ADMIN_EMAIL) {
      if ((await sha(password)) !== LOCAL_ADMIN_HASH) throw new Error('E-mail ou senha incorretos.')
      L.set('session', 'admin')
    } else {
      const u = L.get('users', []).find((x) => x.email === email)
      if (!u || u.pass !== (await sha(password))) throw new Error('E-mail ou senha incorretos.')
      L.set('session', u.id)
    }
    const u = await auth.current()
    emit(u)
    return u
  },

  async signOut() {
    if (MODE === 'cloud') await supabase.auth.signOut()
    else localStorage.removeItem('pp:session')
    emit(null)
  },

  async updateProfile({ name, phone }) {
    if (MODE === 'cloud') {
      const { data } = await supabase.auth.getUser()
      const { error } = await supabase.from('profiles').upsert({ id: data.user.id, name, phone })
      if (error) throw new Error(clean(error))
    } else {
      const sid = L.get('session')
      L.set('users', L.get('users', []).map((u) => (u.id === sid ? { ...u, name, phone } : u)))
    }
    const u = await auth.current()
    emit(u)
    return u
  },

  async updateEmail(email) {
    email = email.trim().toLowerCase()
    if (MODE === 'cloud') {
      const { error } = await supabase.auth.updateUser({ email })
      if (error) throw new Error(clean(error))
      return 'Enviamos um link de confirmação para o novo e-mail.'
    }
    const sid = L.get('session')
    const users = L.get('users', [])
    if (users.some((u) => u.email === email && u.id !== sid)) throw new Error('Este e-mail já está em uso.')
    L.set('users', users.map((u) => (u.id === sid ? { ...u, email } : u)))
    emit(await auth.current())
    return 'E-mail atualizado.'
  },

  async updatePassword(current, next) {
    if (next.length < 6) throw new Error('A nova senha precisa ter pelo menos 6 caracteres.')
    if (MODE === 'cloud') {
      const { data } = await supabase.auth.getUser()
      const { error: e1 } = await supabase.auth.signInWithPassword({ email: data.user.email, password: current })
      if (e1) throw new Error('A senha atual está incorreta.')
      const { error } = await supabase.auth.updateUser({ password: next })
      if (error) throw new Error(clean(error))
      return
    }
    const sid = L.get('session')
    const users = L.get('users', [])
    const u = users.find((x) => x.id === sid)
    if (!u || u.pass !== (await sha(current))) throw new Error('A senha atual está incorreta.')
    const pass = await sha(next)
    L.set('users', users.map((x) => (x.id === sid ? { ...x, pass } : x)))
  },

  // Esqueci a senha: envia um código de 6 dígitos para o e-mail.
  async requestReset(email) {
    email = email.trim().toLowerCase()
    if (MODE === 'cloud') {
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      if (error) throw new Error(clean(error))
      return { demoCode: null }
    }
    const u = L.get('users', []).find((x) => x.email === email)
    const code = String(Math.floor(100000 + Math.random() * 900000))
    if (u) L.set('reset', { email, code, exp: Date.now() + 15 * 60 * 1000 })
    // Sem servidor de e-mail no modo demonstração: o código é mostrado na tela.
    return { demoCode: u ? code : null }
  },

  async confirmReset(email, code, password) {
    email = email.trim().toLowerCase()
    if (password.length < 6) throw new Error('A nova senha precisa ter pelo menos 6 caracteres.')
    if (MODE === 'cloud') {
      const { error } = await supabase.auth.verifyOtp({ email, token: code.trim(), type: 'recovery' })
      if (error) throw new Error(clean(error))
      const { error: e2 } = await supabase.auth.updateUser({ password })
      if (e2) throw new Error(clean(e2))
      const u = await auth.current()
      emit(u)
      return u
    }
    const r = L.get('reset', null)
    if (!r || r.email !== email || r.code !== code.trim() || Date.now() > r.exp) throw new Error('Código inválido ou expirado. Peça outro.')
    const users = L.get('users', [])
    const u = users.find((x) => x.email === email)
    const pass = await sha(password)
    L.set('users', users.map((x) => (x.id === u.id ? { ...x, pass } : x)))
    localStorage.removeItem('pp:reset')
    L.set('session', u.id)
    const cur = await auth.current()
    emit(cur)
    return cur
  },
}

// ======================= PROJETOS =======================
const strip = (p) => {
  const { step, selected, selImg, device, ...rest } = p
  return rest
}

export const projects = {
  async save(project, user) {
    const id = project.projectId || uid()
    const row = { id, user_id: user.id, name: project.name, kind: project.kind, data: strip({ ...project, projectId: id }), updated_at: now() }
    if (MODE === 'cloud') {
      const { error } = await supabase.from('projects').upsert(row)
      if (error) throw new Error(clean(error))
    } else {
      const all = L.get('projects', [])
      const i = all.findIndex((p) => p.id === id)
      if (i >= 0) all[i] = { ...all[i], ...row, user_id: all[i].user_id }
      else all.push({ ...row, created_at: now() })
      L.set('projects', all)
    }
    return id
  },
  async mine(user) {
    if (MODE === 'cloud') {
      const { data, error } = await supabase.from('projects').select('id, name, kind, updated_at, data').eq('user_id', user.id).order('updated_at', { ascending: false })
      if (error) throw new Error(clean(error))
      return data
    }
    return L.get('projects', []).filter((p) => p.user_id === user.id).sort((a, b) => b.updated_at.localeCompare(a.updated_at))
  },
  async get(id) {
    if (MODE === 'cloud') {
      const { data, error } = await supabase.from('projects').select('*').eq('id', id).maybeSingle()
      if (error) throw new Error(clean(error))
      return data
    }
    return L.get('projects', []).find((p) => p.id === id) || null
  },
  async remove(id) {
    if (MODE === 'cloud') {
      const { error } = await supabase.from('projects').delete().eq('id', id)
      if (error) throw new Error(clean(error))
    } else L.set('projects', L.get('projects', []).filter((p) => p.id !== id))
  },
  async all() {
    if (MODE === 'cloud') {
      const { data, error } = await supabase.from('projects').select('id, user_id, name, kind, updated_at').order('updated_at', { ascending: false })
      if (error) throw new Error(clean(error))
      return data
    }
    return L.get('projects', [])
  },
}

// ======================= ORÇAMENTOS =======================
export const STATUS = {
  novo: 'Novo',
  em_analise: 'Em análise',
  orcado: 'Orçado',
  fechado: 'Fechado',
  perdido: 'Perdido',
}

export const quotes = {
  async create({ user, projectId, project, contact, scope, message }) {
    const row = {
      id: uid(),
      created_at: now(),
      user_id: user.id,
      project_id: projectId,
      kind: project.kind,
      name: project.name,
      origin: project.origin,
      reference_url: project.reference || null,
      prompt: project.prompt || project.system?.prompt || null,
      contact_name: contact.name,
      contact_phone: contact.phone || null,
      contact_email: user.email,
      business: contact.business || null,
      flags: scope.flags,
      complexity: scope.complexity.level,
      message,
      status: 'novo',
    }
    if (MODE === 'cloud') {
      const { error } = await supabase.from('quote_requests').insert(row)
      if (error) throw new Error(clean(error))
    } else L.set('quotes', [row, ...L.get('quotes', [])])
    return row.id
  },
  async mine(user) {
    if (MODE === 'cloud') {
      const { data } = await supabase.from('quote_requests').select('id, project_id, status, created_at').eq('user_id', user.id)
      return data || []
    }
    return L.get('quotes', []).filter((q) => q.user_id === user.id)
  },
  async all() {
    if (MODE === 'cloud') {
      const { data, error } = await supabase.from('quote_requests').select('*').order('created_at', { ascending: false })
      if (error) throw new Error(clean(error))
      return data
    }
    return L.get('quotes', [])
  },
  async setStatus(id, status, note) {
    if (MODE === 'cloud') {
      const { error } = await supabase.from('quote_requests').update({ status, admin_note: note ?? null }).eq('id', id)
      if (error) throw new Error(clean(error))
    } else L.set('quotes', L.get('quotes', []).map((q) => (q.id === id ? { ...q, status, admin_note: note ?? q.admin_note } : q)))
  },
}

export async function allUsers() {
  if (MODE === 'cloud') {
    const { data } = await supabase.from('profiles').select('id, name, phone, email, created_at')
    return data || []
  }
  return L.get('users', []).map(({ pass, ...u }) => u)
}
