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
          <svg className="stationery-deckle" viewBox="0 0 600 370" preserveAspectRatio="none" aria-hidden="true"><path d="M0 0 Q6 -4 12 0 Q18 -4 24 0 Q30 -4 36 0 Q42 -4 48 0 Q54 -4 60 0 Q66 -4 72 0 Q78 -4 84 0 Q90 -4 96 0 Q102 -4 108 0 Q114 -4 120 0 Q126 -4 132 0 Q138 -4 144 0 Q150 -4 156 0 Q162 -4 168 0 Q174 -4 180 0 Q186 -4 192 0 Q198 -4 204 0 Q210 -4 216 0 Q222 -4 228 0 Q234 -4 240 0 Q246 -4 252 0 Q258 -4 264 0 Q270 -4 276 0 Q282 -4 288 0 Q294 -4 300 0 Q306 -4 312 0 Q318 -4 324 0 Q330 -4 336 0 Q342 -4 348 0 Q354 -4 360 0 Q366 -4 372 0 Q378 -4 384 0 Q390 -4 396 0 Q402 -4 408 0 Q414 -4 420 0 Q426 -4 432 0 Q438 -4 444 0 Q450 -4 456 0 Q462 -4 468 0 Q474 -4 480 0 Q486 -4 492 0 Q498 -4 504 0 Q510 -4 516 0 Q522 -4 528 0 Q534 -4 540 0 Q546 -4 552 0 Q558 -4 564 0 Q570 -4 576 0 Q582 -4 588 0 Q594 -4 600 0 Q604 5 600 10 Q604 15 600 20 Q604 25 600 30 Q604 35 600 40 Q604 45 600 50 Q604 55 600 60 Q604 65 600 70 Q604 75 600 80 Q604 85 600 90 Q604 95 600 100 Q604 105 600 110 Q604 115 600 120 Q604 125 600 130 Q604 135 600 140 Q604 145 600 150 Q604 155 600 160 Q604 165 600 170 Q604 175 600 180 Q604 185 600 190 Q604 195 600 200 Q604 205 600 210 Q604 215 600 220 Q604 225 600 230 Q604 235 600 240 Q604 245 600 250 Q604 255 600 260 Q604 265 600 270 Q604 275 600 280 Q604 285 600 290 Q604 295 600 300 Q604 305 600 310 Q604 315 600 320 Q604 325 600 330 Q604 335 600 340 Q604 345 600 350 Q604 355 600 360 Q604 365 600 370 Q594 374 588 370 Q582 374 576 370 Q570 374 564 370 Q558 374 552 370 Q546 374 540 370 Q534 374 528 370 Q522 374 516 370 Q510 374 504 370 Q498 374 492 370 Q486 374 480 370 Q474 374 468 370 Q462 374 456 370 Q450 374 444 370 Q438 374 432 370 Q426 374 420 370 Q414 374 408 370 Q402 374 396 370 Q390 374 384 370 Q378 374 372 370 Q366 374 360 370 Q354 374 348 370 Q342 374 336 370 Q330 374 324 370 Q318 374 312 370 Q306 374 300 370 Q294 374 288 370 Q282 374 276 370 Q270 374 264 370 Q258 374 252 370 Q246 374 240 370 Q234 374 228 370 Q222 374 216 370 Q210 374 204 370 Q198 374 192 370 Q186 374 180 370 Q174 374 168 370 Q162 374 156 370 Q150 374 144 370 Q138 374 132 370 Q126 374 120 370 Q114 374 108 370 Q102 374 96 370 Q90 374 84 370 Q78 374 72 370 Q66 374 60 370 Q54 374 48 370 Q42 374 36 370 Q30 374 24 370 Q18 374 12 370 Q6 374 0 370 Q-4 365 0 360 Q-4 355 0 350 Q-4 345 0 340 Q-4 335 0 330 Q-4 325 0 320 Q-4 315 0 310 Q-4 305 0 300 Q-4 295 0 290 Q-4 285 0 280 Q-4 275 0 270 Q-4 265 0 260 Q-4 255 0 250 Q-4 245 0 240 Q-4 235 0 230 Q-4 225 0 220 Q-4 215 0 210 Q-4 205 0 200 Q-4 195 0 190 Q-4 185 0 180 Q-4 175 0 170 Q-4 165 0 160 Q-4 155 0 150 Q-4 145 0 140 Q-4 135 0 130 Q-4 125 0 120 Q-4 115 0 110 Q-4 105 0 100 Q-4 95 0 90 Q-4 85 0 80 Q-4 75 0 70 Q-4 65 0 60 Q-4 55 0 50 Q-4 45 0 40 Q-4 35 0 30 Q-4 25 0 20 Q-4 15 0 10 Q-4 5 0 0 Z" fill="#e9ddc5" stroke="#bca888" strokeWidth="0.7" /></svg>
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
