import { Fragment } from "react";
import useReveal from "../hooks/useReveal.js";

// Splits a heading into words and letters so each letter can rise into place
// one after another (a staggered "reveal", like Shopify Editions).
// Use "\n" in the text for a line break.
export default function SplitText({ text, as: Tag = "h2", className = "", trigger, delay = 0 }) {
  const [ref, inView] = useReveal({ threshold: 0.3 });
  const active = trigger ?? inView;
  let i = 0;

  return (
    <Tag ref={ref} className={`split ${active ? "is-in" : ""} ${className}`} aria-label={text.replace(/\n/g, " ")}>
      {text.split("\n").map((line, li) => {
        const words = line.split(" ");
        return (
          <span className="split-line" key={li} aria-hidden="true">
            {words.map((word, wi) => (
              <Fragment key={wi}>
                <span className="split-word">
                  {[...word].map((ch, ci) => (
                    <span className="split-char" key={ci} style={{ "--i": i++, "--d": `${delay}ms` }}>
                      {ch}
                    </span>
                  ))}
                </span>
                {wi < words.length - 1 ? " " : null}
              </Fragment>
            ))}
          </span>
        );
      })}
    </Tag>
  );
}
