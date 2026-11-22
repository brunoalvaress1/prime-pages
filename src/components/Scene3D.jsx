import { Suspense, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, Float, useGLTF, Center, MeshDistortMaterial, RoundedBox, Lightformer, MeshTransmissionMaterial } from '@react-three/drei'

function Model({ url }) {
  const { scene } = useGLTF(url)
  return (
    <Center>
      <primitive object={scene} />
    </Center>
  )
}

function Mat({ material, color }) {
  if (material === 'metal') return <meshStandardMaterial color={color} metalness={1} roughness={0.18} />
  if (material === 'glass')
    return <MeshTransmissionMaterial color={color} thickness={0.6} roughness={0.05} transmission={1} ior={1.35} chromaticAberration={0.06} backside samples={6} resolution={256} />
  if (material === 'matte') return <meshStandardMaterial color={color} roughness={0.9} metalness={0} />
  return <meshPhysicalMaterial color={color} roughness={0.22} clearcoat={1} clearcoatRoughness={0.15} metalness={0.05} />
}

function Cluster({ material, color }) {
  const items = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => ({
        p: [Math.sin(i * 2.1) * 1.5, Math.cos(i * 1.7) * 1.1, Math.sin(i * 0.9) * 0.8],
        s: 0.22 + ((i * 37) % 10) / 28,
        k: i % 3,
      })),
    [],
  )
  return items.map((it, i) => (
    <Float key={i} speed={1 + (i % 4) * 0.4} floatIntensity={1.2} rotationIntensity={1}>
      <mesh position={it.p} scale={it.s}>
        {it.k === 0 && <icosahedronGeometry args={[1, 0]} />}
        {it.k === 1 && <torusGeometry args={[0.8, 0.32, 24, 64]} />}
        {it.k === 2 && <sphereGeometry args={[0.9, 48, 48]} />}
        <Mat material={material} color={color} />
      </mesh>
    </Float>
  ))
}

// Objetos temáticos feitos com geometria (sem arquivos externos)
function Gear({ m }) {
  const geo = useMemo(() => {
    const s = new THREE.Shape()
    const teeth = 12, r1 = 1.0, r2 = 1.25
    for (let i = 0; i < teeth * 2; i++) {
      const a0 = (i / (teeth * 2)) * Math.PI * 2
      const a1 = ((i + 1) / (teeth * 2)) * Math.PI * 2
      const r = i % 2 ? r1 : r2
      if (i === 0) s.moveTo(Math.cos(a0) * r, Math.sin(a0) * r)
      s.lineTo(Math.cos(a0) * r, Math.sin(a0) * r)
      s.lineTo(Math.cos(a1) * r, Math.sin(a1) * r)
    }
    const hole = new THREE.Path()
    hole.absarc(0, 0, 0.42, 0, Math.PI * 2, true)
    s.holes.push(hole)
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.35, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 3 })
    g.center()
    return g
  }, [])
  return <mesh geometry={geo} rotation={[0.4, 0.3, 0]}>{m}</mesh>
}

function Lathe({ points, m, y = 0 }) {
  const geo = useMemo(() => new THREE.LatheGeometry(points.map(([x, yy]) => new THREE.Vector2(x, yy)), 64), [points])
  return <mesh geometry={geo} position={[0, y, 0]}>{m}</mesh>
}
const GLASS_PTS = [[0, -1.3], [0.6, -1.3], [0.62, -1.25], [0.08, -1.18], [0.06, -0.2], [0.1, -0.05], [0.55, 0.25], [0.68, 0.8], [0.66, 1.3], [0.62, 1.3], [0.6, 0.82], [0.5, 0.3], [0.05, 0.02], [0, 0.02]]
const BOTTLE_PTS = [[0, -1.1], [0.75, -1.1], [0.85, -0.9], [0.85, 0.35], [0.6, 0.65], [0.22, 0.75], [0.22, 0.95], [0, 0.95]]

