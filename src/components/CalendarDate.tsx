import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useMotionPreference } from "../hooks/useMotionPreference";

gsap.registerPlugin(useGSAP);
const outline = "M30 51 C23 45 5 34 5 21 C5 6 22 4 30 16 C38 4 55 6 55 21 C55 34 37 45 30 51Z";

export function CalendarDate({ day, active }: { day: number; active: boolean }) {
  const root = useRef<HTMLSpanElement>(null);
  const trace = useRef<SVGPathElement>(null);
  const replay = useRef<() => void>(() => {});
  const reduced = useMotionPreference();

  useGSAP((_, contextSafe) => {
    const element = root.current!;
    const path = trace.current!;
    element.dataset.heartState = "complete";
    if (!active || reduced) return;

    const length = path.getTotalLength();
    const draw = contextSafe!(() => {
      gsap.killTweensOf(path);
      gsap.fromTo(path,
        { strokeDasharray: `${length} ${length}`, strokeDashoffset: length },
        {
          strokeDashoffset: 0,
          duration: 1.4,
          ease: "power1.inOut",
          onStart: () => { element.dataset.heartState = "drawing"; },
          onComplete: () => {
            path.style.removeProperty("stroke-dasharray");
            path.style.removeProperty("stroke-dashoffset");
            element.dataset.heartState = "complete";
          },
        },
      );
    });
    replay.current = draw;
    element.dataset.heartState = "ready";
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        observer.disconnect();
        draw();
      }
    }, { threshold: 0.6 });
    observer.observe(element);
    return () => {
      observer.disconnect();
      replay.current = () => {};
      element.dataset.heartState = "complete";
    };
  }, { scope: root, dependencies: [active, reduced], revertOnUpdate: true });

  return (
    <span ref={root} className="wedding-day">
      <button className="wedding-date-button" type="button"
        aria-label={`Дата весілля ${day} — обвести сердечком`}
        title="Торкніться, щоб обвести дату сердечком"
        onClick={() => replay.current()}>{day}</button>
      <svg className="calendar-heart" viewBox="0 0 60 60" aria-hidden="true">
        <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" transform="rotate(-9 30 30)">
          <path className="calendar-heart-guide" d={outline} vectorEffect="non-scaling-stroke" />
          <path ref={trace} className="calendar-heart-trace" d={outline} vectorEffect="non-scaling-stroke" />
        </g>
      </svg>
    </span>
  );
}
