import { useEffect, useState } from "react";
import ToriiIcon from "./ToriiIcon.jsx";

const LINKS = [
  { href: "#shops", label: "Shops" },
  { href: "#tips", label: "Tips" },
  { href: "#faq", label: "FAQ" },
  { href: "#cloud", label: "Cloud" },
];

// Floating pill navigation. It turns dark once you scroll past the cream hero.
export default function Nav() {
  const [dark, setDark] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const zone = document.querySelector(".dark-zone");
    const onScroll = () => setDark(zone && zone.getBoundingClientRect().top < 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`nav ${dark ? "nav-dark" : ""} ${open ? "nav-open" : ""}`}>
      <div className="nav-bar">
        <a className="brand" href="#top" onClick={() => setOpen(false)}>
          <span className="brand-mark">
            <ToriiIcon />
          </span>
          <span>
            Exploring Japan <em>探検</em>
          </span>
        </a>
        <nav className="nav-links">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>
        <button className="menu" aria-label="Menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          <i />
          <i />
        </button>
      </div>
      {open && (
        <nav className="nav-sheet">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}>
              {l.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
