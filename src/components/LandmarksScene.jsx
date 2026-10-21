import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import TokyoTower from "./models/TokyoTower.jsx";
import ToriiTunnel, { TUNNEL_PATH } from "./models/ToriiTunnel.jsx";
import GoldenPavilion from "./models/GoldenPavilion.jsx";
import HimejiCastle from "./models/HimejiCastle.jsx";
import MountFuji from "./models/MountFuji.jsx";
import Petals from "./models/Petals.jsx";

// Where each landmark stands in the 3D world (x, y, z).
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const INARI_POS = V(14, 0, 10);
const KINKAKU_POS = V(34, 0, -5);
const CASTLE_POS = V(48, 0, -6);
const FUJI_POS = V(84, 0, -40);

// Lakes: [centre x, centre z, radius x, radius z]. The ground has holes cut
// here, and a mirrored copy of the landmark sits underneath to fake a reflection.
const POND = [34, -1.3, 4.6, 3.0];
const LAKE = [70, -19, 15, 6.5];

// ---------------------------------------------------------------------------
// The journey. Each keyframe says: at this scroll progress (p), put the camera
// here (pos) and look there (tgt). The camera glides along a smooth curve
// through all of them.
// ---------------------------------------------------------------------------
const tunnelAt = (u, h) => TUNNEL_PATH.getPointAt(Math.min(1, u)).add(INARI_POS).setY(TUNNEL_PATH.getPointAt(Math.min(1, u)).y + h);
const T0 = TUNNEL_PATH.getTangentAt(0);
const T1 = TUNNEL_PATH.getTangentAt(1);
const ENTRY = tunnelAt(0, 0);
const EXIT = tunnelAt(1, 0);

const KEYS = [
  // Tokyo Tower
  { p: 0.0, pos: V(0.6, 0.5, 9.5), tgt: V(0, 2.6, 0) },
  { p: 0.06, pos: V(-4.6, 2.2, 5.2), tgt: V(0, 2.7, 0) },
  { p: 0.12, pos: V(-2.8, 5.4, -3.0), tgt: V(0, 4.4, 0) },
  { p: 0.17, pos: V(6, 3.6, 6.5), tgt: V(13, 0.8, 10) },
  // Fushimi Inari: approach, then fly through the torii tunnel
  { p: 0.21, pos: ENTRY.clone().addScaledVector(T0, -2.6).setY(0.75), tgt: ENTRY.clone().addScaledVector(T0, 1.2).setY(0.5) },
  ...[0.08, 0.24, 0.4, 0.56, 0.72, 0.88].map((u, i) => ({
    p: 0.245 + i * 0.024,
    pos: tunnelAt(u, 0.46),
    tgt: tunnelAt(u + 0.12, 0.5),
  })),
  { p: 0.39, pos: EXIT.clone().addScaledVector(T1, 1.6).setY(EXIT.y + 0.7), tgt: EXIT.clone().addScaledVector(T1, 4).setY(EXIT.y + 0.4) },
  { p: 0.42, pos: V(27.5, 3.0, 2.5), tgt: V(33, 1.0, -4.5) },
  // Kinkaku-ji: low over the pond to catch the reflection
  { p: 0.46, pos: V(31.0, 0.7, 3.2), tgt: V(31.0, 1.0, -4.6), focus: V(34, 1.1, -5) },
  { p: 0.53, pos: V(37.8, 1.2, 2.8), tgt: V(32.3, 1.0, -4.0), focus: V(34, 1.1, -5) },
  { p: 0.58, pos: V(41, 3.4, 1), tgt: V(46.5, 1.5, -6) },
  // Himeji Castle (aim left of it so it sits right of the captions)
  { p: 0.62, pos: V(44.4, 1.5, 2.6), tgt: V(46.3, 1.4, -6.6), focus: V(48, 1.6, -6) },
  { p: 0.69, pos: V(55, 2.8, 0.2), tgt: V(46.9, 1.5, -4.6), focus: V(48, 1.6, -6) },
  { p: 0.75, pos: V(51.2, 5.4, 6.2), tgt: V(46.6, 1.3, -5.4), focus: V(48, 1.4, -6) },
  // Mount Fuji across the lake
  { p: 0.8, pos: V(56, 6.5, 2), tgt: V(70, 4, -25) },
  { p: 0.88, pos: V(60, 1.3, -5), tgt: V(75.8, 5, -45.7), focus: V(84, 4.5, -40) },
  { p: 1.0, pos: V(64, 2.2, -3), tgt: V(75.2, 5.4, -44.8), focus: V(84, 4.8, -40) },
];

const CAMERA_PATH = new THREE.CatmullRomCurve3(KEYS.map((k) => k.pos));
// On wide screens the camera aims a little to the side ("tgt") so the landmark
// sits clear of the captions on the left. On phones the captions sit at the
// bottom, so it aims straight at the landmark ("focus") instead.
const TARGET_PATH = new THREE.CatmullRomCurve3(KEYS.map((k) => k.tgt));
const FOCUS_PATH = new THREE.CatmullRomCurve3(KEYS.map((k) => k.focus ?? k.tgt));

