import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import TokyoTower from "./models/TokyoTower.jsx";
import HimejiCastle from "./models/HimejiCastle.jsx";
import Petals from "./models/Petals.jsx";

const CASTLE_POS = new THREE.Vector3(16, 0, -6);

// Camera path: one point per "shot". Scroll progress (0 → 1) moves the camera
// smoothly through these points, and it always looks at the matching target.
const CAMERA_PATH = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0.6, 0.5, 9.5), // far away, looking up at the tower
  new THREE.Vector3(-4.6, 2.2, 5.2), // circling to the Main Deck
  new THREE.Vector3(-2.8, 5.4, -3.0), // high up beside the Top Deck
  new THREE.Vector3(5.5, 3.8, 3.8), // pulling away over the city
  new THREE.Vector3(12.4, 1.5, 2.6), // arriving in front of the castle
  new THREE.Vector3(23.0, 2.8, 0.2), // circling the castle
  new THREE.Vector3(19.2, 5.4, 6.2), // high overview
]);
const TARGET_PATH = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 2.6, 0),
  new THREE.Vector3(0, 2.7, 0),
  new THREE.Vector3(0, 4.4, 0),
  new THREE.Vector3(8, 1.6, -3),
  // Aim a little left of the castle so it sits on the right of the screen,
  // clear of the captions on the left.
  new THREE.Vector3(14.3, 1.4, -6.6),
  new THREE.Vector3(14.9, 1.5, -4.6),
  new THREE.Vector3(14.6, 1.3, -5.4),
]);

const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// Gradient sky on the inside of a huge sphere. Colours blend from Tokyo night
// to golden dusk as you scroll towards the castle.
const NIGHT_TOP = new THREE.Color("#050816");
const NIGHT_BOTTOM = new THREE.Color("#2a1630");
const DUSK_TOP = new THREE.Color("#1d2147");
const DUSK_BOTTOM = new THREE.Color("#f2875a");

function Sky({ mix }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          top: { value: NIGHT_TOP.clone() },
          bottom: { value: NIGHT_BOTTOM.clone() },
        },
        vertexShader: /* glsl */ `
          varying vec3 vPos;
          void main() {
            vPos = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 top;
          uniform vec3 bottom;
          varying vec3 vPos;
          void main() {
            float h = smoothstep(-0.05, 0.55, vPos.y);
            gl_FragColor = vec4(mix(bottom, top, h), 1.0);
          }`,
      }),
    []
  );

  useFrame(() => {
    const m = mix.current;
    material.uniforms.top.value.copy(NIGHT_TOP).lerp(DUSK_TOP, m);
    material.uniforms.bottom.value.copy(NIGHT_BOTTOM).lerp(DUSK_BOTTOM, m);
  });

  return (
    <mesh material={material} frustumCulled={false}>
      <sphereGeometry args={[80, 32, 16]} />
    </mesh>
  );
}

