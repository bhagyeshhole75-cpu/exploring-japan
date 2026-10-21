import useReveal from "../hooks/useReveal.js";

// Wraps content that should fade and slide up when it scrolls into view.
// Children with style={{"--i": n}} animate one after another.
export default function Reveal({ as: Tag = "div", className = "", children, ...rest }) {
  const [ref, inView] = useReveal();
  return (
    <Tag ref={ref} className={`reveal ${inView ? "is-in" : ""} ${className}`} {...rest}>
      {children}
    </Tag>
  );
}
