import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { RoundedBox, Html, Environment, Lightformer } from '@react-three/drei'
import * as THREE from 'three'
import { DPR, GL, AutoDpr, useFrameloop } from './perf.jsx'

// Materiais compartilhados: dezenas de malhas usam os mesmos 3 materiais (menos trocas de shader).
const M_HI = new THREE.MeshStandardMaterial({ color: '#6fa2ff', roughness: 0.35, metalness: 0.05 })
const M_LO = new THREE.MeshStandardMaterial({ color: '#123f99', roughness: 0.6 })
const M_CALL = new THREE.MeshStandardMaterial({ color: '#ffb020', roughness: 0.35 })
const M_PART = new THREE.MeshPhysicalMaterial({ color: '#1f6fff', roughness: 0.32, clearcoat: 0.8, clearcoatRoughness: 0.25 })
const BOX = new THREE.BoxGeometry(1, 1, 1)

const MOLD = '#1f6fff'
const MOLD_HI = '#6fa2ff'
const MOLD_LO = '#123f99'

// Cada peça: posição montada (página) e posição na árvore do kit.
const PARTS = [
  { id: 'A1', name: 'Capa', size: [3.6, 1.5], at: [0, 1.15], sprue: [-1.25, 1.55], detail: 'hero' },
  { id: 'A0', name: 'Menu', size: [3.6, 0.26], at: [0, 2.2], sprue: [1.35, 2.35], detail: 'nav' },
  { id: 'A3', name: 'Serviços', size: [1.1, 0.95], at: [-1.25, -0.25], sprue: [1.7, 1.1], detail: 'card' },
  { id: 'B1', name: 'Galeria', size: [1.1, 0.95], at: [0, -0.25], sprue: [1.7, -0.05], detail: 'image' },
  { id: 'B4', name: 'Agenda', size: [1.1, 0.95], at: [1.25, -0.25], sprue: [-1.85, -0.3], detail: 'card' },
  { id: 'D3', name: 'Contato', size: [3.6, 0.7], at: [0, -1.25], sprue: [-0.4, -1.45], detail: 'form' },
  { id: 'D4', name: 'Rodapé', size: [3.6, 0.22], at: [0, -1.85], sprue: [1.1, -2.2], detail: 'nav' },
]

const ease = (t) => 1 - Math.pow(1 - Math.min(Math.max(t, 0), 1), 4)

function Details({ kind, w, h }) {
  const raised = (x, y, sw, sh, color = MOLD_HI) => (
    <mesh key={`${x}:${y}:${sw}`} position={[x, y, 0.075]} scale={[sw, sh, 0.03]} geometry={BOX} material={color === MOLD_HI ? M_HI : M_CALL} />
  )
  const plate = (x, y, sw, sh, z = 0.06) => <mesh key={`p${x}:${y}`} position={[x, y, z]} scale={[sw, sh, 0.02]} geometry={BOX} material={M_LO} />
  if (kind === 'hero')
    return (
      <>
        {raised(-w / 2 + 0.95, 0.35, 1.5, 0.16)}
        {raised(-w / 2 + 0.8, 0.12, 1.2, 0.07)}
        {raised(-w / 2 + 0.6, -0.08, 0.8, 0.07)}
        {raised(-w / 2 + 0.45, -0.38, 0.5, 0.16, '#ffb020')}
        {plate(w / 2 - 0.85, 0, 1.4, h - 0.3)}
      </>
    )
  if (kind === 'card')
    return (
      <>
        {plate(0, 0.17, w - 0.2, 0.36)}
        {raised(-0.12, -0.2, w - 0.45, 0.06)}
        {raised(-0.22, -0.33, w - 0.65, 0.05)}
      </>
    )
  if (kind === 'image')
    return (
      <>
        {[-0.27, 0, 0.27].map((x) =>
          [0.2, -0.17].map((y) => (
            plate(x, y, 0.23, 0.3)
          )),
        )}
      </>
    )
  if (kind === 'form')
    return (
      <>
        {raised(-1.1, 0.12, 1.0, 0.12)}
        {raised(-1.2, -0.08, 0.8, 0.05)}
        {plate(0.75, 0.1, 1.6, 0.16)}
        {plate(0.75, -0.14, 1.6, 0.16)}
      </>
    )
  if (kind === 'nav')
    return (
      <>
        {raised(-w / 2 + 0.35, 0, 0.4, h * 0.4)}
        {[0.2, 0.55, 0.9, 1.25].map((x) => raised(x, 0, 0.22, h * 0.25))}
      </>
    )
  return null
}

