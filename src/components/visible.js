// Contexto leve (sem three.js): cenas fora da tela param de desenhar sem serem desmontadas.
import { createContext, useContext } from 'react'
export const VisibleCtx = createContext(true)
export const useFrameloop = () => (useContext(VisibleCtx) ? 'always' : 'never')
