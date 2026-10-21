import { useMemo } from "react";
import * as THREE from "three";
import { frustumGeometry, roofGeometry } from "./shapes.js";

// A Japanese castle inspired by Himeji Castle ("White Heron Castle"), built
// from code: sloped stone base (ishigaki), white plastered tiers, dark tiled
// roofs with upturned eaves, triangular gables (chidori-hafu), and golden
// roof ornaments (shachihoko).

const WALL = "#f4f1ea";
const ROOF = "#3d434b";
const STONE = "#8d867b";
const GOLD = "#e8b54a";

// Triangular gable (chidori-hafu) sitting on a roof slope.
function useGableGeometry() {
  return useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-0.34, 0);
    s.lineTo(0.34, 0);
    s.lineTo(0, 0.3);
    s.closePath();
    const geo = new THREE.ExtrudeGeometry(s, { depth: 0.32, bevelEnabled: false });
    geo.translate(0, 0, -0.32);
    return geo;
  }, []);
}

function Windows({ w, d, y, count, size = [0.09, 0.11] }) {
  // Small dark windows on all four walls of a tier.
  const items = [];
  const along = (len, n) => Array.from({ length: n }, (_, i) => -len / 2 + (len / (n + 1)) * (i + 1));
  along(w, count).forEach((x) => {
    items.push({ p: [x, y, d / 2 + 0.002], r: 0 });
    items.push({ p: [x, y, -d / 2 - 0.002], r: Math.PI });
  });
  along(d, Math.max(2, count - 2)).forEach((z) => {
    items.push({ p: [w / 2 + 0.002, y, z], r: Math.PI / 2 });
    items.push({ p: [-w / 2 - 0.002, y, z], r: -Math.PI / 2 });
  });
  return items.map((it, i) => (
    <mesh key={i} position={it.p} rotation={[0, it.r, 0]}>
      <planeGeometry args={size} />
      <meshStandardMaterial color="#2a2a30" emissive="#ffb35c" emissiveIntensity={0.25} />
    </mesh>
  ));
}

// One keep (tenshu): stacked tiers, each with walls, windows and a roof.
function Keep({ tiers, gableTiers = [], ornamentScale = 1 }) {
  const gable = useGableGeometry();
  const parts = useMemo(() => {
    let y = 0;
    return tiers.map((t, i) => {
      const next = tiers[i + 1];
      const isTop = !next;
      const roof = isTop
        ? roofGeometry(t.w + 0.5, t.d + 0.5, t.w * 0.55, 0.03, 0.38, 0.11)
        : roofGeometry(t.w + 0.42, t.d + 0.42, next.w, next.d, 0.2);
      const part = { ...t, y, roof, isTop };
      y += t.h + (isTop ? 0 : 0.2);
      return part;
    });
  }, [tiers]);

  return (
    <group>
      {parts.map((t, i) => (
        <group key={i} position={[0, t.y, 0]}>
          {/* Plastered wall */}
          <mesh position={[0, t.h / 2, 0]}>
            <boxGeometry args={[t.w, t.h, t.d]} />
            <meshStandardMaterial color={WALL} roughness={0.85} />
          </mesh>
          <Windows w={t.w} d={t.d} y={t.h * 0.55} count={Math.max(2, Math.round(t.w / 0.3))} />
          {/* Roof */}
          <mesh geometry={t.roof} position={[0, t.h, 0]}>
            <meshStandardMaterial color={ROOF} roughness={0.55} metalness={0.15} side={THREE.DoubleSide} />
          </mesh>
          {/* Gables on the front and sides */}
          {gableTiers.includes(i) &&
            [0, Math.PI / 2, -Math.PI / 2].map((r) => {
              const dist = r === 0 ? t.d / 2 + 0.12 : t.w / 2 + 0.12;
              return (
                <group key={r} rotation={[0, r, 0]}>
                  <mesh geometry={gable} position={[0, t.h + 0.06, dist]}>
                    <meshStandardMaterial color={ROOF} roughness={0.55} />
                  </mesh>
                  <mesh position={[0, t.h + 0.14, dist + 0.005]}>
                    <circleGeometry args={[0.16, 3, Math.PI / 2]} />
                    <meshStandardMaterial color={WALL} />
                  </mesh>
                </group>
              );
            })}
          {/* Golden shachihoko on the ends of the top ridge */}
          {t.isTop &&
            [-1, 1].map((s) => (
              <mesh
                key={s}
                position={[s * t.w * 0.27, t.h + 0.44, 0]}
                rotation={[0, 0, s * 0.35]}
                scale={ornamentScale}
              >
                <coneGeometry args={[0.045, 0.16, 6]} />
                <meshStandardMaterial color={GOLD} metalness={0.8} roughness={0.25} emissive="#7a4a00" />
              </mesh>
            ))}
        </group>
      ))}
    </group>
  );
}

