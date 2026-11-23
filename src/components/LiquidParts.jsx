import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Html, Environment, Lightformer, Sparkles } from '@react-three/drei'
import { MarchingCubes } from 'three-stdlib'
import * as THREE from 'three'
import { DPR, GL, AutoDpr, useFrameloop } from './perf.jsx'

// A peça escolhida é um núcleo de "plástico derretido" azul. Cada recurso técnico que ela
// exige se desprende como uma gota âmbar e fica orbitando; ao trocar de peça, as gotas
// voltam para o núcleo (metaballs se fundindo) e as novas se soltam.
const BLUE = new THREE.Color('#1f6fff')
const BLUE_HI = new THREE.Color('#6fa2ff')
const AMBER = new THREE.Color('#ffb020')
const SCALE = 2.3
const RES = 54
const toWorld = (v) => (v - 0.5) * 2 * SCALE

const NEED_LABEL = { database: 'Banco de dados', payments: 'Pagamento online', auth: 'Login', admin: 'Painel admin', notifications: 'Avisos', '3d': '3D', integrations: 'Integrações', storage: 'Arquivos' }

function Liquid({ items, calm }) {
  const mat = useMemo(() => new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.14, metalness: 0.02, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1.2 }), [])
  const mc = useMemo(() => {
    const m = new MarchingCubes(RES, mat, false, true, 45000)
    m.isolation = 60
    m.scale.setScalar(SCALE)
    return m
  }, [mat])
  const state = useRef({}) // kind -> { r, off }
  const labels = useRef({})
  const spans = useRef({})
  const ring = useRef()

  useFrame((s, dt) => {
    const t = s.clock.elapsedTime
    const cx = 0.5 + s.pointer.x * 0.035
    const cy = 0.5 + s.pointer.y * 0.03
    mc.reset()
    // núcleo: uma bola grande e quatro menores girando dentro dela (movimento orgânico)
    mc.addBall(cx, cy, 0.5, 0.95, 12, BLUE)
    for (let k = 0; k < 4; k++) {
      mc.addBall(cx + Math.sin(t * 0.8 + k * 1.9) * 0.085, cy + Math.cos(t * 1.05 + k * 1.4) * 0.075, 0.5 + Math.sin(t * 0.6 + k * 2.3) * 0.07, 0.22, 12, k % 2 ? BLUE_HI : BLUE)
    }
    const live = items.filter((it) => !it.leaving)
    for (const k in spans.current) if (spans.current[k] && !items.some((it) => it.kind === k)) spans.current[k].style.opacity = 0
    items.forEach((it, i) => {
      const idx = live.indexOf(it)
      const targetOff = idx < 0 ? (state.current[it.kind]?.off ?? 0) : (idx / Math.max(1, live.length)) * Math.PI * 2
      const st = (state.current[it.kind] ??= { r: 0, off: targetOff })
      st.off = THREE.MathUtils.damp(st.off, targetOff, 3, dt)
      st.r = THREE.MathUtils.damp(st.r, it.leaving ? 0 : 0.34, it.leaving ? 5 : 2.2, dt)
      const a = t * 0.45 + st.off
      const x = cx + Math.cos(a) * st.r
      const z = 0.5 + Math.sin(a) * st.r * 0.75
      const y = cy + Math.sin(a * 1.6 + i) * 0.05
      // a gota "estica" quando está saindo do núcleo: duas bolas em fila
      mc.addBall(x, y, z, 0.2, 12, AMBER)
      mc.addBall(cx + (x - cx) * 0.6, cy + (y - cy) * 0.6, 0.5 + (z - 0.5) * 0.6, 0.09 * Math.max(0, 1 - st.r / 0.34) + 0.015, 12, AMBER)
      const lb = labels.current[it.kind]
      if (lb) {
        lb.position.set(toWorld(x), toWorld(y) - 0.6, toWorld(z))
        const sp = spans.current[it.kind]
        if (sp) sp.style.opacity = st.r > 0.22 && !it.leaving ? 1 : 0
      }
    })
    mc.update()
    if (ring.current) {
      const target = calm ? 1 : 0.001
      const sc = THREE.MathUtils.damp(ring.current.scale.x, target, 4, dt)
      ring.current.scale.setScalar(sc)
      ring.current.rotation.x = 1.2 + Math.sin(t * 0.5) * 0.15
      ring.current.rotation.z = t * 0.4
      ring.current.visible = sc > 0.01
    }
  })

  useEffect(() => () => mc.geometry.dispose(), [mc])

  return (
    <group>
      <primitive object={mc} />
      <mesh ref={ring}>
        <torusGeometry args={[1.7, 0.03, 12, 128]} />
        <meshStandardMaterial color="#1faa59" emissive="#1faa59" emissiveIntensity={0.6} roughness={0.3} />
      </mesh>
      <Html position={[0, -2.05, 0]} center zIndexRange={[5, 0]}><span className="ps-need is-ok ps-fade" style={{ opacity: calm ? 1 : 0 }}>Sem custo extra</span></Html>
      {/* rótulos ficam sempre montados (só aparecem/somem): desmontar Html no meio do quadro causa erro no React */}
      {Object.keys(NEED_LABEL).map((kind) => (
        <group key={kind} ref={(g) => (labels.current[kind] = g)}>
          <Html center zIndexRange={[5, 0]}><span className="ps-need ps-fade" style={{ opacity: 0 }} ref={(el) => (spans.current[kind] = el)}>{NEED_LABEL[kind]}</span></Html>
        </group>
      ))}
    </group>
  )
}

export default function LiquidParts({ needs, label }) {
  const frameloop = useFrameloop()
  const [items, setItems] = useState(() => needs.map((kind) => ({ kind })))
  const key = needs.join(',')
  const timer = useRef()

  useEffect(() => {
    setItems((prev) => {
      const keep = prev.filter((p) => needs.includes(p.kind)).map((p) => ({ kind: p.kind }))
      const leaving = prev.filter((p) => !needs.includes(p.kind)).map((p) => ({ kind: p.kind, leaving: true }))
      const added = needs.filter((n) => !prev.some((p) => p.kind === n && !p.leaving)).map((kind) => ({ kind }))
      return [...keep, ...added, ...leaving]
    })
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setItems((prev) => prev.filter((p) => !p.leaving)), 900)
    return () => clearTimeout(timer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return (
    <Canvas dpr={DPR} frameloop={frameloop} camera={{ position: [0, 0.5, 6], fov: 40 }} gl={GL} onCreated={({ camera }) => camera.lookAt(0, 0, 0)}>
      <AutoDpr />
      <ambientLight intensity={0.35} />
      <directionalLight position={[-3, 5, 5]} intensity={1.8} color="#eaf1ff" />
      <pointLight position={[3, -1, 3]} intensity={6} color="#ffb020" distance={9} />
      <Environment resolution={128}>
        <Lightformer intensity={2.6} position={[0, 5, -3]} scale={[10, 2, 1]} />
        <Lightformer intensity={1.4} position={[-5, 1, 2]} rotation-y={Math.PI / 2} scale={[5, 3, 1]} />
        <Lightformer intensity={1} color="#ffb020" position={[5, -1, 2]} rotation-y={-Math.PI / 2} scale={[4, 2, 1]} />
        <Lightformer intensity={0.6} form="ring" position={[0, 0, 5]} scale={3} />
      </Environment>
      <Sparkles count={40} scale={[7, 4, 3]} size={2.2} speed={0.25} opacity={0.5} color="#6fa2ff" />
      <Liquid items={items} calm={needs.length === 0} />
    </Canvas>
  )
}