function Stars({ mix }) {
  const ref = useRef();
  const geometry = useMemo(() => {
    const pts = [];
    for (let i = 0; i < 900; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.9); // upper hemisphere only
      const r = 60;
      pts.push(r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);
  useFrame(() => {
    if (ref.current) ref.current.material.opacity = 0.9 * (1 - mix.current);
  });
  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial color="#ffffff" size={0.18} sizeAttenuation transparent fog={false} depthWrite={false} />
    </points>
  );
}

// Points along the camera's flight, used to keep buildings out of its way.
const PATH_SAMPLES = CAMERA_PATH.getSpacedPoints(80);
function nearCameraPath(x, z) {
  return PATH_SAMPLES.some((p) => (p.x - x) ** 2 + (p.z - z) ** 2 < 2.6 ** 2);
}

// Tokyo around the tower: dark buildings plus thousands of tiny window lights.
function City() {
  const { buildings, lights } = useMemo(() => {
    const buildings = [];
    const lightPts = [];
    const lightCols = [];
    const warm = new THREE.Color("#ffc98a");
    const cool = new THREE.Color("#bcd8ff");
    let tries = 0;
    while (buildings.length < 420 && tries++ < 5000) {
      const r = 1.6 + Math.pow(Math.random(), 0.7) * 9;
      const a = Math.random() * Math.PI * 2;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      if (Math.abs(x) < 1.2 && z > 0 && z < 2.2) continue; // keep the tower's front clear
      if (x > 6 && z < 1) continue; // leave the castle side open
      if (nearCameraPath(x, z)) continue; // never block the camera's view
      const w = 0.25 + Math.random() * 0.45;
      const d = 0.25 + Math.random() * 0.45;
      const h = 0.2 + Math.random() * (0.4 + r * 0.12);
      buildings.push({ x, z, w, d, h });
      for (let k = 0; k < Math.ceil(h * 7); k++) {
        const side = Math.floor(Math.random() * 4);
        const u = Math.random() - 0.5;
        const y = Math.random() * h * 0.95 + 0.03;
        const p = [
          [x + u * w, y, z + d / 2 + 0.01],
          [x + u * w, y, z - d / 2 - 0.01],
          [x + w / 2 + 0.01, y, z + u * d],
          [x - w / 2 - 0.01, y, z + u * d],
        ][side];
        lightPts.push(...p);
        lightCols.push(...(Math.random() < 0.8 ? warm : cool).toArray());
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(lightPts, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(lightCols, 3));
    return { buildings, lights: g };
  }, []);

  const ref = useRef();
  const box = useMemo(() => {
    const g = new THREE.BoxGeometry(1, 1, 1);
    g.translate(0, 0.5, 0);
    return g;
  }, []);

  // Place every building with one InstancedMesh (one draw call).
  useLayoutEffect(() => {
    const m = new THREE.Object3D();
    buildings.forEach((b, i) => {
      m.position.set(b.x, 0, b.z);
      m.scale.set(b.w, b.h, b.d);
      m.updateMatrix();
      ref.current.setMatrixAt(i, m.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  }, [buildings]);

  return (
    <group>
      <instancedMesh ref={ref} args={[box, null, buildings.length]}>
        <meshStandardMaterial color="#14131c" roughness={0.9} />
      </instancedMesh>
      <points geometry={lights}>
        <pointsMaterial vertexColors size={0.035} sizeAttenuation toneMapped={false} />
      </points>
    </group>
  );
}

function Mist({ position, rise }) {
  // Soft glowing mist the castle rises out of.
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const ctx = c.getContext("2d");
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(255,255,255,0.9)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }, []);
  const ref = useRef();
  useFrame(() => {
    if (ref.current) ref.current.children.forEach((m) => (m.material.opacity = 0.32 * (1 - rise.current * 0.6)));
  });
  return (
    <group ref={ref} position={position}>
      {[
        [0, 0.3, 2.5, 9],
        [-3, 0.2, 0.5, 7],
        [3, 0.25, 0, 7],
        [0, 0.15, -2.5, 10],
      ].map(([x, y, z, s], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[-Math.PI / 2, 0, 0]} scale={s}>
          <planeGeometry />
          <meshBasicMaterial map={tex} color="#ffe6d6" transparent opacity={0.3} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

export default function LandmarksScene({ progress, animate = true }) {
  const { camera, size } = useThree();
  const smooth = useRef(progress.current); // eased copy of scroll progress
  const mix = useRef(0); // 0 = Tokyo night, 1 = castle dusk
  const rise = useRef(0); // how far the castle has risen from the mist
  const castle = useRef();
  const fog = useRef();
  const pos = useMemo(() => new THREE.Vector3(), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  const fogNight = useMemo(() => new THREE.Color("#120d1c"), []);
  const fogDusk = useMemo(() => new THREE.Color("#c9765a"), []);

  // Wider field of view on narrow phone screens so both landmarks fit.
  const portrait = size.width < size.height;

  useFrame((state, delta) => {
    // Ease towards the real scroll position for a buttery camera.
    smooth.current = animate
      ? THREE.MathUtils.damp(smooth.current, progress.current, 4, Math.min(delta, 0.05))
      : progress.current;
    const p = smooth.current;

    mix.current = smoothstep(0.42, 0.66, p);
    rise.current = smoothstep(0.45, 0.72, p);

    CAMERA_PATH.getPoint(p, pos);
    TARGET_PATH.getPoint(p, target);
    // A gentle sway from the pointer adds depth.
    pos.x += state.pointer.x * 0.25;
    pos.y += state.pointer.y * 0.15;
    camera.position.copy(pos);
    camera.lookAt(target);
    if (camera.fov !== (portrait ? 62 : 45)) {
      camera.fov = portrait ? 62 : 45;
      camera.updateProjectionMatrix();
    }

    if (castle.current) castle.current.position.y = CASTLE_POS.y - 1.6 * (1 - rise.current);
    if (fog.current) fog.current.color.copy(fogNight).lerp(fogDusk, mix.current);
  });

  return (
    <>
      <fog ref={fog} attach="fog" args={["#120d1c", 10, 34]} />
      <Sky mix={mix} />
      <Stars mix={mix} />

      <hemisphereLight args={["#8fa4ff", "#2a1620", 0.5]} />
      <directionalLight position={[10, 8, 6]} intensity={1.1} color="#ffd6b0" />

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[8, 0, -2]}>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#0d0c14" roughness={1} />
      </mesh>

      <TokyoTower />
      <City />

      <group ref={castle} position={CASTLE_POS.toArray()}>
        <HimejiCastle />
      </group>
      <Mist position={CASTLE_POS.toArray()} rise={rise} />
      <Petals count={110} area={[11, 5, 8]} center={[CASTLE_POS.x, 2.2, CASTLE_POS.z + 1]} animate={animate} size={0.08} />

      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur luminanceThreshold={0.62} intensity={0.9} radius={0.65} />
      </EffectComposer>
    </>
  );
}
