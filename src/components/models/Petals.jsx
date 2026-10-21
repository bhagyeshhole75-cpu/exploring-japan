import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Falling sakura petals. One InstancedMesh draws every petal in a single GPU
// draw call, so hundreds of petals stay cheap.
export default function Petals({ count = 140, area = [9, 6, 4], center = [0, 0, 0.5], animate = true, size = 0.09 }) {
  const ref = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const [W, H, D] = area;

  const geometry = useMemo(() => {
    // A petal: rounded shape with a small notch at the tip.
    const s = new THREE.Shape();
    s.moveTo(0, -0.5);
    s.bezierCurveTo(0.45, -0.25, 0.42, 0.35, 0.12, 0.5);
    s.lineTo(0, 0.38);
    s.lineTo(-0.12, 0.5);
    s.bezierCurveTo(-0.42, 0.35, -0.45, -0.25, 0, -0.5);
    const g = new THREE.ShapeGeometry(s, 12);
    g.scale(size, size, size);
    return g;
  }, [size]);

  const petals = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        x: (Math.random() - 0.5) * W,
        y: Math.random() * H - H / 2,
        z: (Math.random() - 0.5) * D,
        speed: 0.25 + Math.random() * 0.35,
        sway: 0.4 + Math.random() * 0.8,
        phase: Math.random() * Math.PI * 2,
        spin: 0.5 + Math.random() * 1.5,
        scale: 0.6 + Math.random() * 0.8,
      })),
    [count, W, H, D]
  );

  useFrame((state, delta) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    petals.forEach((p, i) => {
      if (animate) {
        p.y -= p.speed * Math.min(delta, 0.05);
        if (p.y < -H / 2) {
          p.y = H / 2;
          p.x = (Math.random() - 0.5) * W;
        }
      }
      dummy.position.set(center[0] + p.x + Math.sin(t * p.sway + p.phase) * 0.35, center[1] + p.y, center[2] + p.z);
      dummy.rotation.set(t * p.spin * 0.6 + p.phase, t * p.spin + p.phase, Math.sin(t + p.phase) * 0.6);
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[geometry, null, count]} frustumCulled={false}>
      <meshStandardMaterial color="#ffc4d2" emissive="#ff8fae" emissiveIntensity={0.35} side={THREE.DoubleSide} roughness={0.6} />
    </instancedMesh>
  );
}
