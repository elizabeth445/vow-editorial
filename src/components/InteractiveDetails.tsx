import {
  useEffect,
  useId,
  useRef,
  useState,
  type RefObject,
  type CSSProperties,
} from "react";
import { motion, AnimatePresence } from "motion/react";
import { Heart, X, ArrowUpRight, Check } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useMotionPreference } from "../hooks/useMotionPreference";
import { wishes } from "../lib/wishes";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** One narrow SVG in the page gutter; geometry follows real section heights. */
export function FateThread({
  container,
}: {
  container: RefObject<HTMLElement | null>;
}) {
  const root = useRef<SVGSVGElement>(null);
  const reduced = useMotionPreference();
  const [geometry, setGeometry] = useState({ top: 0, height: 1, path: "" });
  useEffect(() => {
    const main = container.current;
    if (!main) return;
    let frame = 0;
    let alive = true;
    const measure = () => {
      if (!alive) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const sections = [
          ...main.querySelectorAll<HTMLElement>(":scope > section"),
        ].slice(1);
        if (sections.length < 2) return;
        const base = main.getBoundingClientRect().top;
        const top = sections[0].getBoundingClientRect().top - base + 24;
        const points = sections.map(
          (section) => section.getBoundingClientRect().top - base - top + 70,
        );
        const height = Math.ceil(points.at(-1)! + 100);
        let d = "M 20 0";
        let previous = 0;
        points.forEach((y, i) => {
          const x = i % 2 ? 13 : 27;
          d += ` C 20 ${previous + (y - previous) * 0.4}, ${x} ${previous + (y - previous) * 0.6}, ${x} ${y}`;
          previous = y;
        });
        d += ` C 27 ${previous + 26}, 20 ${height - 26}, 20 ${height - 20} C 0 ${height - 36}, 6 ${height - 46}, 20 ${height - 34} C 34 ${height - 46}, 40 ${height - 36}, 20 ${height - 20}`;
        setGeometry((old) =>
          old.path === d && old.top === top ? old : { top, height, path: d },
        );
      });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(main);
    window.addEventListener("resize", measure);
    document.fonts.ready.then(measure);
    measure();
    return () => {
      alive = false;
      observer.disconnect();
      window.removeEventListener("resize", measure);
      cancelAnimationFrame(frame);
    };
  }, [container]);
  useGSAP(
    () => {
      if (!geometry.path || reduced) return;
      gsap.fromTo(
        ".fate-ink",
        { strokeDashoffset: 1 },
        {
          strokeDashoffset: 0,
          autoRound: false,
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "top 70%",
            end: "bottom 70%",
            scrub: 0.35,
          },
        },
      );
    },
    {
      scope: root,
      dependencies: [geometry.path, reduced],
      revertOnUpdate: true,
    },
  );
  return (
    <svg
      ref={root}
      className="fate-thread"
      aria-hidden="true"
      preserveAspectRatio="none"
      width="40"
      height={geometry.height}
      viewBox={`0 0 40 ${geometry.height}`}
      style={{ top: geometry.top }}
    >
      <path className="fate-ghost" d={geometry.path} />
      <path
        className="fate-ink"
        d={geometry.path}
        pathLength="1"
        strokeDasharray="1"
      />
    </svg>
  );
}

/** Three soft light glints, paused offscreen and in background tabs. */
export function LightGlints({ active }: { active: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useMotionPreference();
  useEffect(() => {
    const element = ref.current;
    if (!element || reduced || !active) return;
    let visible = false;
    const update = () => {
      element.dataset.running = String(visible && !document.hidden);
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      update();
    });
    observer.observe(element);
    document.addEventListener("visibilitychange", update);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
      delete element.dataset.running;
    };
  }, [active, reduced]);
  return (
    <div ref={ref} className="light-scene" aria-hidden="true" hidden={reduced}>
      {[0, 1, 2].map((i) => (
        <i key={i} style={{ "--glint": i } as CSSProperties} />
      ))}
    </div>
  );
}

