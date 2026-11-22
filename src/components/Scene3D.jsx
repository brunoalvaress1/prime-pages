import { Suspense, useMemo, useRef } from 'react'
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
        {shape === 'box' && <RoundedBox args={[1.6, 2.1, 0.32]} radius={0.06}>{m}</RoundedBox>}
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
