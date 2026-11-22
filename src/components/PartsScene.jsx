import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { RoundedBox, Html, Environment, Lightformer, Float, Line } from '@react-three/drei'
import * as THREE from 'three'

const MOLD = '#1f6fff'
const MOLD_LO = '#123f99'
const CALL = '#ffb020'

// Fatias da página (de cima para baixo). Cada peça do catálogo acende a fatia do seu grupo.
const SLABS = [
  { g: 'A', h: 0.22 },
  { g: 'A', h: 0.9 },
  { g: 'B', h: 0.6 },
  { g: 'B', h: 0.6 },
  { g: 'C', h: 0.5 },
  { g: 'D', h: 0.45 },
  { g: 'D', h: 0.2 },
]

function Slab({ i, y, h, active, lift }) {
  const ref = useRef()
  const mat = useRef()
  useFrame((_, dt) => {
    const target = active ? lift : 0
    ref.current.position.z = THREE.MathUtils.damp(ref.current.position.z, target, 6, dt)
    ref.current.position.x = THREE.MathUtils.damp(ref.current.position.x, active ? -0.25 : 0, 6, dt)
    mat.current.emissiveIntensity = THREE.MathUtils.damp(mat.current.emissiveIntensity, active ? 0.35 : 0, 6, dt)
  })
  return (
    <group ref={ref} position={[0, y, 0]}>
      <RoundedBox args={[2.6, h, 0.12]} radius={0.03} smoothness={3}>
        <meshPhysicalMaterial ref={mat} color={active ? MOLD : '#2a3a5c'} emissive={MOLD} emissiveIntensity={0} roughness={0.35} clearcoat={0.7} />
      </RoundedBox>
      {h > 0.3 && (
        <>
          <mesh position={[-0.6, h * 0.18, 0.07]}><boxGeometry args={[1.1, 0.07, 0.02]} /><meshStandardMaterial color={active ? '#bcd3ff' : '#3c4f78'} /></mesh>
          <mesh position={[-0.75, h * 0.18 - 0.14, 0.07]}><boxGeometry args={[0.8, 0.05, 0.02]} /><meshStandardMaterial color={active ? '#8fb2ff' : '#33456a'} /></mesh>
          <mesh position={[0.75, 0, 0.07]}><boxGeometry args={[0.8, h - 0.16, 0.02]} /><meshStandardMaterial color={active ? MOLD_LO : '#22304d'} /></mesh>
        </>
      )}
    </group>
  )
}

// Objetos de requisito
function Need({ kind }) {
  const m = <meshPhysicalMaterial color={CALL} roughness={0.25} clearcoat={1} metalness={0.1} />
  if (kind === 'database')
    return <group>{[0, 0.28, 0.56].map((y) => <mesh key={y} position={[0, y - 0.28, 0]}><cylinderGeometry args={[0.3, 0.3, 0.22, 40]} />{m}</mesh>)}</group>
  if (kind === 'payments')
    return (
      <group rotation={[0.2, -0.5, 0.1]}>
        <RoundedBox args={[0.8, 0.5, 0.05]} radius={0.04}>{m}</RoundedBox>
        <mesh position={[0, 0.1, 0.03]}><boxGeometry args={[0.8, 0.09, 0.01]} /><meshStandardMaterial color="#1a1200" /></mesh>
        <mesh position={[-0.22, -0.1, 0.03]}><boxGeometry args={[0.18, 0.12, 0.01]} /><meshStandardMaterial color="#fff3d6" /></mesh>
      </group>
    )
  if (kind === 'auth')
    return (
      <group>
        <RoundedBox args={[0.55, 0.45, 0.25]} radius={0.05} position={[0, -0.12, 0]}>{m}</RoundedBox>
        <mesh position={[0, 0.12, 0]}><torusGeometry args={[0.18, 0.05, 16, 40, Math.PI]} /><meshStandardMaterial color="#d9dee8" metalness={1} roughness={0.25} /></mesh>
      </group>
    )
  if (kind === 'admin')
    return (
      <group rotation={[0, -0.4, 0]}>
        <RoundedBox args={[0.8, 0.55, 0.05]} radius={0.03}>{m}</RoundedBox>
        {[-0.12, 0, 0.12].map((y, k) => <mesh key={y} position={[-0.1 + k * 0.02, y, 0.03]}><boxGeometry args={[0.45 - k * 0.1, 0.05, 0.01]} /><meshStandardMaterial color="#1a1200" /></mesh>)}
        <mesh position={[0, -0.38, 0]}><boxGeometry args={[0.08, 0.2, 0.05]} />{m}</mesh>
      </group>
    )
  if (kind === 'notifications')
    return (
      <group>
        <mesh><sphereGeometry args={[0.28, 32, 16, 0, Math.PI * 2, 0, Math.PI / 1.7]} />{m}</mesh>
        <mesh position={[0, -0.18, 0]}><cylinderGeometry args={[0.34, 0.34, 0.06, 32]} />{m}</mesh>
        <mesh position={[0, -0.28, 0]}><sphereGeometry args={[0.07, 16, 16]} /><meshStandardMaterial color="#d9dee8" metalness={1} /></mesh>
      </group>
    )
  if (kind === '3d') return <mesh rotation={[0.4, 0.4, 0]}><icosahedronGeometry args={[0.35, 0]} />{m}</mesh>
  if (kind === 'integrations')
    return (
      <group rotation={[0, 0, 0.6]}>
        <RoundedBox args={[0.32, 0.45, 0.3]} radius={0.05}>{m}</RoundedBox>
        {[-0.08, 0.08].map((x) => <mesh key={x} position={[x, 0.32, 0]}><cylinderGeometry args={[0.03, 0.03, 0.2, 12]} /><meshStandardMaterial color="#d9dee8" metalness={1} /></mesh>)}
      </group>
    )
  return <mesh><sphereGeometry args={[0.25, 24, 24]} />{m}</mesh>
}