function SakuraTree({ position, scale = 1 }) {
  const blobs = useMemo(
    () =>
      Array.from({ length: 6 }, () => ({
        p: [(Math.random() - 0.5) * 0.6, 0.65 + Math.random() * 0.35, (Math.random() - 0.5) * 0.6],
        r: 0.2 + Math.random() * 0.18,
      })),
    []
  );
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.04, 0.07, 0.6, 6]} />
        <meshStandardMaterial color="#4a3128" />
      </mesh>
      {blobs.map((b, i) => (
        <mesh key={i} position={b.p}>
          <icosahedronGeometry args={[b.r, 1]} />
          <meshStandardMaterial color="#ffb7cb" emissive="#ff8fb0" emissiveIntensity={0.18} flatShading roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

const MAIN_TIERS = [
  { w: 2.3, d: 1.9, h: 0.46 },
  { w: 2.0, d: 1.65, h: 0.42 },
  { w: 1.7, d: 1.4, h: 0.4 },
  { w: 1.4, d: 1.15, h: 0.38 },
  { w: 1.1, d: 0.9, h: 0.42 },
];
const SMALL_TIERS = [
  { w: 1.2, d: 1.0, h: 0.34 },
  { w: 1.0, d: 0.82, h: 0.3 },
  { w: 0.8, d: 0.64, h: 0.32 },
];

const TREE_SPOTS = [
  [-3.3, 0, 1.6], [-2.6, 0, 2.6], [3.2, 0, 1.9], [2.4, 0, 2.9], [3.8, 0, -0.8],
  [-3.9, 0, -0.4], [0.9, 0, 3.4], [-1.2, 0, 3.5], [4.1, 0, 1.0], [-4.2, 0, 0.9],
];

export default function HimejiCastle(props) {
  const base = useMemo(() => frustumGeometry(3.6, 3.1, 2.6, 2.2, 0.85), []);
  const smallBase = useMemo(() => frustumGeometry(1.9, 1.7, 1.4, 1.2, 0.6), []);

  return (
    <group {...props}>
      {/* Stone base (ishigaki) */}
      <mesh geometry={base}>
        <meshStandardMaterial color={STONE} roughness={0.95} flatShading />
      </mesh>
      <group position={[0, 0.85, 0]}>
        <Keep tiers={MAIN_TIERS} gableTiers={[1, 3]} />
      </group>

      {/* Smaller second keep, joined by a roofed wall */}
      <group position={[-2.35, 0, -1.25]}>
        <mesh geometry={smallBase}>
          <meshStandardMaterial color={STONE} roughness={0.95} flatShading />
        </mesh>
        <group position={[0, 0.6, 0]}>
          <Keep tiers={SMALL_TIERS} gableTiers={[0]} ornamentScale={0.8} />
        </group>
      </group>
      <mesh position={[-1.45, 0.62, -0.95]} rotation={[0, 0.35, 0]}>
        <boxGeometry args={[1.2, 0.26, 0.24]} />
        <meshStandardMaterial color={WALL} roughness={0.85} />
      </mesh>
      <mesh position={[-1.45, 0.79, -0.95]} rotation={[0, 0.35, 0]}>
        <boxGeometry args={[1.3, 0.08, 0.36]} />
        <meshStandardMaterial color={ROOF} />
      </mesh>

      {/* Outer walls along the front */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 2.6, 0, 1.9]} rotation={[0, s * -0.5, 0]}>
          <mesh position={[0, 0.16, 0]}>
            <boxGeometry args={[1.6, 0.32, 0.14]} />
            <meshStandardMaterial color={WALL} roughness={0.85} />
          </mesh>
          <mesh position={[0, 0.35, 0]}>
            <boxGeometry args={[1.7, 0.06, 0.26]} />
            <meshStandardMaterial color={ROOF} />
          </mesh>
        </group>
      ))}

      {TREE_SPOTS.map((p, i) => (
        <SakuraTree key={i} position={p} scale={0.85 + (i % 3) * 0.12} />
      ))}

      {/* Floodlights, as the real castle is lit up in the evening */}
      <pointLight position={[-0.4, 1.6, 3.6]} intensity={11} distance={10} decay={1.4} color="#fff1dc" />
    </group>
  );
}
