import { useEffect, useState } from "react";
import SplitText from "./SplitText.jsx";
import Reveal from "./Reveal.jsx";

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
    <section className="section" id="tips" data-chapter="Tips">
      <header className="section-head center">
        <Reveal as="p" className="label">
          §04 / Shop like a local
        </Reveal>
        <SplitText text={"Every little\nfinishing touch."} />
      </header>
      <Reveal className="tips">
        {TIPS.map((t, i) => (
          <article className="tip-card stagger" style={{ "--i": i }} key={t.title}>
            <span className="tip-jp" lang="ja">
              {t.jp}
            </span>
            <h3>{t.title}</h3>
            <p>{t.text}</p>
          </article>
        ))}
      </Reveal>
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
    a: "The interface is React, with Lenis for smooth scrolling. The 3D torii, Tokyo Tower and castle are three.js models built from code and running on your GPU. The shop data comes from a Node.js API running as a serverless function on Vercel in Mumbai.",
  },
];

export function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section className="section narrow" id="faq" data-chapter="FAQ">
      <header className="section-head center">
        <Reveal as="p" className="label">
          §05 / Honest answers
        </Reveal>
        <SplitText text={"Everything you\nneed to know."} />
      </header>
      <Reveal className="faq">
        {FAQ.map((item, i) => (
          <div className={`faq-item stagger ${open === i ? "open" : ""}`} style={{ "--i": i }} key={item.q}>
            <button onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}>
              <span>{item.q}</span>
              <i aria-hidden>+</i>
            </button>
            <div className="faq-answer">
              <p>{item.a}</p>
            </div>
          </div>
        ))}
      </Reveal>
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
    <section className="section" id="cloud" data-chapter="Cloud">
      <div className="cloud-grid">
        <header className="section-head">
          <Reveal as="p" className="label">
            §06 / Live from the cloud
          </Reveal>
          <SplitText text={"A real server\nanswered you."} />
          <Reveal as="p" className="section-sub">
            The shop list on this page comes from <code>/api/shops</code>, a Node.js function running in a
            Vercel data centre in Mumbai (AWS ap-south-1). This panel pings it live.
          </Reveal>
        </header>

        <Reveal className="status">
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
        </Reveal>
      </div>
    </section>
  );
}

export function Footer({ shops }) {
  return (
    <footer className="footer">
      <SplitText as="p" className="footer-big" text="探検 Exploring Japan" />
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
