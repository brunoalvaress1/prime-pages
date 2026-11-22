import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, Float, useGLTF, Center, MeshDistortMaterial, RoundedBox, Lightformer } from '@react-three/drei'

function Model({ url }) {
  const { scene } = useGLTF(url)
  return (
    <Center>
      <primitive object={scene} />
    </Center>
  )
}

function Shape({ shape, color }) {
  const ref = useRef()
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.35
  })
  const mat = <meshStandardMaterial color={color} roughness={0.28} metalness={0.15} />
  return (
    <Float speed={1.4} rotationIntensity={0.35} floatIntensity={0.6}>
      <group ref={ref}>
        {shape === 'knot' && <mesh castShadow><torusKnotGeometry args={[0.9, 0.3, 220, 32]} />{mat}</mesh>}
        {shape === 'sphere' && (
          <mesh>
            <icosahedronGeometry args={[1.2, 32]} />
            <MeshDistortMaterial color={color} distort={0.35} speed={2} roughness={0.2} />
          </mesh>
        )}
        {shape === 'box' && <RoundedBox args={[1.6, 2.1, 0.32]} radius={0.06}>{mat}</RoundedBox>}
        {shape === 'torus' && <mesh rotation={[Math.PI / 3, 0, 0]}><torusGeometry args={[1, 0.38, 48, 160]} />{mat}</mesh>}
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


export default function Scene3D({ shape = 'knot', color = '#1f6fff', glb }) {
  return (
    <Canvas dpr={[1, 1.75]} camera={{ position: [0, 0, 4.6], fov: 40 }} gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 4, 5]} intensity={1.6} />
      <Suspense fallback={null}>
        {glb ? <Model url={glb} /> : <Shape shape={shape} color={color} />}
        <Environment resolution={256}>
          <Lightformer intensity={2} position={[0, 4, -6]} scale={[10, 4, 1]} />
          <Lightformer intensity={1.2} position={[-5, 1, 2]} rotation-y={Math.PI / 2} scale={[6, 2, 1]} />
          <Lightformer intensity={0.8} position={[5, -1, 2]} rotation-y={-Math.PI / 2} scale={[6, 2, 1]} />
        </Environment>
      </Suspense>
      <OrbitControls enablePan={false} enableZoom={false} />
    </Canvas>
  )
}
