import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Tokyo Tower, built from code. Real tower: 332.9 m tall, Main Deck at 150 m,
// Top Deck at 249.6 m, painted in bands of white and international orange.
// Scale: 1 unit ≈ 55 m, so the tower is about 6 units tall.
const M = 1 / 55.5; // metres -> scene units
const LATTICE_TOP = 255 * M; // where the steel lattice ends and the antenna begins
const MAIN_DECK = 150 * M;
const TOP_DECK = 249.6 * M;
const HEIGHT = 332.9 * M;

const ORANGE = new THREE.Color("#ff5a1f");
const WHITE = new THREE.Color("#fff3e6");

// Half-width of the tower at height y: wide at the base, curving inwards like
// the Eiffel Tower that inspired it.
function halfWidth(y) {
  const t = Math.min(1, y / (LATTICE_TOP * 1.04));
  return 0.05 + 0.72 * Math.pow(1 - t, 1.9);
}

// Alternating paint bands from the ground up.
function bandColor(y) {
  return Math.floor((y / LATTICE_TOP) * 11) % 2 === 0 ? ORANGE : WHITE;
}

const CORNERS = [
  [1, 1],
  [1, -1],
  [-1, -1],
  [-1, 1],
];

function useTowerGeometry() {
  return useMemo(() => {
    // 1. The four legs: tubes that follow the curved profile.
    const legs = CORNERS.map(([sx, sz]) => {
      const pts = [];
      for (let i = 0; i <= 40; i++) {
        const y = (i / 40) * LATTICE_TOP;
        const w = halfWidth(y);
        pts.push(new THREE.Vector3(sx * w, y, sz * w));
      }
      const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, 0.03, 6, false);
      const colors = [];
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) colors.push(...bandColor(pos.getY(i)).toArray());
      geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
      return geo;
    });

    // 2. The lattice: horizontal square rings plus X-bracing on every face.
    const positions = [];
    const colors = [];
    const push = (a, b) => {
      positions.push(...a, ...b);
      const c = bandColor((a[1] + b[1]) / 2);
      colors.push(...c.toArray(), ...c.toArray());
    };
    const levels = 34;
    for (let l = 0; l < levels; l++) {
      const y0 = (l / levels) * LATTICE_TOP;
      const y1 = ((l + 1) / levels) * LATTICE_TOP;
      const w0 = halfWidth(y0);
      const w1 = halfWidth(y1);
      for (let c = 0; c < 4; c++) {
        const [ax, az] = CORNERS[c];
        const [bx, bz] = CORNERS[(c + 1) % 4];
        const a0 = [ax * w0, y0, az * w0];
        const b0 = [bx * w0, y0, bz * w0];
        const a1 = [ax * w1, y1, az * w1];
        const b1 = [bx * w1, y1, bz * w1];
        push(a0, b0); // ring
        push(a0, b1); // cross brace
        push(b0, a1); // cross brace
      }
    }
    const lattice = new THREE.BufferGeometry();
    lattice.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    lattice.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

    return { legs, lattice };
  }, []);
}

export default function TokyoTower(props) {
  const { legs, lattice } = useTowerGeometry();
  const beacon = useRef();

  // Blink the red aviation light on top.
  useFrame(({ clock }) => {
    if (beacon.current) beacon.current.material.emissiveIntensity = Math.sin(clock.elapsedTime * 3) > 0 ? 6 : 0.4;
  });

  const deckW = halfWidth(MAIN_DECK);
  const topW = halfWidth(TOP_DECK);

  return (
    <group {...props}>
      {/* Legs and lattice glow like the tower's night lighting */}
      {legs.map((geo, i) => (
        <mesh key={i} geometry={geo}>
          <meshStandardMaterial vertexColors emissive="#ff7a33" emissiveIntensity={0.35} roughness={0.5} />
        </mesh>
      ))}
      <lineSegments geometry={lattice}>
        <lineBasicMaterial vertexColors toneMapped={false} transparent opacity={0.95} />
      </lineSegments>

      {/* Main Deck (150 m): two storeys with glowing windows */}
      <group position={[0, MAIN_DECK, 0]}>
        <mesh>
          <cylinderGeometry args={[deckW + 0.16, deckW + 0.12, 0.2, 8]} />
          <meshStandardMaterial color="#1c1a22" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.02, 0]}>
          <cylinderGeometry args={[deckW + 0.165, deckW + 0.165, 0.09, 8, 1, true]} />
          <meshBasicMaterial color="#ffd9a0" toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.13, 0]}>
          <cylinderGeometry args={[deckW + 0.1, deckW + 0.14, 0.07, 8]} />
          <meshStandardMaterial color="#e9e3da" />
        </mesh>
      </group>

      {/* Top Deck (249.6 m) */}
      <group position={[0, TOP_DECK, 0]}>
        <mesh>
          <cylinderGeometry args={[topW + 0.07, topW + 0.05, 0.1, 8]} />
          <meshStandardMaterial color="#1c1a22" />
        </mesh>
        <mesh>
          <cylinderGeometry args={[topW + 0.075, topW + 0.075, 0.045, 8, 1, true]} />
          <meshBasicMaterial color="#cfe8ff" toneMapped={false} />
        </mesh>
      </group>

      {/* Antenna: thin banded spire up to 332.9 m */}
      {Array.from({ length: 6 }, (_, i) => {
        const h = (HEIGHT - LATTICE_TOP) / 6;
        const r = 0.035 - i * 0.004;
        return (
          <mesh key={i} position={[0, LATTICE_TOP + h * (i + 0.5), 0]}>
            <cylinderGeometry args={[r - 0.004, r, h, 8]} />
            <meshBasicMaterial color={i % 2 === 0 ? ORANGE : WHITE} toneMapped={false} />
          </mesh>
        );
      })}
      <mesh ref={beacon} position={[0, HEIGHT + 0.03, 0]}>
        <sphereGeometry args={[0.035, 12, 12]} />
        <meshStandardMaterial color="#ff2020" emissive="#ff1a1a" emissiveIntensity={4} toneMapped={false} />
      </mesh>

      {/* FootTown: the base building with shops and restaurants */}
      <mesh position={[0, 0.17, 0.95]}>
        <boxGeometry args={[1.7, 0.34, 0.7]} />
        <meshStandardMaterial color="#26222c" roughness={0.8} />
      </mesh>
      {[0.09, 0.23].map((y) => (
        <mesh key={y} position={[0, y, 1.301]}>
          <planeGeometry args={[1.55, 0.05]} />
          <meshBasicMaterial color="#ffcf8a" toneMapped={false} />
        </mesh>
      ))}

      {/* Warm light the tower casts on the city around it */}
      <pointLight position={[0, 1.6, 0]} color="#ff7a33" intensity={6} distance={7} decay={1.5} />
    </group>
  );
}

export const TOWER_HEIGHT = HEIGHT;