function Part({ p, index, clock, reduced }) {
  const ref = useRef()
  const [w, h] = p.size
  const from = useMemo(() => new THREE.Vector3(p.sprue[0] * 1.15, p.sprue[1] * 1.0, -0.9), [p])
  const to = useMemo(() => new THREE.Vector3(p.at[0], p.at[1], 0), [p])
  const tmp = useMemo(() => new THREE.Vector3(), [])

  useFrame(() => {
    const c = clock.cycle ?? 0
    const lift = clock.lift === index ? clock.liftAmt : 0
    const t = reduced ? 1 : c < 10 ? ease((c - index * 0.16) / 1.1) : 1 - ease((c - 10 - (PARTS.length - 1 - index) * 0.12) / 1.1)
    // Vista explodida: após encaixar, as peças se afastam levemente em z.
    const explode = clock.explode * (0.18 + (index % 3) * 0.14) + lift + Math.sin(clock.current * 1.3 + index) * 0.04 * t
    tmp.lerpVectors(from, to, t)
    tmp.z += explode
    ref.current.position.copy(tmp)
    ref.current.rotation.z = (1 - t) * (index % 2 ? 0.08 : -0.06)
  })

  return (
    <group ref={ref}>
      <RoundedBox args={[w, h, 0.12]} radius={0.035} smoothness={2} material={M_PART} />
      <Details kind={p.detail} w={w} h={h} />
      <Html position={[-w / 2 - 0.08, h / 2 - 0.04, 0.1]} center={false} zIndexRange={[5, 0]} className="callout-anchor">
        <span className="callout"><b>{p.id}</b>{p.name}</span>
      </Html>
    </group>
  )
}

function Sprue({ clock }) {
  const ref = useRef()
  const bars = useMemo(() => {
    const W = 4.9, H = 5.6
    const r = [
      [[0, H / 2], [W, 0.06]],
      [[0, -H / 2], [W, 0.06]],
      [[-W / 2, 0], [0.06, H]],
      [[W / 2, 0], [0.06, H]],
      [[0, 0.55], [W, 0.04]],
      [[0.3, 0], [0.04, H]],
    ]
    return r
  }, [])
  useFrame(() => {
    const c = clock.cycle ?? 0
    const fade = c < 10 ? 1 - ease((c - 1.2) / 1.2) : ease((c - 10.4) / 1)
    ref.current.scale.setScalar(0.9 + fade * 0.1)
    ref.current.children.forEach((m) => (m.material.opacity = fade * 0.9))
    ref.current.visible = fade > 0.01
  })
  return (
    <group ref={ref} position={[0, 0.1, -1]}>
      {bars.map(([pos, size], i) => (
        <mesh key={i} position={[pos[0], pos[1], 0]}>
          <boxGeometry args={[size[0], size[1], 0.06]} />
          <meshStandardMaterial color={MOLD} roughness={0.35} transparent />
        </mesh>
      ))}
    </group>
  )
}

function Rig({ clock, pointer, scrollRef, reduced, children }) {
  const g = useRef()
  useFrame((state, dt) => {
    clock.current += dt
    // ciclo de 14s: monta, respira, destaca peças, desmonta e remonta
    clock.cycle = reduced ? 5 : (clock.current + 13.5) % 14
    const hold = clock.cycle > 3 && clock.cycle < 9.6
    clock.lift = hold ? Math.floor((clock.cycle - 3) / 1.1) % PARTS.length : -1
    clock.liftAmt = hold ? Math.sin((((clock.cycle - 3) % 1.1) / 1.1) * Math.PI) * 0.7 : 0
    const time = clock.current
    const s = scrollRef.current
    clock.explode = THREE.MathUtils.damp(clock.explode, 0.45 + (1 + Math.sin(time * 0.8)) * 0.35 + s * 2.2, 4, dt)
    const tx = reduced ? -0.42 : -0.42 + Math.sin(time * 0.27) * 0.08 + pointer.current.y * 0.12
    const ty = reduced ? 0.55 : 0.55 + Math.sin(time * 0.35) * 0.3 + pointer.current.x * 0.22
    g.current.rotation.x = THREE.MathUtils.damp(g.current.rotation.x, tx, 3, dt)
    g.current.rotation.y = THREE.MathUtils.damp(g.current.rotation.y, ty, 3, dt)
    g.current.rotation.z = 0.12
  })
  return <group ref={g}>{children}</group>
}

export default function KitAssembly({ scrollRef }) {
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const clock = useRef(reduced ? 10 : 0)
  clock.explode ??= 0.6
  const pointer = useRef({ x: 0, y: 0 })
  const frameloop = useFrameloop()

  return (
    <div
      className="kit-canvas"
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect()
        pointer.current.x = ((e.clientX - r.left) / r.width) * 2 - 1
        pointer.current.y = ((e.clientY - r.top) / r.height) * 2 - 1
      }}
    >
      <Canvas dpr={DPR} frameloop={frameloop} camera={{ position: [0, 0, 9.5], fov: 36 }} gl={GL}>
        <AutoDpr />
        <ambientLight intensity={0.35} />
        <directionalLight position={[-4, 6, 6]} intensity={2.2} color="#e8f0ff" />
        <directionalLight position={[5, -3, 2]} intensity={0.7} color="#ffb020" />
        <Environment resolution={128}>
          <Lightformer intensity={2.4} position={[0, 5, -4]} scale={[12, 3, 1]} />
          <Lightformer intensity={1.2} position={[-6, 0, 3]} rotation-y={Math.PI / 2} scale={[8, 3, 1]} />
          <Lightformer intensity={0.6} color="#ffb020" position={[6, -2, 2]} rotation-y={-Math.PI / 2} scale={[6, 2, 1]} />
        </Environment>
        <Rig clock={clock} pointer={pointer} scrollRef={scrollRef} reduced={reduced}>
          <Sprue clock={clock} />
          {PARTS.map((p, i) => (
            <Part key={p.id} p={p} index={i} clock={clock} reduced={reduced} />
          ))}
        </Rig>
      </Canvas>
    </div>
  )
}
