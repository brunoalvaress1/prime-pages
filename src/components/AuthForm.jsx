import { useState } from 'react'
import Icon from './Icon.jsx'
import { auth, MODE } from '../lib/backend.js'

function Field({ label, ...props }) {
  return (
    <label className="af-field">
      <span>{label}</span>
      <input className="field" {...props} />
    </label>
  )
}

export default function AuthForm({ initial = 'signup', onDone, compact }) {
  const [mode, setMode] = useState(initial)
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '', code: '', newPassword: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const run = async (fn) => {
    setError('')
    setBusy(true)
    try {
      await fn()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const submit = (e) => {
    e.preventDefault()
    if (mode === 'signup')
      run(async () => {
        if (!f.name.trim()) throw new Error('Diga seu nome.')
        if (f.phone.replace(/\D/g, '').length < 10) throw new Error('Informe um telefone com DDD.')
        const u = await auth.signUp(f)
        onDone?.(u)
      })
    if (mode === 'login') run(async () => { const u = await auth.signIn(f); onDone?.(u) })
    if (mode === 'forgot' && !codeSent)
      run(async () => {
        if (!f.email.includes('@')) throw new Error('Informe o e-mail da sua conta.')
        const r = await auth.requestReset(f.email)
        setCodeSent(true)
        setInfo(r.demoCode ? `Modo demonstração (sem envio de e-mail configurado): seu código é ${r.demoCode}` : 'Se existir uma conta com esse e-mail, enviamos um código de 6 dígitos. Confira também o spam.')
      })
    if (mode === 'forgot' && codeSent) run(async () => { const u = await auth.confirmReset(f.email, f.code, f.newPassword); onDone?.(u) })
  }

  const go = (m) => {
    setMode(m)
    setError('')
    setInfo('')
    setCodeSent(false)
  }

  return (
    <form className={`af ${compact ? 'is-compact' : ''}`} onSubmit={submit} noValidate>
      {mode !== 'forgot' && (
        <div className="af-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={mode === 'signup'} className={mode === 'signup' ? 'is-on' : ''} onClick={() => go('signup')}>Criar conta</button>
          <button type="button" role="tab" aria-selected={mode === 'login'} className={mode === 'login' ? 'is-on' : ''} onClick={() => go('login')}>Já tenho conta</button>
        </div>
      )}

      {mode === 'forgot' && (
        <div className="af-forgot-head">
          <button type="button" className="af-link" onClick={() => go('login')}><Icon name="back" size={14} /> Voltar</button>
          <h3>Esqueci a senha</h3>
          <p>{codeSent ? 'Digite o código que chegou no seu e-mail e escolha uma nova senha.' : 'Enviamos um código para o e-mail da sua conta.'}</p>
        </div>
      )}

      {mode === 'signup' && (
        <>
          <Field label="Seu nome" value={f.name} onChange={set('name')} autoComplete="name" />
          <Field label="Telefone / WhatsApp" value={f.phone} onChange={set('phone')} inputMode="tel" autoComplete="tel" placeholder="(19) 9 0000-0000" />
        </>
      )}
      {(mode !== 'forgot' || !codeSent) && <Field label="E-mail" type="email" value={f.email} onChange={set('email')} autoComplete="email" />}
      {mode !== 'forgot' && <Field label="Senha" type="password" value={f.password} onChange={set('password')} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} placeholder={mode === 'signup' ? 'Mínimo de 6 caracteres' : ''} />}
      {mode === 'forgot' && codeSent && (
        <>
          <Field label="Código de 6 dígitos" value={f.code} onChange={set('code')} inputMode="numeric" autoComplete="one-time-code" maxLength={6} />
          <Field label="Nova senha" type="password" value={f.newPassword} onChange={set('newPassword')} autoComplete="new-password" />
        </>
      )}

      {info && <p className="af-info">{info}</p>}
      {error && <p className="af-error" role="alert">{error}</p>}

      <button className="btn af-submit" disabled={busy}>
        {busy ? 'Aguarde…' : mode === 'signup' ? 'Criar conta e continuar' : mode === 'login' ? 'Entrar' : codeSent ? 'Salvar nova senha' : 'Enviar código'}
      </button>

      {mode === 'login' && <button type="button" className="af-link" onClick={() => go('forgot')}>Esqueci a senha</button>}
      {mode === 'forgot' && codeSent && <button type="button" className="af-link" onClick={() => setCodeSent(false)}>Não recebi, enviar de novo</button>}
      {MODE === 'local' && <p className="af-demo">Modo demonstração: as contas ficam salvas só neste navegador até o banco de dados ser conectado.</p>}
    </form>
  )
}
