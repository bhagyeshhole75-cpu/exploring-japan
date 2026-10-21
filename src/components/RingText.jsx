// A ring of letters spinning in 3D around the torii (like the curved
// "Everywhere" ring on Shopify Editions). Pure CSS 3D transforms: each letter
// is rotated around the Y axis and pushed outwards.
const TEXT = "EXPLORING JAPAN · 日本を探検 · ";

export default function RingText() {
  const chars = [...TEXT.repeat(2)];
  return (
    <div className="ring" aria-hidden="true">
      <div className="ring-tilt">
        <div className="ring-spin">
          {chars.map((c, i) => (
            <span key={i} style={{ "--a": `${(i * 360) / chars.length}deg` }}>
              {c}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
