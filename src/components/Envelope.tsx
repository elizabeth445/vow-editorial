import { useEffect, useRef, useState, lazy, Suspense } from "react";
import { motion } from "motion/react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ArrowUpRight } from "lucide-react";
import {
  weddingConfig as c,
  dateWithoutYearSuffix,
  type GuestProfile,
} from "../data/weddingConfig";
import { NameText } from "./NameText";
import { MonogramMark } from "./Monogram";
import { WaxSeal } from "./WaxSeal";
import { useMotionPreference } from "../hooks/useMotionPreference";
import "./envelope.css";
const GhostFibers = lazy(() => import("./reactbits/GhostFibers"));
gsap.registerPlugin(useGSAP);
type PreviewStage = "seal" | "flap" | "rising" | "clear" | "foreground";
declare global {
  interface Window {
    __invitationPreview?: {
      seek: (stage: PreviewStage) => void;
      play: () => void;
      time: () => number;
    };
  }
}

export function Envelope({
  guest,
  onOpen,
}: {
  guest: GuestProfile;
  onOpen: () => void;
}) {
  const scope = useRef<HTMLDivElement>(null);
  const primaryButton = useRef<HTMLButtonElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const started = useRef(false);
  const completed = useRef(false);
  const [opening, setOpening] = useState(false);
  const reduced = useMotionPreference();
  const finish = () => {
    if (completed.current) return;
    completed.current = true;
    timeline.current?.kill();
    onOpen();
  };
  const finishRef = useRef(finish);
  finishRef.current = finish;
  useEffect(() => {
    primaryButton.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") finishRef.current();
    };
    window.addEventListener("keydown", escape);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", escape);
    };
  }, []);
  useEffect(() => {
    if (reduced && started.current) finishRef.current();
  }, [reduced]);
  const { contextSafe } = useGSAP(
    () => {
      const q = gsap.utils.selector(scope);
      const phase = (value: string) => () => {
        if (scope.current) scope.current.dataset.phase = value;
      };
      const tl = gsap.timeline({
        paused: true,
        defaults: { ease: "power2.inOut" },
        onComplete: () => finishRef.current(),
      });
      timeline.current = tl;
      // All layers are flat siblings. Only the lid itself uses a local 3D hinge.
      tl.addLabel("seal", 0)
        .to(
          q(".stationery-seal"),
          { scale: 0.91, rotate: -5, duration: 0.17 },
          0,
        )
        .to(
          q(".stationery-seal"),
          { scale: 0.76, y: 15, opacity: 0, duration: 0.3, ease: "power2.in" },
          0.17,
        )
        .to(q(".envelope-heading"), { opacity: 0, y: -12, duration: 0.5 }, 0.32)
        .to(q(".envelope-primary"), { opacity: 0, duration: 0.3 }, 0.32)
        .to(q(".envelope-masthead > span:nth-child(2)"), { opacity: 0, duration: 0.3 }, 0.32)
        // Pull the camera back slightly so the larger invitation can clear the pocket on screen.
        .to(q(".stationery-scene"), { scale: () => innerWidth > 560 ? 0.86 : 1, transformOrigin: "50% 100%", duration: 0.85 }, 0.45)
        .addLabel("flap", 0.38)
        .call(phase("flap"), [], "flap")
        .to(
          q(".stationery-flap"),
          { rotationX: 180, duration: 0.82, ease: "power2.inOut" },
          "flap",
        )
        // Change lid order at its edge-on orientation, not during a visible face.
        .set(q(".stationery-flap-layer"), { zIndex: 1 }, 0.79)
        .to(q(".stationery-assembly"), { yPercent: 19, duration: 1.1 }, 0.95)
        .addLabel("rising", 1.04)
        .call(phase("rising"), [], "rising")
        .to(
          q(".stationery-card-carrier"),
          { yPercent: -118, duration: 1.12, ease: "power2.inOut" },
          "rising",
        )
        .addLabel("clear", 2.18)
        .call(phase("clear"), [], "clear")
        // The card's bottom is now above the hinge with a measurable air gap.
        .set(q(".stationery-card-carrier"), { zIndex: 9 }, 2.25)
        .addLabel("foreground", 2.3)
        .call(phase("foreground"), [], "foreground")
        .to(
          q(".stationery-card-carrier"),
          { yPercent: -84, duration: 0.66, ease: "power3.out" },
          "foreground",
        )
        .to(
          q(".stationery-card"),
          { rotation: -3, scale: 1.035, duration: 0.66, ease: "power3.out" },
          "foreground",
        )
        .to(
          q(".stationery-shadow"),
          { scaleX: 0.83, opacity: 0.3, duration: 1.2 },
          1,
        )
        .to(
          q(".stationery-assembly"),
          { opacity: 0, yPercent: 27, duration: 0.45, ease: "power2.in" },
          3.15,
        );
      if (import.meta.env.DEV) {
        const positions: Record<PreviewStage, number> = {
          seal: 0.14,
          flap: 0.78,
          rising: 1.65,
          clear: 2.2,
          foreground: 2.98,
        };
        window.__invitationPreview = {
          seek: (stage) => {
            tl.time(positions[stage], false).pause();
          },
          play: () => {
            tl.play();
          },
          time: () => tl.time(),
        };
      }
      return () => {
        tl.kill();
        timeline.current = null;
        if (import.meta.env.DEV) delete window.__invitationPreview;
      };
    },
    { scope },
  );
  const open = contextSafe(() => {
    if (started.current || completed.current) return;
    started.current = true;
    if (reduced) {
      finish();
      return;
    }
    setOpening(true);
    scope.current
      ?.querySelector<HTMLButtonElement>(".envelope-skip")
      ?.focus({ preventScroll: true });
    timeline.current?.play(0);
  });
  return (
    <motion.div
      ref={scope}
      className={"invitation-overlay" + (opening ? " opening" : "")}
      data-phase="closed"
      role="dialog"
      aria-modal="true"
      aria-label="Особливе запрошення для вас"
      exit={{
        opacity: 0,
        transition: { duration: reduced ? 0 : 0.6, ease: [0.22, 1, 0.36, 1] },
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") finish();
        if (event.key === "Tab") {
          const controls = Array.from(
            event.currentTarget.querySelectorAll<HTMLButtonElement>(
              "button:not(:disabled)",
            ),
          );
          const first = controls[0],
            last = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }
      }}
    >
      {!reduced && (
        <div className="invitation-sparkles" aria-hidden="true">
          <Suspense fallback={null}>
            <GhostFibers glowColor="#e9d9b9" lineColor="#ffffff" secondaryColor="#d0b58d"
              threads={16} layers={1} density={0.22} thickness={0.65} particles={0.16}
              sparkle={0.45} speed={0.12} rollSpeed={0.03} rotation={-18} flow={0.08}
              brightness={0.7} glow={0.1} grain={0} depthOfField={0.16} vignette={0.3}
              mouseInteraction={false} pulseOnClick={false} hoverEffect="none" dpr={1} paused={opening} />
          </Suspense>
        </div>
      )}
      <div className="envelope-masthead">
        <span className="monogram">
          <MonogramMark />
        </span>
        <span>ОСОБИСТО З ЛЮБОВ’Ю</span>
        <button className="envelope-skip" onClick={finish}>
          Пропустити анімацію <ArrowUpRight size={13} />
        </button>
      </div>
      <div className="envelope-heading">
        <h1>

          Наше весілля<br />
          <em>Будьте поруч</em>
        </h1>
      </div>
      <div className="stationery-scene">
        <div className="stationery-assembly">

          <div className="stationery-flap-layer">
            <div className="stationery-flap">
              <div className="stationery-flap-face outside" />
              <div className="stationery-flap-face inside" />
            </div>
          </div>
          <div className="stationery-back" />
          <div className="stationery-lining" />
          <div className="stationery-card-carrier">
            <div className="stationery-card">
              <div className="card-rule" />
              <span className="card-kicker">РАЗОМ НАЗАВЖДИ</span>
              <span className="card-names">
                {c.groom}
                <i className="name-amp">&amp;</i>
                {c.bride}
              </span>
              <span className="card-date">
                {dateWithoutYearSuffix}
              </span>
              <span className="card-place">КИЇВ · РЕСТОРАН «ПРАГА»</span>
              <div className="card-flourish" aria-hidden="true">
                ♡
              </div>
            </div>
          </div>
          <div className="stationery-pocket">
            <div className="stationery-pocket-grain" />
          </div>
          <div className="stationery-fold fold-left" />
          <div className="stationery-fold fold-right" />
          <svg className="stationery-crease-lines" viewBox="0 0 600 370" preserveAspectRatio="none" aria-hidden="true">
            <path d="M1 1 L300 203.5 L599 1 M1 369 L300 203.5 L599 369" fill="none" stroke="#9b7e57" strokeWidth="1.1" strokeOpacity=".56" />
            <path d="M1 2.2 L300 204.7 L599 2.2 M1 367.8 L300 202.3 L599 367.8" fill="none" stroke="#fff8e8" strokeWidth=".8" strokeOpacity=".75" />
          </svg>
          <div className="stationery-address">
            <p>
              <NameText text={guest.recipient} />
            </p>
          </div>
          <button
            className="stationery-seal"
            aria-label="Відкрити воскову печатку"
            onClick={open}
            disabled={opening}
          >
            <WaxSeal />
            <span className="seal-inner">
              <MonogramMark />
            </span>
          </button>
        </div>
        <div className="stationery-shadow" />
      </div>
      <div className="envelope-actions">
        <button
          ref={primaryButton}
          className="button dark envelope-primary"
          onClick={open}
          disabled={opening}
          aria-busy={opening}
        >
          <span>Відкрити запрошення</span> <ArrowUpRight size={16} />
        </button>
        <span className="envelope-action-note" aria-live="polite">
          {opening ? "Відкриваємо нашу історію" : ""}
        </span>
      </div>
      <div className="envelope-colophon">
        <span>{dateWithoutYearSuffix.toUpperCase()}</span>
        <span>
          <NameText text={c.signature.toUpperCase()} />
        </span>
      </div>
    </motion.div>
  );
}
