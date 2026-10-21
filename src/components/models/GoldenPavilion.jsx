import { useMemo } from "react";
import * as THREE from "three";
import { roofGeometry } from "./shapes.js";

// Kinkaku-ji, the Golden Pavilion in Kyoto, built from code. On the real
// building the top two floors are coated in gold leaf, while the ground floor
// is natural wood and white plaster. It stands at the edge of a mirror pond.

const GOLD = { color: "#f4c34f", metalness: 0.55, roughness: 0.28, emissive: "#9a6400", emissiveIntensity: 0.6 };
const SHINGLE = "#3b2b23";
const WOOD = "#5a3f2c";

function Gold(props) {
  return <meshStandardMaterial {...GOLD} {...props} />;
}

// Golden phoenix (hōō) on the very top, simplified to a body, tail and wings.
function Phoenix(props) {
  return (
    <group {...props}>
      <mesh scale={[0.05, 0.05, 0.08]}>
        <sphereGeometry args={[1, 12, 10]} />
        <Gold />
      </mesh>
      <mesh position={[0, 0.03, -0.1]} rotation={[-0.9, 0, 0]}>
        <coneGeometry args={[0.03, 0.16, 6]} />
        <Gold />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.07, 0.05, 0]} rotation={[0, 0, s * 0.6]}>
          <boxGeometry args={[0.12, 0.01, 0.07]} />
          <Gold />
        </mesh>
      ))}
    </group>
  );
}

function Pine({ position, scale = 1 }) {
  const blobs = useMemo(
    () =>
      Array.from({ length: 4 }, (_, i) => ({
        p: [(Math.random() - 0.5) * 0.5, 0.55 + i * 0.18, (Math.random() - 0.5) * 0.5],
        s: [0.4 - i * 0.05, 0.14, 0.32 - i * 0.04],
      })),
    []
  );
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.35, 0]} rotation={[0, 0, 0.12]}>
        <cylinderGeometry args={[0.04, 0.07, 0.75, 6]} />
        <meshStandardMaterial color="#3d2a20" />
      </mesh>
      {blobs.map((b, i) => (
        <mesh key={i} position={b.p} scale={b.s}>
          <icosahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color="#1f4030" flatShading roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

const PINES = [
  [-2.6, 0, -1.6], [-1.6, 0, -2.4], [0.2, 0, -2.6], [1.9, 0, -2.2], [2.9, 0, -1.2],
  [-3.4, 0, -0.2], [3.6, 0, 0.2], [-0.9, 0, -3.1], [1.1, 0, -3.2],
];

export default function GoldenPavilion({ mirrored = false, ...props }) {
  const roofs = useMemo(
    () => ({
      first: roofGeometry(2.9, 2.35, 2.0, 1.5, 0.18, 0.1),
      second: roofGeometry(2.7, 2.15, 1.15, 1.15, 0.2, 0.11),
      top: roofGeometry(1.8, 1.8, 0.06, 0.06, 0.52, 0.12),
    }),
    []
  );

  return (
    <group {...props}>
      {/* Stone platform at the water's edge */}
      <mesh position={[0, 0.06, 0]}>
        <boxGeometry args={[2.8, 0.12, 2.2]} />
        <meshStandardMaterial color="#6f6a63" roughness={0.95} />
      </mesh>

      {/* Ground floor: natural wood and white plaster */}
      <group position={[0, 0.12, 0]}>
        <mesh position={[0, 0.03, 0]}>
          <boxGeometry args={[2.4, 0.06, 1.9]} />
          <meshStandardMaterial color={WOOD} />
        </mesh>
        <mesh position={[0, 0.28, 0]}>
          <boxGeometry args={[2.1, 0.5, 1.6]} />
          <meshStandardMaterial color="#e8dfcf" roughness={0.9} />
        </mesh>
        {/* Wooden posts along the front and back */}
        {[-1, -0.6, -0.2, 0.2, 0.6, 1].map((x) =>
          [0.81, -0.81].map((z) => (
            <mesh key={`${x}${z}`} position={[x, 0.28, z]}>
              <boxGeometry args={[0.05, 0.5, 0.03]} />
              <meshStandardMaterial color={WOOD} />
            </mesh>
          ))
        )}
        <mesh geometry={roofs.first} position={[0, 0.53, 0]}>
          <meshStandardMaterial color={SHINGLE} roughness={0.7} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Second floor: gold leaf, with a balcony rail */}
      <group position={[0, 0.83, 0]}>
        <mesh position={[0, 0.23, 0]}>
          <boxGeometry args={[2.0, 0.46, 1.5]} />
          <Gold />
        </mesh>
        <mesh position={[0, 0.06, 0]}>
          <boxGeometry args={[2.2, 0.04, 1.7]} />
          <Gold />
        </mesh>
        <mesh geometry={roofs.second} position={[0, 0.46, 0]}>
          <meshStandardMaterial color={SHINGLE} roughness={0.7} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Top floor: gold leaf, crowned by the phoenix */}
      <group position={[0, 1.49, 0]}>
        <mesh position={[0, 0.21, 0]}>
          <boxGeometry args={[1.15, 0.42, 1.15]} />
          <Gold />
        </mesh>
        <mesh geometry={roofs.top} position={[0, 0.42, 0]}>
          <meshStandardMaterial color={SHINGLE} roughness={0.7} side={THREE.DoubleSide} />
        </mesh>
        <Phoenix position={[0, 1.0, 0]} />
      </group>

      {!mirrored && (
        <>
          {PINES.map((p, i) => (
            <Pine key={i} position={p} scale={0.9 + (i % 3) * 0.15} />
          ))}
          {/* Rocks in the pond */}
          {[
            [-1.8, 0, 2.2, 0.3],
            [2.3, 0, 2.8, 0.22],
            [0.9, 0, 3.6, 0.16],
          ].map(([x, y, z, s], i) => (
            <mesh key={i} position={[x, y, z]} scale={[s * 1.6, s, s * 1.2]}>
              <dodecahedronGeometry args={[1, 0]} />
              <meshStandardMaterial color="#5c5a55" flatShading />
            </mesh>
          ))}
        </>
      )}
    </group>
  );
}
