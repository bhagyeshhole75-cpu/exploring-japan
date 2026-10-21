import { useEffect, useState } from "react";
import ToriiIcon from "./ToriiIcon.jsx";

const TIPS = [
  {
    jp: "免税",
    title: "Tax-free for visitors",
    text: "Registered shops offer tax-free shopping to short-term visitors. Carry your passport, and check the current rules before your trip.",
  },
  {
    jp: "IC",
    title: "Tap to pay",
    text: "IC cards like Suica and PASMO work on trains, at convenience stores and in many shops. Top up once and tap everywhere.",
  },
  {
    jp: "現金",
    title: "Keep some cash",
    text: "Cards work in most city stores, but small market stalls and older family shops may only take cash.",
  },
  {
    jp: "デパ地下",
    title: "Go underground",
    text: "Department store basements (depachika) are huge food halls full of sweets, bentō and beautifully wrapped gifts.",
  },
  {
    jp: "お土産",
    title: "Omiyage culture",
    text: "Japanese travellers bring back souvenir gifts for friends and co-workers, often individually wrapped local sweets.",
  },
  {
    jp: "トレー",
    title: "Use the little tray",
    text: "At the counter, place your cash or card in the small tray instead of handing it over. No tipping needed.",
  },
];

export function Tips() {
  return (
    <section className="section" id="tips">
      <header className="section-head center">
        <p className="label">§03 / Shop like a local</p>
        <h2>
          Every little
          <br />
          finishing touch.
        </h2>
      </header>
      <div className="tips">
        {TIPS.map((t) => (
          <article className="tip-card" key={t.title}>
            <span className="tip-jp" lang="ja">
              {t.jp}
            </span>
            <h3>{t.title}</h3>
            <p>{t.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

const FAQ = [
  {
    q: "What's the best time of day to go shopping?",
    a: "Food markets like Tsukiji and Nishiki are best in the morning. Department stores and shopping streets get going from late morning, and Don Quijote is great late at night.",
  },
  {
    q: "Do I need cash in Japan?",
    a: "Cards and IC cards are widely accepted in big cities, but keep some yen for small stalls, older shops and temple stands.",
  },
  {
    q: "Can I bargain on prices?",
    a: "Generally no. Prices in Japanese shops are fixed, and haggling isn't part of the shopping culture.",
  },
  {
    q: "What should I bring back as omiyage?",
    a: "Boxed regional sweets are the classic choice. Itoya paper, Kappabashi chopsticks or a small music box from Otaru also make great gifts.",
  },
  {
    q: "Are these photos real?",
    a: "Yes. Every photo is a real picture of the shop, taken from Wikimedia Commons under a free licence. The photographers are credited at the bottom of the page and in each shop's details.",
  },
  {
    q: "How was this website built?",
    a: "The interface is React, the 3D torii gate is three.js running on your GPU, and the shop data comes from a Node.js API running as a serverless function on Vercel in Mumbai.",
  },
];

export function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section className="section narrow" id="faq">
      <header className="section-head center">
        <p className="label">§04 / Honest answers</p>
        <h2>
          Everything you
          <br />
          need to know.
        </h2>
      </header>
      <div className="faq">
        {FAQ.map((item, i) => (
          <div className={`faq-item ${open === i ? "open" : ""}`} key={item.q}>
            <button onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}>
              <span>{item.q}</span>
              <i aria-hidden>+</i>
            </button>
            <div className="faq-answer">
              <p>{item.a}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function CloudStatus({ shopCount }) {
  const [state, setState] = useState({ status: "idle" });

  async function ping() {
    setState({ status: "loading" });
    const start = performance.now();
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setState({ status: "ok", data, ms: Math.round(performance.now() - start) });
    } catch (err) {
      setState({ status: "error", message: err.message });
    }
  }

  useEffect(() => {
    ping();
  }, []);

  const { status, data, ms } = state;
  const rows = [
    ["Endpoints", "GET /api/shops · /api/health"],
    ["Shops served", String(shopCount)],
    ["Runtime", data?.runtime],
    ["Region", data?.region],
    ["Platform", data?.platform],
    ["Time in Tokyo", data?.tokyoTime],
    ["Round trip", ms != null ? `${ms} ms` : null],
  ];

  return (
    <section className="section" id="cloud">
      <div className="cloud-grid">
        <header className="section-head">
          <p className="label">§05 / Live from the cloud</p>
          <h2>
            A real server
            <br />
            answered you.
          </h2>
          <p className="section-sub">
            The shop list on this page comes from <code>/api/shops</code>, a Node.js function running in a
            Vercel data centre in Mumbai (AWS ap-south-1). This panel pings it live.
          </p>
        </header>

        <div className="status">
          <div className="status-head">
            <span className={`dot dot-${status}`} />
            <strong>
              {status === "ok" ? "Online" : status === "loading" ? "Pinging…" : status === "error" ? "Unreachable" : "Idle"}
            </strong>
            <button className="btn btn-ghost btn-sm" onClick={ping} disabled={status === "loading"}>
              Ping again
            </button>
          </div>
          <dl>
            {rows.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v ?? "—"}</dd>
              </div>
            ))}
          </dl>
          {status === "error" && <p className="status-error">Could not reach the API ({state.message}).</p>}
        </div>
      </div>
    </section>
  );
}

export function Footer({ shops }) {
  return (
    <footer className="footer">
      <p className="footer-big">
        <span lang="ja">探検</span> Exploring Japan
      </p>
      <div className="footer-grid">
        <div>
          <p>
            Built by <strong>Bhagyesh Hole</strong>, first-year Computer Science, VIT Pune.
            <br />
            React · three.js · Node.js · Vercel
          </p>
          <p className="footer-small">
            Shop facts checked against Wikipedia. Opening hours and rules change, so check before you go.
          </p>
        </div>
        <div>
          <h4>Photo credits</h4>
          <ul className="credits">
            {shops.map((s) =>
              s.photo.credit ? (
                <li key={s.id}>
                  {s.name}:{" "}
                  <a href={s.photo.credit.source} target="_blank" rel="noreferrer">
                    {s.photo.credit.author || "Wikimedia Commons"}
                  </a>
                  ,{" "}
                  {s.photo.credit.licenseUrl ? (
                    <a href={s.photo.credit.licenseUrl} target="_blank" rel="noreferrer">
                      {s.photo.credit.license}
                    </a>
                  ) : (
                    s.photo.credit.license
                  )}
                </li>
              ) : null
            )}
          </ul>
        </div>
      </div>
    </footer>
  );
}

export function FloatingBar() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 0.9);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className={`floating-bar ${show ? "show" : ""}`} aria-hidden={!show}>
      <span className="bar-brand">
        <ToriiIcon size={18} /> Exploring Japan
      </span>
      <a className="btn btn-light btn-sm" href="#shops" tabIndex={show ? 0 : -1}>
        Shops →
      </a>
    </div>
  );
}
