// Small vermilion torii icon, drawn in SVG so it looks the same on every device.
export default function ToriiIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <g fill="#e5482c">
        <path d="M6 14c9 3.5 43 3.5 52 0l-1.4 7c-9 2.2-40 2.2-49.2 0z" />
        <rect x="11" y="26" width="42" height="4.5" rx="1" />
        <rect x="16" y="20" width="6" height="38" rx="1.5" />
        <rect x="42" y="20" width="6" height="38" rx="1.5" />
        <rect x="29.5" y="20" width="5" height="7" />
      </g>
    </svg>
  );
}
