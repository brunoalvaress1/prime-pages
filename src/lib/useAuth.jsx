import { createContext, useContext, useEffect, useState } from 'react'
import { auth } from './backend.js'

const Ctx = createContext({ user: null, ready: false })

export function AuthProvider({ children }) {
  const [state, setState] = useState({ user: null, ready: false })
  useEffect(() => {
    let alive = true
    auth.current().then((user) => alive && setState({ user, ready: true }))
    const off = auth.onChange((user) => alive && setState({ user, ready: true }))
    return () => {
      alive = false
      off()
    }
  }, [])
  return <Ctx.Provider value={state}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)
