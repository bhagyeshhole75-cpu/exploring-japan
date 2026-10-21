import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Float, Lightformer, MeshTransmissionMaterial } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

const VERMILION = "#e5482c";
const LACQUER_BLACK = "#1a1412";

// A torii gate built from simple shapes: two pillars, two cross-beams and a
// curved top beam (kasagi) whose ends sweep upwards.
function Torii() {
  const lacquer = (
    <meshPhysicalMaterial color={VERMILION} roughness={0.32} clearcoat={1} clearcoatRoughness={0.15} />
  );
  const black = <meshPhysicalMaterial color={LACQUER_BLACK} roughness={0.4} clearcoat={0.6} />;

  // The kasagi: a flat box bent upwards at the ends.
  const kasagi = useMemo(() => {
    const geo = new THREE.BoxGeometry(3.3, 0.16, 0.34, 48, 1, 1);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      pos.setY(i, pos.getY(i) + Math.pow(Math.abs(x) / 1.65, 2.4) * 0.28);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <group position={[0, -0.25, 0]}>
      {/* Pillars (hashira), slightly leaning inwards like real torii */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.95, -0.15, 0]} rotation={[0, 0, side * 0.03]}>
          <mesh>
            <cylinderGeometry args={[0.11, 0.13, 2.7, 32]} />
            {lacquer}
          </mesh>
          {/* Black base (kamaki) */}
          <mesh position={[0, -1.25, 0]}>
            <cylinderGeometry args={[0.15, 0.16, 0.22, 32]} />
            {black}
          </mesh>
        </group>
      ))}

      {/* Lower cross-beam (nuki) */}
      <mesh position={[0, 0.62, 0]}>
        <boxGeometry args={[2.55, 0.13, 0.15]} />
        {lacquer}
      </mesh>

      {/* Centre strut (gakuzuka) */}
      <mesh position={[0, 0.88, 0]}>
        <boxGeometry args={[0.12, 0.4, 0.12]} />
        {lacquer}
      </mesh>

      {/* Upper beam (shimaki) */}
      <mesh position={[0, 1.12, 0]}>
        <boxGeometry args={[2.95, 0.13, 0.26]} />
        {lacquer}
      </mesh>

      {/* Top beam (kasagi), black-lacquered like many shrine gates */}
      <mesh geometry={kasagi} position={[0, 1.27, 0]}>
        {black}
      </mesh>
    </group>
  );
}

// A refractive glass sun behind the gate. It bends the warm glow behind it.
function GlassSun({ animate }) {
  return (
    <Float speed={animate ? 1 : 0} rotationIntensity={0} floatIntensity={0.3}>
      <mesh position={[0.15, 0.55, -1.6]}>
        <sphereGeometry args={[1.25, 96, 96]} />
        <MeshTransmissionMaterial
          samples={6}
          resolution={512}
          thickness={1.6}
          roughness={0.04}
          ior={1.4}
          chromaticAberration={0.35}
          anisotropy={0.2}
          distortion={0.2}
          distortionScale={0.4}
          temporalDistortion={animate ? 0.06 : 0}
          color="#fff3ea"
          backside
        />
      </mesh>
    </Float>
  );
}

// Soft radial glow texture shared by the glow planes.
let glowTexture;
function getGlowTexture() {
  if (glowTexture) return glowTexture;
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.35, "rgba(255,255,255,0.35)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  glowTexture = new THREE.CanvasTexture(c);
  return glowTexture;
}

function Glow({ color, position, scale, opacity = 0.55 }) {
  const map = useMemo(getGlowTexture, []);
  return (
    <mesh position={position} scale={scale}>
      <planeGeometry />
      <meshBasicMaterial
        map={map}
        color={color}
        transparent
        opacity={opacity}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </mesh>
  );
}

// Sakura petals: one InstancedMesh draws all of them in a single GPU call.
function Petals({ count = 140, animate }) {
  const ref = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const geometry = useMemo(() => {
    // A petal: rounded shape with a small notch at the tip.
    const s = new THREE.Shape();
    s.moveTo(0, -0.5);
    s.bezierCurveTo(0.45, -0.25, 0.42, 0.35, 0.12, 0.5);
    s.lineTo(0, 0.38);
    s.lineTo(-0.12, 0.5);
    s.bezierCurveTo(-0.42, 0.35, -0.45, -0.25, 0, -0.5);
    const g = new THREE.ShapeGeometry(s, 12);
    g.scale(0.09, 0.09, 0.09);
    return g;
  }, []);

  const petals = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        x: (Math.random() - 0.5) * 9,
        y: Math.random() * 6 - 3,
        z: (Math.random() - 0.5) * 4 + 0.5,
        speed: 0.25 + Math.random() * 0.35,
        sway: 0.4 + Math.random() * 0.8,
        phase: Math.random() * Math.PI * 2,
        spin: 0.5 + Math.random() * 1.5,
        scale: 0.6 + Math.random() * 0.8,
      })),
    [count]
  );

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    petals.forEach((p, i) => {
      if (animate) {
        p.y -= p.speed * delta;
        if (p.y < -3.2) {
          p.y = 3.2;
          p.x = (Math.random() - 0.5) * 9;
        }
      }
      dummy.position.set(p.x + Math.sin(t * p.sway + p.phase) * 0.35, p.y, p.z);
      dummy.rotation.set(t * p.spin * 0.6 + p.phase, t * p.spin + p.phase, Math.sin(t + p.phase) * 0.6);
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[geometry, null, count]}>
      <meshStandardMaterial color="#ffc4d2" emissive="#ff8fae" emissiveIntensity={0.35} side={THREE.DoubleSide} roughness={0.6} />
    </instancedMesh>
  );
}

// Gently turns the camera towards the pointer, so the gate feels 3D.
function CameraRig({ animate }) {
  const { camera, pointer } = useThree();
  useFrame(() => {
    if (!animate) return;
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, pointer.x * 0.9, 0.04);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, 0.2 + pointer.y * 0.4, 0.04);
    camera.lookAt(0, 0.3, 0);
  });
  return null;
}

export default function ToriiScene({ animate = true }) {
  const { width } = useThree((s) => s.viewport);
  const scale = Math.min(1, width / 4.2);

  return (
    <>
      <color attach="background" args={["#0d0a09"]} />
      <fog attach="fog" args={["#0d0a09", 6, 13]} />

      <group scale={scale}>
        <Glow color="#ff6a2b" position={[0.2, 0.6, -2.4]} scale={5.2} opacity={0.6} />
        <Glow color="#ff2f6d" position={[-1.3, -0.4, -2.8]} scale={4} opacity={0.35} />
        <GlassSun animate={animate} />
        <Torii />
      </group>

      <Petals animate={animate} />
      <CameraRig animate={animate} />

      <ambientLight intensity={0.25} />
      <directionalLight position={[3, 4, 5]} intensity={1.6} color="#fff1e0" />
      <Environment resolution={256}>
        <Lightformer form="ring" intensity={4} color="#ff7a3d" position={[3, 2, -3]} scale={3} />
        <Lightformer form="rect" intensity={3} color="#ffd9b8" position={[-4, 1, 2]} rotation-y={Math.PI / 2} scale={[2, 6, 1]} />
        <Lightformer form="rect" intensity={1.5} color="#ffffff" position={[0, 5, -4]} scale={[10, 1, 1]} />
      </Environment>

      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur luminanceThreshold={0.7} intensity={0.75} radius={0.6} />
      </EffectComposer>
    </>
  );
}
