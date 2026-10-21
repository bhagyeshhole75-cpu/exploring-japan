import { useEffect, useState } from "react";
import { scrollToTarget } from "../lib/smooth.js";

// Floating pill showing which chapter you're in (like Shopify Editions), with
// an "01 / 06" counter (like ivress). Tap it to jump to any chapter.
export default function ChapterPill() {
  const [chapters, setChapters] = useState([]);
  const [current, setCurrent] = useState(0);
  const [show, setShow] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const sections = [...document.querySelectorAll("[data-chapter]")];
    setChapters(sections.map((s) => ({ id: s.id, name: s.dataset.chapter })));

    // The chapter crossing the middle of the screen is the current one.
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setCurrent(sections.indexOf(e.target));
        });
      },
      { rootMargin: "-50% 0px -50% 0px" }
    );
    sections.forEach((s) => observer.observe(s));

    const onScroll = () => setShow(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const pad = (n) => String(n).padStart(2, "0");
  const go = (id) => {
    setOpen(false);
    scrollToTarget(`#${id}`);
  };

  return (
    <div className={`chapter-pill ${show ? "show" : ""} ${open ? "open" : ""}`} aria-hidden={!show}>
      {open && (
        <ol className="chapter-menu">
          {chapters.map((c, i) => (
            <li key={c.id}>
              <button className={i === current ? "active" : ""} onClick={() => go(c.id)}>
                <span>{pad(i + 1)}</span>
                {c.name}
              </button>
            </li>
          ))}
        </ol>
      )}
      <button className="pill-main" onClick={() => setOpen((o) => !o)} aria-expanded={open} tabIndex={show ? 0 : -1}>
        <span className="pill-count">
          {pad(current + 1)}
          <i>/</i>
          {pad(chapters.length || 1)}
        </span>
        <span className="pill-name" key={current}>
          {chapters[current]?.name}
        </span>
        <span className="pill-burger" aria-hidden="true">
          <i />
          <i />
        </span>
      </button>
    </div>
  );
}
