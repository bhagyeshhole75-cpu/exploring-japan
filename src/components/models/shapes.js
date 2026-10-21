// Shared geometry helpers for Japanese buildings (castle, pavilion).
import * as THREE from "three";

// A sloped block between a big rectangle at the bottom and a smaller one on
// top, used for the stone base. Non-indexed, so every face is flat-shaded.
export function frustumGeometry(W, D, w, d, h) {
  const b = [
    [-W / 2, 0, -D / 2],
    [W / 2, 0, -D / 2],
    [W / 2, 0, D / 2],
    [-W / 2, 0, D / 2],
  ];
  const t = [
    [-w / 2, h, -d / 2],
    [w / 2, h, -d / 2],
    [w / 2, h, d / 2],
    [-w / 2, h, d / 2],
  ];
  const tri = [];
  const quad = (a, b2, c, e) => tri.push(a, b2, c, a, c, e);
  for (let i = 0; i < 4; i++) quad(b[i], b[(i + 1) % 4], t[(i + 1) % 4], t[i]);
  quad(t[3], t[2], t[1], t[0]); // top
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(tri.flat(), 3));
  geo.computeVertexNormals();
  return geo;
}

// A roof skirt whose eaves curve upwards at the corners, the signature shape
// of Japanese roofs. Each side is a strip of segments; the bottom edge lifts
// towards the corners.
export function roofGeometry(W, D, w, d, h, lift = 0.09) {
  const SEG = 10;
  const tri = [];
  const sides = [
    // [start corner, end corner] for bottom (B) and top (T) rectangles
    [[-W / 2, D / 2], [W / 2, D / 2], [-w / 2, d / 2], [w / 2, d / 2]],
    [[W / 2, D / 2], [W / 2, -D / 2], [w / 2, d / 2], [w / 2, -d / 2]],
    [[W / 2, -D / 2], [-W / 2, -D / 2], [w / 2, -d / 2], [-w / 2, -d / 2]],
    [[-W / 2, -D / 2], [-W / 2, D / 2], [-w / 2, -d / 2], [-w / 2, d / 2]],
  ];
  for (const [b0, b1, t0, t1] of sides) {
    for (let s = 0; s < SEG; s++) {
      const u0 = s / SEG;
      const u1 = (s + 1) / SEG;
      const bp = (u) => {
        const k = Math.abs(u * 2 - 1); // 0 in the middle, 1 at the corners
        return [b0[0] + (b1[0] - b0[0]) * u, lift * Math.pow(k, 3), b0[1] + (b1[1] - b0[1]) * u];
      };
      const tp = (u) => [t0[0] + (t1[0] - t0[0]) * u, h, t0[1] + (t1[1] - t0[1]) * u];
      const a = bp(u0), b2 = bp(u1), c = tp(u1), e = tp(u0);
      tri.push(a, b2, c, a, c, e);
      // underside, so the eaves aren't see-through from below
      tri.push(a, c, b2, a, e, c);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(tri.flat(), 3));
  geo.computeVertexNormals();
  return geo;
}