// Turn scroll progress into a position along the curves, so that each
// keyframe is reached exactly at its own "p".
function curveParam(p) {
  for (let i = 0; i < KEYS.length - 1; i++) {
    const a = KEYS[i].p;
    const b = KEYS[i + 1].p;
    if (p <= b) return (i + (p - a) / (b - a)) / (KEYS.length - 1);
  }
  return 1;
}

// Sky, fog and star brightness for each stretch of the journey.
const ATMOSPHERE = [
  { p: 0.0, top: "#050816", bottom: "#2a1630", fog: "#120d1c", near: 10, far: 34, stars: 1 }, // Tokyo night
  { p: 0.17, top: "#050816", bottom: "#2a1630", fog: "#120d1c", near: 10, far: 34, stars: 1 },
  { p: 0.22, top: "#0a1230", bottom: "#33285a", fog: "#171a33", near: 5, far: 24, stars: 0.7 }, // blue hour in the forest
  { p: 0.4, top: "#0a1230", bottom: "#33285a", fog: "#171a33", near: 5, far: 24, stars: 0.7 },
  { p: 0.46, top: "#3b4a86", bottom: "#ffc27a", fog: "#c49a78", near: 10, far: 40, stars: 0 }, // golden hour, Kyoto
  { p: 0.57, top: "#3b4a86", bottom: "#ffc27a", fog: "#c49a78", near: 10, far: 40, stars: 0 },
  { p: 0.63, top: "#1d2147", bottom: "#f2875a", fog: "#c9765a", near: 10, far: 36, stars: 0 }, // dusk, Himeji
  { p: 0.76, top: "#1d2147", bottom: "#f2875a", fog: "#c9765a", near: 10, far: 36, stars: 0 },
  { p: 0.84, top: "#5d73b8", bottom: "#ffc6b0", fog: "#e2bcbc", near: 45, far: 170, stars: 0 }, // dawn, Fuji
  { p: 1.0, top: "#5d73b8", bottom: "#ffc6b0", fog: "#e2bcbc", near: 45, far: 170, stars: 0 },
].map((s) => ({ ...s, top: new THREE.Color(s.top), bottom: new THREE.Color(s.bottom), fog: new THREE.Color(s.fog) }));

const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// Blend the two atmosphere stops around progress p.
function atmosphereAt(p, out) {
  let i = 0;
  while (i < ATMOSPHERE.length - 2 && p > ATMOSPHERE[i + 1].p) i++;
  const a = ATMOSPHERE[i];
  const b = ATMOSPHERE[i + 1];
  const t = smoothstep(a.p, b.p, p);
  out.top.copy(a.top).lerp(b.top, t);
  out.bottom.copy(a.bottom).lerp(b.bottom, t);
  out.fog.copy(a.fog).lerp(b.fog, t);
  out.near = a.near + (b.near - a.near) * t;
  out.far = a.far + (b.far - a.far) * t;
  out.stars = a.stars + (b.stars - a.stars) * t;
  return out;
}

// Gradient sky on the inside of a big sphere that follows the camera.
function Sky({ atmo }) {
  const ref = useRef();
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: { top: { value: new THREE.Color() }, bottom: { value: new THREE.Color() } },
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
  useFrame(({ camera }) => {
    ref.current.position.copy(camera.position);
    material.uniforms.top.value.copy(atmo.current.top);
    material.uniforms.bottom.value.copy(atmo.current.bottom);
  });
  return (
    <mesh ref={ref} material={material} renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[150, 32, 16]} />
    </mesh>
  );
}

function Stars({ atmo }) {
  const ref = useRef();
  const geometry = useMemo(() => {
    const pts = [];
    for (let i = 0; i < 900; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.9); // upper hemisphere only
      const r = 120;
      pts.push(r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);
  useFrame(({ camera }) => {
    ref.current.position.copy(camera.position);
    ref.current.material.opacity = 0.9 * atmo.current.stars;
    ref.current.visible = atmo.current.stars > 0.01;
  });
  return (
    <points ref={ref} geometry={geometry} frustumCulled={false}>
      <pointsMaterial color="#ffffff" size={0.35} sizeAttenuation transparent fog={false} depthWrite={false} />
    </points>
  );
}

// Points along the camera's flight, used to keep buildings out of its way.
const PATH_SAMPLES = CAMERA_PATH.getSpacedPoints(200);
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
    while (buildings.length < 420 && tries++ < 6000) {
      const r = 1.6 + Math.pow(Math.random(), 0.7) * 9;
      const a = Math.random() * Math.PI * 2;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      if (Math.abs(x) < 1.2 && z > 0 && z < 2.2) continue; // keep the tower's front clear
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

// The ground: one big flat shape with holes cut out for the pond and the lake.
function Ground() {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-40, -40);
    shape.lineTo(140, -40);
    shape.lineTo(140, 110);
    shape.lineTo(-40, 110);
    shape.closePath();
    // The shape is drawn flat and then laid down, so z becomes -y here.
    for (const [cx, cz, rx, rz] of [POND, LAKE]) {
      const hole = new THREE.Path();
      hole.absellipse(cx, -cz, rx, rz, 0, Math.PI * 2, true);
      shape.holes.push(hole);
    }
    return new THREE.ShapeGeometry(shape, 48);
  }, []);
  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]}>
      <meshStandardMaterial color="#0d0c14" roughness={1} />
    </mesh>
  );
}

