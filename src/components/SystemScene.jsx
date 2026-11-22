import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { RoundedBox, Html, Environment, Lightformer, Line } from '@react-three/drei'
import * as THREE from 'three'

const MOLD = '#1f6fff'
const CALL = '#ffb020'

// Cada módulo do fluxo vira um bloco sobre a plataforma.
// Um "pacote" de informação viaja de um bloco ao próximo, na ordem em que o trabalho acontece.
function Node({ pos, label, who, active, done, index }) {
  const ref = useRef()
  const mat = useRef()
  useFrame((_, dt) => {
    ref.current.position.y = THREE.MathUtils.damp(ref.current.position.y, active ? 0.45 : 0.18, 6, dt)
    mat.current.emissiveIntensity = THREE.MathUtils.damp(mat.current.emissiveIntensity, active ? 0.5 : 0, 6, dt)
  })
  return (
    <group position={[pos[0], 0, pos[2]]}>
      <group ref={ref}>
        <RoundedBox args={[1.1, 0.36, 0.8]} radius={0.06} smoothness={3}>
          <meshPhysicalMaterial ref={mat} color={active ? MOLD : done ? '#2d5bd1' : '#2a3a5c'} emissive={MOLD} emissiveIntensity={0} roughness={0.3} clearcoat={0.8} />
        </RoundedBox>
        <mesh position={[0, 0.19, 0]}><boxGeometry args={[0.7, 0.02, 0.45]} /><meshStandardMaterial color={active ? '#bcd3ff' : '#3c4f78'} /></mesh>
        <Html position={[0, active ? 0.7 : 0.55, 0]} center zIndexRange={[6, 0]}>
          <span className={`ss3-label ${active ? 'is-on' : ''}`}><b>{index + 1}</b>{label}</span>
        </Html>
        {active && (
          <Html position={[0, 1.15, 0]} center zIndexRange={[7, 0]}>
            <span className="ss3-who">{who}</span>
          </Html>
        )}
      </group>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.75, 40]} />
        <meshBasicMaterial color={active ? MOLD : '#1a2540'} transparent opacity={active ? 0.35 : 0.6} />
      </mesh>
    </group>
  )
}

function Packet({ from, to, k }) {
  const ref = useRef()
  const t0 = useRef(0)
  useFrame((s) => {
    if (t0.current === 0) t0.current = s.clock.elapsedTime
    const t = Math.min(1, (s.clock.elapsedTime - t0.current) / 0.9)
    const e = 1 - Math.pow(1 - t, 3)
    ref.current.position.set(THREE.MathUtils.lerp(from[0], to[0], e), 0.5 + Math.sin(e * Math.PI) * 0.6, THREE.MathUtils.lerp(from[2], to[2], e))
  })
  return (
    <mesh ref={ref} key={k}>
      <sphereGeometry args={[0.11, 24, 24]} />
      <meshStandardMaterial color={CALL} emissive={CALL} emissiveIntensity={1.2} />
    </mesh>
  )
}

function Rig({ children }) {
  const g = useRef()
  useFrame((s, dt) => {
    const t = s.clock.elapsedTime
    g.current.rotation.y = THREE.MathUtils.damp(g.current.rotation.y, Math.sin(t * 0.18) * 0.25 + s.pointer.x * 0.2, 2, dt)
  })
  return <group ref={g}>{children}</group>
}

export default function SystemScene({ steps, at }) {
  // posições em zigue-zague para caber várias etapas de forma legível
  const pos = useMemo(() => {
    const n = steps.length
    const w = Math.min(7.2, n * 1.5)
    return steps.map((_, i) => [n === 1 ? 0 : -w / 2 + (w / (n - 1)) * i, 0, i % 2 ? 0.9 : -0.6])
  }, [steps])
  const prev = (at - 1 + steps.length) % steps.length

  return (
    <Canvas dpr={[1, 1.75]} camera={{ position: [0, 5.6, 10.2], fov: 38 }} gl={{ antialias: true, alpha: true }} onCreated={({ camera }) => camera.lookAt(0, 0.2, 0)}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[-4, 7, 5]} intensity={2} />
      <Environment resolution={256}>
        <Lightformer intensity={2} position={[0, 5, -4]} scale={[12, 3, 1]} />
        <Lightformer intensity={0.8} color={CALL} position={[6, 1, 2]} rotation-y={-Math.PI / 2} scale={[5, 2, 1]} />
      </Environment>
      <Rig>
        <RoundedBox args={[Math.min(8.6, steps.length * 1.5 + 1.6), 0.12, 3.2]} radius={0.06} position={[0, -0.08, 0.15]}>
          <meshPhysicalMaterial color="#111a2c" roughness={0.6} />
        </RoundedBox>
        {pos.slice(1).map((p, i) => (
          <Line key={i} points={[[pos[i][0], 0.06, pos[i][2]], [p[0], 0.06, p[2]]]} color={i < at ? MOLD : '#33456a'} lineWidth={2} dashed={i >= at} dashSize={0.12} gapSize={0.08} />
        ))}
        {steps.map((s, i) => (
          <Node key={i} index={i} pos={pos[i]} label={s.label} who={s.who} active={i === at} done={i < at} />
        ))}
        {steps.length > 1 && <Packet key={at} k={at} from={pos[prev]} to={pos[at]} />}
      </Rig>
    </Canvas>
  )
}