export function Botanical({
  variant = "sprig",
}: {
  variant?: "sprig" | "bloom";
}) {
  const reduced = useMotionPreference();
  const paths =
    variant === "sprig"
      ? [
          "M44 178C48 139 82 88 65 20",
          "M47 152C18 144 15 123 20 112C39 119 51 132 47 152 M57 123C81 119 96 98 90 88C69 91 58 108 57 123 M64 95C38 90 32 69 39 56C58 65 68 80 64 95 M68 68C86 55 87 35 80 28C65 40 63 55 68 68",
          "M65 27C38 17 44 1 55 4C61 4 67 13 65 27 M65 27C85 15 77 0 70 4C63 8 63 19 65 27",
        ]
      : [
          "M48 180C59 143 47 103 62 70 M53 140C28 136 22 118 28 107C46 111 53 126 53 140 M55 116C78 106 87 91 82 81C62 87 56 102 55 116",
          "M62 70C37 67 27 51 37 43C42 36 54 42 62 57C48 33 53 18 65 22C77 23 72 43 66 56C85 34 98 43 94 54C90 64 77 70 62 70 M62 70C49 91 33 86 36 74C39 64 50 61 62 64 M64 65C85 66 91 82 81 86C70 91 63 77 64 65",
        ];
  return (
    <svg
      className={`botanical botanical-${variant}`}
      viewBox="0 0 110 190"
      aria-hidden="true"
    >
      {paths.map((d, i) => (
        <motion.path
          key={d}
          d={d}
          fill="none"
          stroke="currentColor"
          strokeWidth=".9"
          initial={reduced ? false : { pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{
            duration: 1.7,
            delay: reduced ? 0 : i * 0.18,
            ease: "easeInOut",
          }}
        />
      ))}
    </svg>
  );
}

export function SecretNote({
  label,
  children,
}: {
  label: string;
  children: string;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  return (
    <div className="secret-note" ref={root}>
      <button
        ref={button}
        className="secret-trigger"
        aria-label={label}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
      >
        <Heart size={18} strokeWidth={1} />
        <span className="secret-hint">маленький секрет</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="secret-paper"
            id={id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 3 }}
            transition={{ duration: 0.2 }}
          >
            <span className="eyebrow">МІЖ НАМИ</span>
            <p>{children}</p>
            <button
              aria-label="Закрити записку"
              onClick={() => {
                setOpen(false);
                button.current?.focus();
              }}
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function RingInteraction({ active = true }: { active?: boolean }) {
  const scene = useRef<HTMLDivElement>(null);
  const reduced = useMotionPreference();
  const id = useId();
  const metal = `${id}-metal`,
    edge = `${id}-edge`,
    shadow = `${id}-shadow`;
  useGSAP(() => {
    const root = scene.current;
    if (!root) return;
    const left = root.querySelectorAll(".ring-left, .ring-front");
    const right = root.querySelector(".ring-right");
    const front = root.querySelector(".ring-front");
    const shadows = root.querySelectorAll(".ring-shadow");
    if (reduced) {
      root.dataset.joined = "true";
      return;
    }
    root.dataset.joined = "false";
    if (!active) return;
    // Native SVG transforms keep the woven front arc aligned with its band.
    const timeline = gsap.timeline({
      defaults: { duration: 1, ease: "none" },
      scrollTrigger: {
        id: "wedding-rings",
        trigger: root,
        start: "clamp(center 85%)",
        end: "clamp(center 35%)",
        scrub: 0.35,
        invalidateOnRefresh: true,
      },
      onUpdate() { root.dataset.joined = String(this.progress() >= 0.98); },
    });
    timeline
      .fromTo(left, { attr: { transform: "translate(68 68) rotate(-8)" } },
        { attr: { transform: "translate(100 64) rotate(0)" } }, 0)
      .fromTo(right, { attr: { transform: "translate(172 68) rotate(8)" } },
        { attr: { transform: "translate(140 64) rotate(0)" } }, 0)
      .fromTo(shadows[0], { attr: { cx: 68 } }, { attr: { cx: 100 } }, 0)
      .fromTo(shadows[1], { attr: { cx: 172 } }, { attr: { cx: 140 } }, 0)
      .fromTo(front, { opacity: 0 }, { opacity: 1, duration: 0.08 }, 0.62);
  }, { scope: scene, dependencies: [active, reduced], revertOnUpdate: true });
  const band = (front = false) => (
    <>
      {front ? (
        <>
          <path d="M34 3 A34 40 0 0 1 0 43" stroke="#745024" strokeWidth="11" />
          <path
            d="M34 0 A34 40 0 0 1 0 40"
            stroke={`url(#${edge})`}
            strokeWidth="11"
          />
          <path
            d="M34 0 A34 40 0 0 1 0 40"
            stroke={`url(#${metal})`}
            strokeWidth="8"
          />
          <path
            d="M32.5 0 A32.5 38.5 0 0 1 0 38.5"
            stroke="#ffedbf"
            strokeWidth=".7"
            opacity=".9"
          />
        </>
      ) : (
        <>
          <ellipse cy="3" rx="34" ry="40" stroke="#745024" strokeWidth="11" />
          <ellipse rx="28.5" ry="34.5" stroke="#6e4824" strokeWidth="1.4" opacity=".65" />
          <ellipse rx="34" ry="40" stroke={`url(#${edge})`} strokeWidth="11" />
          <ellipse rx="34" ry="40" stroke={`url(#${metal})`} strokeWidth="8" />
          <ellipse
            rx="31.5"
            ry="37.5"
            stroke="#ffedbf"
            strokeWidth=".8"
            opacity=".8"
          />
          <path
            d="M-30 -18 A34 40 0 0 1 19 -33"
            stroke="#fff4d9"
            strokeWidth="1.3"
            opacity=".9"
          />
          <path
            d="M31 20 A34 40 0 0 1 -17 35"
            stroke="#78542d"
            strokeWidth="1"
            opacity=".7"
          />
        </>
      )}
    </>
  );
  return (
    <div className="ring-interaction" ref={scene} data-joined={reduced}>
      <div className="ring-display" role="img" aria-label="Дві золоті обручки поєднуються — символ нашого назавжди">
        <svg
          key={reduced ? "static-rings" : "scroll-rings"}
          className="realistic-rings"
          viewBox="0 0 240 145"
          aria-hidden="true"
        >
          <defs>
            <linearGradient
              id={metal}
              gradientUnits="userSpaceOnUse"
              x1="-35"
              y1="-40"
              x2="35"
              y2="40"
            >
              <stop stopColor="#513217" />
              <stop offset=".13" stopColor="#fff1c7" />
              <stop offset=".19" stopColor="#fffbed" />
              <stop offset=".28" stopColor="#ad7833" />
              <stop offset=".43" stopColor="#ffedb0" />
              <stop offset=".48" stopColor="#fff9e7" />
              <stop offset=".57" stopColor="#cda65d" />
              <stop offset=".76" stopColor="#734818" />
              <stop offset=".9" stopColor="#f3d497" />
              <stop offset="1" stopColor="#b28b4d" />
            </linearGradient>
            <linearGradient id={edge} x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#a47b42" />
              <stop offset=".5" stopColor="#e6c58b" />
              <stop offset="1" stopColor="#75512d" />
            </linearGradient>
            <radialGradient id={shadow}>
              <stop stopColor="#57432e" stopOpacity=".22" />
              <stop offset="1" stopColor="#57432e" stopOpacity="0" />
            </radialGradient>
          </defs>
          {[0, 1].map((i) => (
            <ellipse
              key={i}
              className="ring-shadow"
              cx={i ? (reduced ? 140 : 172) : (reduced ? 100 : 68)}
              cy="119"
              rx="40"
              ry="8"
              fill={`url(#${shadow})`}
            />
          ))}
          <g className="ring-left" transform={reduced ? "translate(100 64)" : "translate(68 68) rotate(-8)"} fill="none">
            <g transform="rotate(-16)">{band()}</g>
          </g>
          <g className="ring-right" transform={reduced ? "translate(140 64)" : "translate(172 68) rotate(8)"} fill="none">
            <g transform="rotate(16)">{band()}</g>
          </g>
          {/* Alternating over/under crossings appear as the bands overlap. */}
          <g className="ring-front" transform={reduced ? "translate(100 64)" : "translate(68 68) rotate(-8)"} opacity={reduced ? 1 : 0} fill="none">
            <g transform="rotate(-16)">{band(true)}</g>
          </g>
        </svg>
      </div>
      <p>
        Дві історії — одне назавжди
      </p>
    </div>
  );
}

const stars = [
  { x: 10, y: 53 },
  { x: 29, y: 25 },
  { x: 51, y: 44 },
  { x: 72, y: 16 },
  { x: 89, y: 55 },
];
export function StarWishes({ guestId }: { guestId: string }) {
  const [saved, setSaved] = useState(() => wishes.get(guestId));
  const [selected, setSelected] = useState<number | null>(null);
  const [message, setMessage] = useState(saved?.message ?? "");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const field = useRef<HTMLTextAreaElement>(null);
  const confirmation = useRef<HTMLHeadingElement>(null);
  const paper = useRef<HTMLDivElement>(null);
  const triggers = useRef<(HTMLButtonElement | null)[]>([]);
  const panelId = useId();
  const close = () => {
    const star = selected;
    setSelected(null);
    setError("");
    if (star !== null) triggers.current[star]?.focus();
  };
  useEffect(() => {
    if (selected === null) return;
    if (success) confirmation.current?.focus({ preventScroll: true });
    else {
      field.current?.focus({ preventScroll: true });
      paper.current?.scrollIntoView({ block: "nearest", behavior: "instant" });
    }
  }, [selected, success]);
  return (
    <section
      className="wishes-section section"
      id="wishes"
      aria-labelledby="wishes-title"
    >
      <div className="wishes-heading">
        <h2 id="wishes-title">
          У кожної зірки —<br />
          <em>тепле побажання</em>
        </h2>
        <p>Оберіть зірку й залиште кілька слів для нашого спільного неба</p>
      </div>
      <div className="wish-constellation" aria-label="Зірки побажань">
        <svg
          viewBox="0 0 1000 200"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M100 106L290 50L510 88L720 32L890 110"
            fill="none"
            stroke="currentColor"
            strokeWidth=".6"
            strokeDasharray="2 7"
          />
        </svg>
        {stars.map((star, i) => (
          <button
            key={i}
            ref={(el) => {
              triggers.current[i] = el;
            }}
            style={{ left: `${star.x}%`, top: `${star.y}%` }}
            className={`wish-star ${saved?.star === i ? "is-saved" : ""}`}
            aria-label={`Зірка ${i + 1}${saved?.star === i ? ": ваше побажання" : ": залишити побажання"}`}
            aria-expanded={selected === i}
            aria-controls={panelId}
            onClick={() => {
              setSelected(i);
              setSuccess(false);
              setError("");
              if (selected === null || success)
                setMessage(saved?.message ?? "");
            }}
          >
            <svg viewBox="0 0 40 40" aria-hidden="true">
              <path
                d="M20 2Q22 18 38 20Q22 22 20 38Q18 22 2 20Q18 18 20 2Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
              <circle cx="20" cy="20" r="2" fill="currentColor" />
            </svg>
            <span>0{i + 1}</span>
          </button>
        ))}
      </div>
      {selected !== null && (
        <div
          className="wish-paper"
          ref={paper}
          id={panelId}
          onKeyDown={(e) => {
            if (e.key === "Escape") close();
          }}
        >
          <button
            className="wish-close"
            aria-label="Закрити побажання"
            onClick={close}
          >
            <X size={18} />
          </button>
          {success ? (
            <div className="wish-success" role="status">
              <Check size={26} strokeWidth={1} />
              <h3 ref={confirmation} tabIndex={-1}>

                Ваша зірка засяяла</h3>
              <p>{saved?.message}</p>
              <span>Побажання збережено в цьому браузері</span>
              <button className="text-button" onClick={() => setSuccess(false)}>
                Редагувати побажання <ArrowUpRight size={15} />
              </button>
            </div>
          ) : (
            <form
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                const text = message.trim();
                if (text.length < 3 || text.length > 280) {
                  setError(
                    text.length < 3
                      ? "Напишіть побажання: щонайменше 3 символи"
                      : "Не більше 280 символів",
                  );
                  field.current?.focus();
                  return;
                }
                try {
                  const value = wishes.save({
                    guestId,
                    star: selected,
                    message: text,
                    savedAt: new Date().toISOString(),
                  });
                  setSaved(value);
                  setSuccess(true);
                  setError("");
                } catch {
                  setError(
                    "Не вдалося зберегти — дозвольте локальне сховище браузера й спробуйте ще раз",
                  );
                }
              }}
            >
              <span className="eyebrow">ЗІРКА 0{selected + 1}</span>
              <h3>Кілька слів від серця</h3>
              <label htmlFor={`${panelId}-message`}>Ваше побажання</label>
              <textarea
                ref={field}
                id={`${panelId}-message`}
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  setError("");
                }}
                maxLength={280}
                rows={3}
                aria-invalid={!!error}
                aria-describedby={`${panelId}-help${error ? ` ${panelId}-error` : ""}`}
                data-native-scroll
              />
              <div className="wish-field-meta" id={`${panelId}-help`}>
                <span>Від 3 до 280 символів</span>
                <span>{message.length}/280</span>
              </div>
              {error && (
                <p id={`${panelId}-error`} className="wish-error" role="alert">
                  {error}
                </p>
              )}
              <button className="button dark" type="submit">
                Зберегти побажання <ArrowUpRight size={16} />
              </button>
            </form>
          )}
        </div>
      )}
      <p className="wishes-privacy">

        Локальна демоверсія: одне побажання для цього запрошення, лише у вашому
        браузері; воно не надсилається парі, а змінити його можна, знову обравши
        зірку</p>
    </section>
  );
}
