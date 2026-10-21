import { useMemo } from "react";
import * as THREE from "three";

// Mount Fuji, built from code. Real mountain: 3,776 m, famous for its very
// symmetrical cone, snow-capped for about five months a year.
//
// The shape is a "lathe": a 2D side profile (radius vs height) spun around the
// vertical axis. The profile curves inwards (concave), which gives Fuji its
// classic sweeping slopes, and ends in a flat crater rim.
const H = 8; // height in scene units (stylised: steeper than the real slope)
const R = 15; // base radius

const SNOW = new THREE.Color("#f6f3ff");
const ROCK = new THREE.Color("#4b4f72");
const FOREST = new THREE.Color("#25333a");

function useFujiGeometry() {
  return useMemo(() => {
    // 1. Side profile, from the crater floor out to the base.
    const profile = [new THREE.Vector2(0, H - 0.35), new THREE.Vector2(0.85, H - 0.22), new THREE.Vector2(1.15, H)];
    for (let i = 1; i <= 48; i++) {
      const t = i / 48;
      profile.push(new THREE.Vector2(1.15 + (R - 1.15) * t, H * Math.pow(1 - t, 1.75)));
    }
    profile.push(new THREE.Vector2(R + 0.6, -0.05));

    const geo = new THREE.LatheGeometry(profile, 160);
    const pos = geo.attributes.position;
    const colors = [];

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const a = Math.atan2(z, x);
      const r = Math.hypot(x, z);

      // 2. Carve gullies: small waves around the mountain, strongest mid-slope,
      //    fading out at the crater rim so the top stays perfectly round.
      const ridge = Math.sin(a * 23) * 0.5 + Math.sin(a * 41 + 1.3) * 0.3 + Math.sin(a * 9 + 0.7) * 0.4;
      const fade = Math.min(1, Math.max(0, (H - y) / 1.5)) * (r > 1.2 ? 1 : 0);
      const dr = ridge * 0.16 * fade;
      if (r > 0.001) {
        pos.setX(i, x + (x / r) * dr);
        pos.setZ(i, z + (z / r) * dr);
      }

      // 3. Paint: snow above a jagged snowline that streaks down the gullies,
      //    blue-grey rock below, dark forest at the foot.
      const streak = Math.max(0, Math.sin(a * 23) - 0.35) * 1.4;
      const snowLine = H * 0.6 + Math.sin(a * 13) * 0.35 + Math.sin(a * 29 + 2) * 0.2 - streak;
      const c = new THREE.Color();
      if (y > snowLine) c.copy(SNOW);
      else if (y > snowLine - 0.35) c.copy(ROCK).lerp(SNOW, (y - (snowLine - 0.35)) / 0.35);
      else if (y > 1.6) c.copy(ROCK);
      else c.copy(FOREST).lerp(ROCK, y / 1.6);
      colors.push(c.r, c.g, c.b);
    }
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, []);
}

// Soft cloud texture shared by the cloud sprites.
let cloudTexture;
function getCloudTexture() {
  if (cloudTexture) return cloudTexture;
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 128;
  const ctx = c.getContext("2d");
  for (let i = 0; i < 14; i++) {
    const x = 40 + Math.random() * 176;
    const y = 50 + Math.random() * 30;
    const r = 20 + Math.random() * 30;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(255,255,255,0.55)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 128);
  }
  cloudTexture = new THREE.CanvasTexture(c);
  return cloudTexture;
}

const CLOUDS = [
  [-9, 3.2, 6, 9],
  [8, 2.6, 7, 10],
  [-3, 4.4, 9, 7],
  [11, 4.0, -2, 8],
  [-12, 2.2, -1, 9],
];

export default function MountFuji({ mirrored = false, ...props }) {
  const geometry = useFujiGeometry();
  const map = useMemo(getCloudTexture, []);

  return (
    <group {...props}>
      <mesh geometry={geometry}>
        <meshStandardMaterial vertexColors roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      {!mirrored &&
        CLOUDS.map(([x, y, z, s], i) => (
          <sprite key={i} position={[x, y, z]} scale={[s, s * 0.35, 1]}>
            <spriteMaterial map={map} color="#ffe9e6" transparent opacity={0.75} depthWrite={false} />
          </sprite>
        ))}
    </group>
  );
}

export const FUJI_HEIGHT = H;
