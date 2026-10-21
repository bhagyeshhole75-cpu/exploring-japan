import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

// The Senbon Torii ("thousand gates") of Fushimi Inari Taisha in Kyoto: about
// 800 vermilion gates in a row form a tunnel up the mountain path. This model
// has 46 gates along a gently curving, rising path. Every gate shares the same
// few shapes, drawn with InstancedMesh, so the GPU draws all of them at once.

// The path in local coordinates. Exported so the camera can fly through it.
export const TUNNEL_PATH = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(2.5, 0.1, -1.3),
  new THREE.Vector3(5.0, 0.25, -2.5),
  new THREE.Vector3(7.4, 0.45, -4.3),
  new THREE.Vector3(9.3, 0.65, -6.8),
]);

const GATES = 46;

// A point just before the first gate, offset to the left (-1) or right (+1).
const ENTRANCE_SIDE = (s) => {
  const t = TUNNEL_PATH.getTangentAt(0);
  return [-t.x * 0.6 - t.z * 0.75 * s, 0, -t.z * 0.6 + t.x * 0.75 * s];
};
const HALF = 0.42; // half the gap between the two pillars
const VERMILION = "#e1401f";
const BLACK = "#1b1513";

// Curved black top beam, ends sweeping upwards (same idea as the hero torii).
function kasagiGeometry() {
  const geo = new THREE.BoxGeometry(1.2, 0.07, 0.13, 24, 1, 1);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    pos.setY(i, pos.getY(i) + Math.pow(Math.abs(x) / 0.6, 2.4) * 0.06);
  }
  geo.computeVertexNormals();
  return geo;
}

function useGateTransforms() {
  return useMemo(() => {
    const gates = [];
    for (let g = 0; g < GATES; g++) {
      const u = 0.03 + (g / (GATES - 1)) * 0.94;
      const p = TUNNEL_PATH.getPointAt(u);
      const t = TUNNEL_PATH.getTangentAt(u);
      const yaw = Math.atan2(t.x, t.z); // turn each gate to face along the path
      gates.push({ p, yaw });
    }
    return gates;
  }, []);
}

// Fills an InstancedMesh: one copy per gate (or per pillar), placed by `place`.
function useInstances(ref, gates, perGate, place) {
  useLayoutEffect(() => {
    const m = new THREE.Object3D();
    let i = 0;
    gates.forEach((g) => {
      for (let k = 0; k < perGate; k++) {
        m.position.copy(g.p);
        m.rotation.set(0, g.yaw, 0);
        m.scale.set(1, 1, 1);
        place(m, k);
        m.updateMatrix();
        ref.current.setMatrixAt(i++, m.matrix);
      }
    });
    ref.current.instanceMatrix.needsUpdate = true;
  }, [ref, gates, perGate, place]);
}

// Offset sideways from the path centre (left or right pillar).
const side = (m, k) => m.translateX(k === 0 ? -HALF : HALF);

export default function ToriiTunnel(props) {
  const gates = useGateTransforms();
  const pillars = useRef();
  const bases = useRef();
  const nuki = useRef();
  const shimaki = useRef();
  const kasagi = useRef();
  const kasagiGeo = useMemo(kasagiGeometry, []);

  useInstances(pillars, gates, 2, (m, k) => {
    side(m, k);
    m.translateY(0.5);
  });
  useInstances(bases, gates, 2, (m, k) => {
    side(m, k);
    m.translateY(0.05);
  });
  useInstances(nuki, gates, 1, (m) => m.translateY(0.76));
  useInstances(shimaki, gates, 1, (m) => m.translateY(0.95));
  useInstances(kasagi, gates, 1, (m) => m.translateY(1.02));

  // Cedar forest on both sides, kept clear of the path.
  const trees = useMemo(() => {
    const samples = TUNNEL_PATH.getSpacedPoints(60);
    const list = [];
    let tries = 0;
    while (list.length < 150 && tries++ < 4000) {
      const x = -3 + Math.random() * 15.5;
      const z = 3 - Math.random() * 13;
      const near = samples.some((s) => (s.x - x) ** 2 + (s.z - z) ** 2 < 1.1 ** 2);
      if (!near) list.push({ x, z, h: 1.4 + Math.random() * 1.8 });
    }
    return list;
  }, []);
  const forest = useRef();
  const coneGeo = useMemo(() => {
    const g = new THREE.ConeGeometry(0.32, 1, 7);
    g.translate(0, 0.5, 0);
    return g;
  }, []);
  useLayoutEffect(() => {
    const m = new THREE.Object3D();
    trees.forEach((t, i) => {
      m.position.set(t.x, 0, t.z);
      m.scale.set(1 + t.h * 0.15, t.h, 1 + t.h * 0.15);
      m.updateMatrix();
      forest.current.setMatrixAt(i, m.matrix);
    });
    forest.current.instanceMatrix.needsUpdate = true;
  }, [trees]);

  const lacquer = (
    <meshStandardMaterial color={VERMILION} emissive="#ff3a10" emissiveIntensity={0.18} roughness={0.4} />
  );

  return (
    <group {...props}>
      <instancedMesh ref={pillars} args={[null, null, GATES * 2]}>
        <cylinderGeometry args={[0.045, 0.05, 1.0, 10]} />
        {lacquer}
      </instancedMesh>
      <instancedMesh ref={bases} args={[null, null, GATES * 2]}>
        <cylinderGeometry args={[0.058, 0.06, 0.1, 10]} />
        <meshStandardMaterial color={BLACK} />
      </instancedMesh>
      <instancedMesh ref={nuki} args={[null, null, GATES]}>
        <boxGeometry args={[1.02, 0.06, 0.07]} />
        {lacquer}
      </instancedMesh>
      <instancedMesh ref={shimaki} args={[null, null, GATES]}>
        <boxGeometry args={[1.08, 0.06, 0.1]} />
        {lacquer}
      </instancedMesh>
      <instancedMesh ref={kasagi} args={[kasagiGeo, null, GATES]}>
        <meshStandardMaterial color={BLACK} roughness={0.5} />
      </instancedMesh>

      <instancedMesh ref={forest} args={[coneGeo, null, trees.length]}>
        <meshStandardMaterial color="#17291f" flatShading roughness={1} />
      </instancedMesh>

      {/* Stone lanterns (tōrō) on either side of the entrance */}
      {[-1, 1].map((s) => (
        <group key={s} position={ENTRANCE_SIDE(s)}>
          <mesh position={[0, 0.25, 0]}>
            <cylinderGeometry args={[0.05, 0.07, 0.5, 8]} />
            <meshStandardMaterial color="#77736c" />
          </mesh>
          <mesh position={[0, 0.56, 0]}>
            <boxGeometry args={[0.16, 0.13, 0.16]} />
            <meshStandardMaterial color="#ffd38a" emissive="#ffb347" emissiveIntensity={2.2} toneMapped={false} />
          </mesh>
          <mesh position={[0, 0.69, 0]}>
            <coneGeometry args={[0.16, 0.13, 4]} />
            <meshStandardMaterial color="#77736c" />
          </mesh>
        </group>
      ))}

      {/* Warm lantern light glowing through the tunnel */}
      {[0.1, 0.45, 0.8].map((u) => {
        const p = TUNNEL_PATH.getPointAt(u);
        return <pointLight key={u} position={[p.x, p.y + 0.85, p.z]} intensity={3.2} distance={4} decay={1.6} color="#ffb070" />;
      })}
    </group>
  );
}