const NEED_LABEL = { database: 'Banco de dados', payments: 'Pagamento online', auth: 'Login', admin: 'Painel admin', notifications: 'Avisos', '3d': '3D', integrations: 'Integrações' }

function Rig({ children }) {
  const g = useRef()
  useFrame((s, dt) => {
    const t = s.clock.elapsedTime
    g.current.rotation.y = THREE.MathUtils.damp(g.current.rotation.y, -0.45 + Math.sin(t * 0.3) * 0.12 + s.pointer.x * 0.15, 3, dt)
    g.current.rotation.x = THREE.MathUtils.damp(g.current.rotation.x, 0.12 + s.pointer.y * -0.06, 3, dt)
  })
  return <group ref={g}>{children}</group>
}

export default function PartsScene({ group, alt, needs, label }) {
  const layout = useMemo(() => {
    let y = 1.9
    return SLABS.map((s) => {
      const out = { ...s, y: y - s.h / 2 }
      y -= s.h + 0.08
      return out
    })
  }, [])
  const activeIndex = { A: alt ? 0 : 1, B: alt ? 3 : 2, C: 4, D: alt ? 6 : 5 }[group] ?? 1
  const activeY = layout[activeIndex]?.y ?? 0
  const spots = needs.map((n, i) => {
    const a = (i - (needs.length - 1) / 2) * 0.95
    return { n, pos: [2.6, activeY + a * 0.9, 0.9] }
  })

  return (
    <Canvas dpr={[1, 1.75]} camera={{ position: [0.6, 0.2, 7.2], fov: 38 }} gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={0.45} />
      <directionalLight position={[-3, 5, 6]} intensity={2} />
      <Environment resolution={256}>
        <Lightformer intensity={2} position={[0, 4, -5]} scale={[10, 3, 1]} />
        <Lightformer intensity={1} position={[-5, 0, 3]} rotation-y={Math.PI / 2} scale={[6, 3, 1]} />
        <Lightformer intensity={0.8} color={CALL} position={[5, -1, 3]} rotation-y={-Math.PI / 2} scale={[5, 2, 1]} />
      </Environment>
      <Rig>
        <group position={[-0.9, 0, 0]}>
          {layout.map((s, i) => <Slab key={i} i={i} y={s.y} h={s.h} active={i === activeIndex} lift={0.9} />)}
          <Html position={[-0.25, activeY + (layout[activeIndex]?.h || 0.4) / 2 + 0.22, 0.95]} center zIndexRange={[5, 0]}><span className="ps-tag">{label}</span></Html>
          {spots.map(({ n, pos }) => (
            <group key={n}>
              <Line points={[[0.95, activeY, 0.9], [pos[0] - 0.45, pos[1], pos[2]]]} color={CALL} lineWidth={1.5} dashed dashSize={0.08} gapSize={0.06} />
              <Float speed={2} floatIntensity={0.5} rotationIntensity={0.6}>
                <group position={pos}><Need kind={n} /></group>
              </Float>
              <Html position={[pos[0], pos[1] - 0.48, pos[2]]} center zIndexRange={[5, 0]}><span className="ps-need">{NEED_LABEL[n] || n}</span></Html>
            </group>
          ))}
          {needs.length === 0 && (
            <Float speed={2} floatIntensity={0.6}>
              <group position={[2.4, activeY, 0.9]}>
                <mesh><torusGeometry args={[0.32, 0.07, 16, 48]} /><meshPhysicalMaterial color="#1faa59" clearcoat={1} roughness={0.25} /></mesh>
              </group>
              <Html position={[2.4, activeY - 0.6, 0.9]} center zIndexRange={[5, 0]}><span className="ps-need is-ok">Sem custo extra</span></Html>
            </Float>
          )}
        </group>
      </Rig>
    </Canvas>
  )
}