function Shape({ shape, color, material }) {
  const ref = useRef()
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.3
  })
  const m = <Mat material={material} color={color} />
  if (shape === 'cluster') return <group ref={ref}><Cluster material={material} color={color} /></group>
  return (
    <Float speed={1.4} rotationIntensity={0.35} floatIntensity={0.6}>
      <group ref={ref}>
        {shape === 'knot' && <mesh><torusKnotGeometry args={[0.9, 0.3, 240, 36]} />{m}</mesh>}
        {shape === 'sphere' && (
          <mesh>
            <icosahedronGeometry args={[1.2, 48]} />
            <MeshDistortMaterial color={color} distort={0.38} speed={2} roughness={material === 'matte' ? 0.8 : 0.15} metalness={material === 'metal' ? 0.9 : 0.1} />
          </mesh>
        )}
        {shape === 'gem' && <mesh rotation={[0.3, 0, 0.2]}><octahedronGeometry args={[1.3, 0]} />{m}</mesh>}
        {shape === 'capsule' && <mesh rotation={[0, 0, Math.PI / 4]}><capsuleGeometry args={[0.55, 1.3, 16, 48]} />{m}</mesh>}
        {shape === 'rings' && (
          <group>
            {[0, 1, 2].map((i) => (
              <mesh key={i} rotation={[i * 1.05, i * 0.7, 0]}><torusGeometry args={[1.15 - i * 0.18, 0.07, 24, 120]} />{m}</mesh>
            ))}
          </group>
        )}
        {shape === 'gear' && <Gear m={m} />}
        {shape === 'wineglass' && <Lathe points={GLASS_PTS} m={m} />}
        {shape === 'bottle' && (
          <group rotation={[0, 0, 0.15]}>
            <Lathe points={BOTTLE_PTS} m={m} />
            <mesh position={[0, 1.2, 0]}><cylinderGeometry args={[0.32, 0.32, 0.5, 48]} /><meshStandardMaterial color="#c9a45c" metalness={1} roughness={0.25} /></mesh>
          </group>
        )}
        {shape === 'dumbbell' && (
          <group rotation={[0.3, 0, 0.5]}>
            <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.12, 0.12, 2.2, 32]} /><meshStandardMaterial color="#c8c8c8" metalness={1} roughness={0.2} /></mesh>
            {[-1, 1].map((s) => (
              <group key={s}>
                <mesh position={[s * 0.8, 0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.55, 0.55, 0.28, 48]} />{m}</mesh>
                <mesh position={[s * 1.02, 0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.42, 0.42, 0.18, 48]} />{m}</mesh>
              </group>
            ))}
          </group>
        )}
        {shape === 'bag' && (
          <group rotation={[0.1, -0.4, 0]}>
            <RoundedBox args={[1.5, 1.7, 0.6]} radius={0.04} position={[0, -0.3, 0]}>{m}</RoundedBox>
            <mesh position={[0, 0.62, 0]}><torusGeometry args={[0.38, 0.05, 16, 48, Math.PI]} /><meshStandardMaterial color="#1b1b1b" roughness={0.5} /></mesh>
          </group>
        )}
        {shape === 'house' && (
          <group rotation={[0.15, -0.6, 0]}>
            <RoundedBox args={[1.6, 1.1, 1.3]} radius={0.03} position={[0, -0.45, 0]}>{m}</RoundedBox>
            <mesh position={[0, 0.42, 0]} rotation={[0, Math.PI / 4, 0]} scale={[1, 0.62, 1]}><coneGeometry args={[1.3, 1, 4]} /><meshStandardMaterial color="#2b2b2b" roughness={0.6} /></mesh>
            <mesh position={[0.25, -0.62, 0.66]}><boxGeometry args={[0.36, 0.7, 0.02]} /><meshStandardMaterial color="#2b2b2b" /></mesh>
          </group>
        )}
        {shape === 'box' &&<RoundedBox args={[1.6, 2.1, 0.32]} radius={0.06}>{m}</RoundedBox>}
        {shape === 'torus' && <mesh rotation={[Math.PI / 3, 0, 0]}><torusGeometry args={[1, 0.38, 48, 160]} />{m}</mesh>}
        {shape === 'phone' && (
          <group>
            <RoundedBox args={[1.1, 2.2, 0.12]} radius={0.12}><meshStandardMaterial color="#14161b" roughness={0.4} /></RoundedBox>
            <mesh position={[0, 0, 0.065]}><planeGeometry args={[0.98, 2.04]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.25} /></mesh>
          </group>
        )}
      </group>
    </Float>
  )
}

export default function Scene3D({ shape = 'knot', color = '#1f6fff', material = 'glossy', glb, interactive = true, zoom = 4.6 }) {
  return (
    <Canvas dpr={[1, 1.75]} camera={{ position: [0, 0, zoom], fov: 40 }} gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 4, 5]} intensity={1.6} />
      <Suspense fallback={null}>
        {glb ? <Model url={glb} /> : <Shape shape={shape} color={color} material={material} />}
        <Environment resolution={256}>
          <Lightformer intensity={2} position={[0, 4, -6]} scale={[10, 4, 1]} />
          <Lightformer intensity={1.2} position={[-5, 1, 2]} rotation-y={Math.PI / 2} scale={[6, 2, 1]} />
          <Lightformer intensity={0.8} position={[5, -1, 2]} rotation-y={-Math.PI / 2} scale={[6, 2, 1]} />
          <Lightformer intensity={1.5} color="#ffd9b0" position={[0, -4, 3]} rotation-x={-Math.PI / 2} scale={[8, 3, 1]} />
        </Environment>
      </Suspense>
      {interactive && <OrbitControls enablePan={false} enableZoom={false} />}
    </Canvas>
  )
}
