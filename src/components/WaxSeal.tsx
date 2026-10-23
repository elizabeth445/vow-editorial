import { useId } from "react";

/** Sculpted wax, separate from the legible gold monogram. */
export function WaxSeal() {
  const id = useId().replace(/:/g, "");
  return (
    <svg className="wax-cast" viewBox="0 0 120 120" aria-hidden="true">
      <defs>
        <radialGradient id={`${id}-wax`} cx="32%" cy="20%" r="85%">
          <stop stopColor="#c48d73" />
          <stop offset=".28" stopColor="#a15d50" />
          <stop offset=".69" stopColor="#753d38" />
          <stop offset="1" stopColor="#452824" />
        </radialGradient>
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2=".85" y2="1">
          <stop stopColor="#e0aa8a" />
          <stop offset=".42" stopColor="#a06551" />
          <stop offset=".75" stopColor="#4b2825" />
          <stop offset="1" stopColor="#b7745f" />
        </linearGradient>
        <radialGradient id={`${id}-stamp`} cx="65%" cy="80%" r="85%">
          <stop stopColor="#94574b" />
          <stop offset=".8" stopColor="#793e38" />
          <stop offset="1" stopColor="#4c2c27" />
        </radialGradient>
        <filter id={`${id}-grain`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency=".65" numOctaves="2" seed="7" />
          <feColorMatrix type="saturate" values="0" />
          <feComposite in2="SourceGraphic" operator="in" />
          <feBlend in="SourceGraphic" mode="soft-light" />
        </filter>
      </defs>
      <path d="M60 5C70 4 77 8 84 11C96 12 103 21 105 30C112 39 116 47 114 58C117 69 110 78 107 86C103 98 95 103 84 105C75 114 65 112 55 115C44 115 36 109 28 106C17 103 11 95 10 85C3 76 4 65 6 55C3 44 10 36 13 27C18 17 28 13 38 12C45 6 51 4 60 5Z"
        fill={`url(#${id}-wax)`} stroke={`url(#${id}-rim)`} strokeWidth="1.5" />
      <circle cx="60" cy="60" r="43" fill="none" stroke={`url(#${id}-rim)`} strokeWidth="4.5" />
      <circle cx="60" cy="60" r="39.5" fill={`url(#${id}-stamp)`} stroke="#d499742e" strokeWidth=".8" />
      <path d="M23 47C27 26 44 18 61 18M24 75C28 86 34 91 41 95" fill="none" stroke="#f4c2a3" strokeOpacity=".4" strokeWidth="1" strokeLinecap="round" />
      <circle cx="60" cy="60" r="37" fill="#925443" opacity=".15" filter={`url(#${id}-grain)`} />
    </svg>
  );
}