// Water surface: semi-transparent, so the mirrored landmark below shows
// through like a reflection.
function Water({ ellipse, color }) {
  const [cx, cz, rx, rz] = ellipse;
  return (
    <mesh position={[cx, -0.02, cz]} rotation={[-Math.PI / 2, 0, 0]} scale={[rx, rz, 1]}>
      <circleGeometry args={[1, 64]} />
      <meshStandardMaterial color={color} transparent opacity={0.55} metalness={0.05} roughness={0.4} />
    </mesh>
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
    ref.current.children.forEach((m) => (m.material.opacity = 0.32 * (1 - rise.current * 0.6)));
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
  const atmo = useRef({ top: new THREE.Color(), bottom: new THREE.Color(), fog: new THREE.Color(), near: 10, far: 34, stars: 1 });
  const rise = useRef(0); // how far the castle has risen from the mist
  const castle = useRef();
  const fog = useRef();
  const pos = useMemo(() => new THREE.Vector3(), []);
  const target = useMemo(() => new THREE.Vector3(), []);

  // Wider field of view on narrow phone screens so the landmarks fit.
  const portrait = size.width < size.height;

  useFrame((state, delta) => {
    // Ease towards the real scroll position for a buttery camera.
    smooth.current = animate
      ? THREE.MathUtils.damp(smooth.current, progress.current, 4, Math.min(delta, 0.1))
      : progress.current;
    const p = smooth.current;

    atmosphereAt(p, atmo.current);
    rise.current = smoothstep(0.58, 0.66, p);

    const t = curveParam(p);
    CAMERA_PATH.getPoint(t, pos);
    (portrait ? FOCUS_PATH : TARGET_PATH).getPoint(t, target);
    // On phones the caption card covers the bottom of the screen, so tilt the
    // camera down a little: the landmark moves up into the clear top half.
    if (portrait && p > 0.42) target.y -= 0.2 * pos.distanceTo(target);
    // A gentle sway from the pointer adds depth (smaller inside the tunnel).
    const sway = p > 0.23 && p < 0.39 ? 0.06 : 0.25;
    pos.x += state.pointer.x * sway;
    pos.y += state.pointer.y * sway * 0.6;
    camera.position.copy(pos);
    camera.lookAt(target);
    const fov = portrait ? 62 : 45;
    if (camera.fov !== fov) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }

    castle.current.position.y = -1.6 * (1 - rise.current);
    fog.current.color.copy(atmo.current.fog);
    fog.current.near = atmo.current.near;
    fog.current.far = atmo.current.far;
  });

  return (
    <>
      <fog ref={fog} attach="fog" args={["#120d1c", 10, 34]} />
      <Sky atmo={atmo} />
      <Stars atmo={atmo} />

      <hemisphereLight args={["#8fa4ff", "#2a1620", 0.55]} />
      <directionalLight position={[10, 8, 6]} intensity={1.1} color="#ffd6b0" />

      <Ground />

      {/* 1. Tokyo Tower in a city at night */}
      <TokyoTower />
      <City />

      {/* 2. Fushimi Inari's tunnel of torii */}
      <ToriiTunnel position={INARI_POS.toArray()} />

      {/* 3. Kinkaku-ji and its reflection in the pond */}
      <GoldenPavilion position={KINKAKU_POS.toArray()} />
      <GoldenPavilion mirrored position={[KINKAKU_POS.x, -0.04, KINKAKU_POS.z]} scale={[1, -1, 1]} />
      <Water ellipse={POND} color="#0f1c26" />

      {/* 4. Himeji Castle rising out of the mist */}
      <group ref={castle} position={CASTLE_POS.toArray()}>
        <HimejiCastle />
      </group>
      <Mist position={CASTLE_POS.toArray()} rise={rise} />
      <Petals count={110} area={[11, 5, 8]} center={[CASTLE_POS.x, 2.2, CASTLE_POS.z + 1]} animate={animate} size={0.08} />

      {/* 5. Mount Fuji, mirrored in the lake */}
      <MountFuji position={FUJI_POS.toArray()} />
      <MountFuji mirrored position={[FUJI_POS.x, -0.04, FUJI_POS.z]} scale={[1, -1, 1]} />
      <Water ellipse={LAKE} color="#1f2d4d" />
      <directionalLight position={[110, 30, 10]} intensity={0.9} color="#ffd9c7" />

      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur luminanceThreshold={0.62} intensity={0.9} radius={0.65} />
      </EffectComposer>
    </>
  );
}
