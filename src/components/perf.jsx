// Ajustes de desempenho compartilhados pelas cenas 3D.
import { useThree } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'

export { VisibleCtx, useFrameloop } from './visible.js'

const weak = typeof navigator !== 'undefined' && ((navigator.hardwareConcurrency || 8) <= 4 || /Mobi|Android/i.test(navigator.userAgent))
export const DPR = weak ? [1, 1.25] : [1, 1.5]
export const GL = { antialias: !weak, alpha: true, powerPreference: 'high-performance', stencil: false }

// Se o aparelho não sustenta a taxa de quadros, reduz a resolução da cena.
export function AutoDpr() {
  const setDpr = useThree((s) => s.setDpr)
  return <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(DPR[1])} flipflops={3} onFallback={() => setDpr(1)} />
}
