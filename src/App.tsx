import { useEffect, useRef, useState, lazy, Suspense } from "react";
import { AnimatePresence, MotionConfig, motion, useScroll } from "motion/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowDown,
  ArrowUpRight,
  CalendarDays,
  Heart,
  Menu,
  X,
  MapPin,
  ArrowRight,
  RotateCcw,
  Wine,
  Sparkles,
  Utensils,
  Music2,
  CakeSlice,
} from "lucide-react";
import {
  weddingConfig as c,
  guests,
  nav,
  calendarInfo,
  dateText,
  dateWithoutYearSuffix,
  ceremonyTime,
  ceremonyWeekday,
} from "./data/weddingConfig";
import { downloadCalendar } from "./lib/calendar";
import SplitText from "./components/reactbits/SplitText";
import { NameText } from "./components/NameText";
import { MonogramMark } from "./components/Monogram";
import { Envelope } from "./components/Envelope";
import { CalendarDate } from "./components/CalendarDate";
import { RSVP } from "./components/RSVP";
import { DevPanel } from "./components/DevPanel";
import {
  FateThread,
  LightGlints,
  Botanical,
  SecretNote,
  RingInteraction,
  StarWishes,
} from "./components/InteractiveDetails";
import { useGSAP } from "@gsap/react";
import { useMotionPreference } from "./hooks/useMotionPreference";
import { useSmoothScroll } from "./hooks/useSmoothScroll";
const GhostFibers = lazy(() => import("./components/reactbits/GhostFibers"));
gsap.registerPlugin(ScrollTrigger, useGSAP);
function Countdown() {
  const reduced = useMotionPreference();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const seconds = Math.max(
    0,
    Math.floor((new Date(c.ceremony).getTime() - now) / 1000),
  );
  const parts = [
    Math.floor(seconds / 86400),
    Math.floor(seconds / 3600) % 24,
    Math.floor(seconds / 60) % 60,
    seconds % 60,
  ];
  return (
    <div className="countdown-wrap">
      <p className="eyebrow">ДО НАШОГО ОСОБЛИВОГО ДНЯ ЗАЛИШИЛОСЯ</p>
      {seconds > 0 ? (
        <div className="countdown" role="timer" aria-label="Час до весілля">
          {parts.map((v, i) => (
            <div key={i}>
              <span className="count-number">
                {reduced ? (
                  <span>{String(v).padStart(2, "0")}</span>
                ) : (
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={v}
                      initial={{ opacity: 0, y: 7 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -7 }}
                      transition={{ duration: 0.2 }}
                    >
                      {String(v).padStart(2, "0")}
                    </motion.span>
                  </AnimatePresence>
                )}
              </span>
              <span className="count-label">
                {["Днів", "Годин", "Хвилин", "Секунд"][i]}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <h3>Цей особливий день настав!</h3>
      )}
    </div>
  );
}
function App() {
  const guest =
    guests.find(
      (g) => g.id === new URLSearchParams(location.search).get("guest"),
    ) || guests[0];
  const [opened, setOpened] = useState(false);
  const [menu, setMenu] = useState(false);
  const [rsvpKey, setRsvpKey] = useState(0);
  const reduced = useMotionPreference();
  const mainRef = useRef<HTMLElement>(null);
  const storyRef = useRef<HTMLDivElement>(null);
  const menuToggle = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const heroTitle = useRef<HTMLHeadingElement>(null);
  const { scrollYProgress } = useScroll();
  const [memory, setMemory] = useState(0);
  const [photoNote, setPhotoNote] = useState(false);
  useSmoothScroll(opened && !menu);
  useGSAP(
    () => {
      if (!opened || reduced) return;
      const mm = gsap.matchMedia();
      mm.add("(min-width:801px)", () => {
        gsap.fromTo(
          ".story-photo-main",
          { y: 18, rotate: -5 },
          {
            y: -28,
            rotate: -2,
            ease: "none",
            scrollTrigger: {
              trigger: storyRef.current,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.7,
            },
          },
        );
        gsap.fromTo(
          ".story-photo-small",
          { y: 35, rotate: 7 },
          {
            y: -28,
            rotate: 3,
            ease: "none",
            scrollTrigger: {
              trigger: storyRef.current,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.7,
            },
          },
        );
      });
      return () => mm.revert();
    },
    { scope: storyRef, dependencies: [opened, reduced], revertOnUpdate: true },
  );
  useGSAP(
    () => {
      if (!opened || reduced) return;
      const media = gsap.matchMedia();
      media.add("(min-width:801px)", () => {
        gsap.fromTo(
          ".hero-photo img",
          { yPercent: -1, scale: 1.025 },
          {
            yPercent: 1,
            scale: 1.025,
            ease: "none",
            scrollTrigger: {
              trigger: ".hero",
              start: "top top",
              end: "bottom top",
              scrub: 0.5,
            },
          },
        );
      });
      gsap.utils.toArray<HTMLElement>(".image-reveal").forEach((el) =>
        gsap.fromTo(
          el,
          { clipPath: "inset(10% 0% 0% 0%)" },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            ease: "power3.out",
            duration: 1.2,
            scrollTrigger: { trigger: el, start: "top 85%", once: true },
          },
        ),
      );
      return () => media.revert();
    },
    { scope: mainRef, dependencies: [opened, reduced], revertOnUpdate: true },
  );
  useEffect(() => {
    if (!menu) return;
    menuRef.current?.querySelector("a")?.focus();
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenu(false);
        menuToggle.current?.focus();
      }
      if (e.key === "Tab") {
        const items = [
          menuToggle.current,
          ...Array.from(menuRef.current?.querySelectorAll("a") || []),
        ].filter(Boolean) as HTMLElement[];
        if (e.shiftKey && document.activeElement === items[0]) {
          e.preventDefault();
          items[items.length - 1]?.focus();
        } else if (
          !e.shiftKey &&
          document.activeElement === items[items.length - 1]
        ) {
          e.preventDefault();
          items[0]?.focus();
        }
      }
    };
    window.addEventListener("keydown", escape);
    return () => {
      document.body.style.overflow = old;
      window.removeEventListener("keydown", escape);
    };
  }, [menu]);
  useEffect(() => {
    document.documentElement.style.setProperty("--paper", c.theme.paper);
    document.documentElement.style.setProperty("--ink", c.theme.ink);
    document.documentElement.style.setProperty("--wine", c.theme.wine);
  }, []);
  useEffect(() => {
    if (!opened) return;
    let active = true;
    document.fonts.ready.then(() => {
      if (active) ScrollTrigger.refresh();
    });
    return () => {
      active = false;
    };
  }, [opened]);
  const open = () => {
    setOpened(true);
  };
  const replay = () => {
    setMenu(false);
    window.scrollTo({ top: 0, behavior: "instant" });
    setOpened(false);
  };
  const reveal = {
    initial: reduced ? false : { opacity: 0, y: 25 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.15 },
    transition: { duration: 0.8 },
  } as const;
  return (
    <MotionConfig reducedMotion={reduced ? "always" : "never"}>
      <AnimatePresence
        onExitComplete={() => heroTitle.current?.focus({ preventScroll: true })}
      >
        {!opened && <Envelope guest={guest} onOpen={open} />}
      </AnimatePresence>
      <div inert={!opened} className="site-shell">
        <a href="#letter" className="skip-link">
          До основного вмісту
        </a>
        <motion.div
          className="reading-progress"
          style={{ scaleX: scrollYProgress }}
        />
        <header className="header">
          <a
            className="monogram"
            href="#home"
            aria-label="Андрій & Марія — на початок"
          >
            <MonogramMark />
          </a>
          <nav className="desktop-nav" aria-label="Основна навігація">
            {nav.slice(0, 5).map(([id, label]) => (
              <a href={"#" + id} key={id}>
                {label}
              </a>
            ))}
          </nav>
          <a className="header-rsvp" href="#rsvp">
            Відповісти <ArrowUpRight size={15} />
          </a>
          <button
            ref={menuToggle}
            className="mobile-toggle"
            aria-label={menu ? "Закрити меню" : "Відкрити меню"}
            aria-expanded={menu}
            aria-controls="mobile-nav"
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X /> : <Menu />}
          </button>
        </header>
        <AnimatePresence>
          {menu && (
            <motion.div
              ref={menuRef}
              id="mobile-nav"
              className="mobile-nav"
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              onKeyDown={(e) => {
                if (e.key === "Tab") {
                  const links = Array.from(
                    e.currentTarget.querySelectorAll("a"),
                  );
                  if (
                    !e.shiftKey &&
                    document.activeElement === links[links.length - 1]
                  ) {
                    e.preventDefault();
                    menuToggle.current?.focus();
                  }
                }
              }}
            >
              <span className="eyebrow">НАШ ОСОБЛИВИЙ ДЕНЬ</span>
              {nav.map(([id, label], i) => (
                <a
                  href={"#" + id}
                  key={id}
                  onClick={() => {
                    setMenu(false);
                    document.getElementById(id)?.focus({ preventScroll: true });
                  }}
                >
                  <span>0{i + 1}</span>
                  {label}
                  <ArrowUpRight size={20} />
                </a>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        <main ref={mainRef} className="threaded-main">
          {opened && <FateThread container={mainRef} />}
          <section className="hero" id="home">
            <div className="hero-editorial">
              <div className="hero-heading">
            {opened && !reduced && (
              <div className="hero-fibers" aria-hidden="true">
                <Suspense fallback={null}>
                  <GhostFibers glowColor="#f3e7ce" lineColor="#ffffff" secondaryColor="#d7bea0"
                    threads={20} layers={1} density={0.25} thickness={0.6} particles={0.2}
                    sparkle={0.45} speed={0.16} rollSpeed={0.04} rotation={-22} scale={1.1}
                    waves={0.6} twist={0.8} flow={0.12} fiberStyle="dots" glow={0.12}
                    brightness={0.7} depthOfField={0.18} grain={0} vignette={0.25}
                    mouseInteraction={false} pulseOnClick={false} hoverEffect="none" dpr={1} />
                </Suspense>
              </div>
            )}
                <motion.div
                  initial={false}
                  animate={{ opacity: opened ? 1 : 0, y: opened ? 0 : 16 }}
                  transition={{
                    duration: reduced ? 0 : 1,
                    delay: reduced ? 0 : 0.15,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <div className="hero-kicker">
                    <span>ЗАПРОШЕННЯ НА ВЕСІЛЛЯ</span>
                    <span className="hero-edition">КИЇВ · 2026</span>
                  </div>
                  <div className="hero-title-scene">
                    <h1 ref={heroTitle} tabIndex={-1} aria-label={c.names}>
                      <SplitText text={c.groom} tag="span" disabled={!opened || reduced} trigger="load" textAlign="inherit" delay={45} duration={0.9} from={{ opacity: 0, y: 26 }} to={{ opacity: 1, y: 0 }} />
                      <i className="name-amp">&amp;</i>
                      <SplitText text={c.bride} tag="span" disabled={!opened || reduced} trigger="load" textAlign="inherit" delay={45} duration={0.9} from={{ opacity: 0, y: 26 }} to={{ opacity: 1, y: 0 }} />
                    </h1>
                  </div>
                  <p className="hero-intro">
                    Усе найважливіше починається
                    <br />з простого <em>«разом»</em>
                  </p>
                  <div className="hero-meta">
                    <span>{dateWithoutYearSuffix.toUpperCase()}</span>
                    <span>РЕСТОРАН «ПРАГА» · КИЇВ</span>
                  </div>
                  <div className="hero-actions">
                    <a href="#letter" className="hero-letter-link">
                      Читати запрошення <ArrowUpRight size={17} />
                    </a>
                  </div>
                </motion.div>
                <span className="hero-handwritten">
                  Наше спільне назавжди
                </span>
              </div>
              <div className="hero-photo">
                <img
                  src={c.images.hero}
                  alt="Щаслива пара на прогулянці серед пагорбів"
                  fetchPriority="high"
                />
                <div className="hero-photo-shade" />
                <span className="photo-number">
                  <NameText text={`А & М · ${dateWithoutYearSuffix.toUpperCase()}`} />
                </span>
                <div className="hero-photo-caption">

                  <p>
                    Історія довжиною
                    <br />
                    <em>у ціле життя</em>
                  </p>
                </div>
                <a
                  href="#letter"
                  className="hero-discover"
                  aria-label="Дізнатися більше"
                >
                  <ArrowDown size={19} />
                </a>
              </div>
            </div>
          </section>
          <motion.section
            {...reveal}
            id="letter"
            tabIndex={-1}
            className="letter section"
          >
            <LightGlints active={opened} />
            <Botanical />
            <span className="eyebrow">ЛИСТ ДЛЯ НАЙДОРОЖЧИХ</span>
            <div className="letter-ornament">
              <span aria-hidden="true" />
              <SecretNote label="Секрет у листі">

                Ми дуже щасливі розділити цей день саме з вами</SecretNote>
              <span aria-hidden="true" />
            </div>
            <h2>
              <NameText text={guest.greeting} />
            </h2>
            <p className="letter-lead">
              Є моменти, які хочеться розділити
              <br className="desktop-break" /> лише з{" "}
              <em>найдорожчими людьми</em>
            </p>
            <p>
              Ми будемо неймовірно щасливі, якщо ви станете частиною дня,
              <br className="desktop-break" />  з якого розпочнеться нова глава
              нашої історії</p>
            <p>
              Запрошуємо вас на наше весілля —{" "}<br />

              свято любові, теплих обіймів і щирого «назавжди»</p>
            <span className="letter-closing">Обіймаємо й дуже чекаємо</span>
            <span className="signature">
              <NameText text={c.signature} />
            </span>
            <svg
              className="signature-line"
              viewBox="0 0 240 35"
              aria-hidden="true"
            >
              <motion.path
                d="M5 24 Q70 6 130 20 T230 12 M110 20 C90 -4 144 -3 125 27 C115 12 102 4 108 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                initial={reduced ? false : { pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                transition={{ duration: 1.8 }}
              />
            </svg>
          </motion.section>
          <section
            className="story-section section"
            id="story"
            tabIndex={-1}
            ref={storyRef}
          >
            <div className="section-top">
              <span className="section-note">Маленькі миті — велика любов</span>
            </div>
            <div className="story-layout">
              <div className="story-photos">
                <svg className="photo-tone-defs" width="0" height="0" aria-hidden="true"><defs><filter id="story-neutral-tone" colorInterpolationFilters="sRGB"><feColorMatrix type="matrix" values="0.99 0 0 0 0 0 0.98 0 0 0 0 0 1.08 0 0 0 0 0 1 0" /></filter></defs></svg>
                <button
                  className="story-photo-main interactive-polaroid"
                  aria-label="Відкрити підпис до фотографії"
                  aria-expanded={photoNote}
                  aria-controls="photo-memory"
                  onClick={() => setPhotoNote(!photoNote)}
                >
                  <span className="polaroid-image">
                    <img
                      src={c.images.story}
                      alt="Ніжні обійми пари на природі"
                      loading="lazy"
                    />
                    {photoNote && (
                      <span className="polaroid-caption" id="photo-memory">
                        <small>{c.story[memory].year}</small>
                        {c.story[memory].title}
                      </span>
                    )}
                  </span>
                  <span className="polaroid-label">
                    {photoNote ? "Наші миті" : "Відкрити спогад"}
                  </span>
                </button>
                <button
                  className="story-photo-small"
                  onClick={() => setMemory((memory + 1) % c.story.length)}
                  aria-label="Наступний спогад"
                >
                  <img
                    src={c.images.moment}
                    alt="Теплий кадр обіймів — руки й обручка"
                    loading="lazy"
                  />
                  <span>
                    ще один спогад <ArrowUpRight size={13} />
                  </span>
                </button>
                <span className="photo-handwritten">там, де ти — мій дім</span>
              </div>
              <div className="story-copy">
                <h2>

                  Наша історія<br />
                  <em>Тільки початок</em>
                </h2>
                <div className="story-tabs" role="tablist" aria-label="Спогади">
                  {c.story.map((s, i) => (
                    <button
                      key={s.year}
                      role="tab"
                      id={"memory-tab-" + i}
                      aria-selected={memory === i}
                      aria-controls="memory-content"
                      tabIndex={memory === i ? 0 : -1}
                      onKeyDown={(e) => {
                        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                          e.preventDefault();
                          const next =
                            (memory + (e.key === "ArrowRight" ? 1 : 3)) % 4;
                          setMemory(next);
                          document
                            .getElementById("memory-tab-" + next)
                            ?.focus();
                        }
                      }}
                      onClick={() => setMemory(i)}
                    >
                      {s.year}
                    </button>
                  ))}
                </div>
                <AnimatePresence mode="wait">
                  <motion.div
                    className="memory-content"
                    key={memory}
                    id="memory-content"
                    role="tabpanel"
                    aria-labelledby={"memory-tab-" + memory}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                  >
                    <h3>{c.story[memory].title}</h3>
                    <p>{c.story[memory].text}</p>
                  </motion.div>
                </AnimatePresence>
                <button
                  className="text-button memory-turn"
                  onClick={() => setMemory((memory + 1) % 4)}
                >
                  Перегорнути сторінку <ArrowRight size={17} />
                </button>
                <p className="demo-story-note">

                  Наша уявна історія для цього демозапрошення</p>
              </div>
            </div>
          </section>
          <section className="date-section section" id="date" tabIndex={-1}>
            <motion.div {...reveal} className="date-main">
              <div>
                <h2>

                  Один день<br />
                  <em>На все життя</em>
                </h2>
                <p>
                  {dateText}
                  <br />
                  <span className="capitalize">{ceremonyWeekday}</span> ·
                  початок церемонії о {ceremonyTime}
                </p>
                <button className="button outline" onClick={downloadCalendar}>
                  <CalendarDays size={16} /> Додати в календар{" "}
                  <ArrowUpRight size={15} />
                </button>
              </div>
              <div className="calendar" aria-label="Календар весілля">
                <div className="calendar-title">
                  <span className="capitalize">{calendarInfo.monthName}</span>
                  <small>{calendarInfo.year}</small>
                </div>
                <div className="calendar-grid">
                  {["ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "НД"].map((d) => (
                    <span key={d} className="weekday">
                      {d}
                    </span>
                  ))}
                  {Array.from({ length: calendarInfo.offset }, (_, i) => (
                    <span key={"blank" + i} />
                  ))}
                  {Array.from({ length: calendarInfo.days }, (_, i) =>
                    i + 1 === calendarInfo.day ? (
                      <CalendarDate key={i} day={i + 1} active={opened} />
                    ) : <span key={i}>{i + 1}</span>,
                  )}
                </div>
                <span className="calendar-foot">НАША УЛЮБЛЕНА ДАТА ♡</span>
              </div>
            </motion.div>
            <div className="date-keepsake">
              <svg className="date-flourish" viewBox="0 0 240 70" aria-hidden="true"><path d="M10 45 C45 14 89 63 119 34 C144 10 122 2 110 18 C93 42 148 62 174 35 C186 22 181 13 174 18 C161 31 196 51 230 27" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" /></svg>
              <RingInteraction active={opened} />
              <SecretNote label="Секрет нашого назавжди">

                Назавжди починається з маленького «так» щодня</SecretNote>
            </div>
            <Countdown />
          </section>
          <section
            className="schedule-section section"
            id="schedule"
            tabIndex={-1}
          >
            <motion.div {...reveal} className="centered-heading">
              <h2>
                Програма <em>нашого дня</em>
              </h2>
              <p>Від першої зустрічі до останнього танцю</p>
            </motion.div>
            <div className="schedule-layout">
              <div className="schedule-photo image-reveal">
                <img
                  src={c.images.table}
                  alt="Натхнення для свята: елегантне сервірування весільного столу"
                  loading="lazy"
                />
                <span>
                  Нехай цей вечір
                  <br />
                  <em>триває трохи довше</em>
                </span>
              </div>
              <div className="timeline">
                {c.schedule.map((s, i) => {
                  const Icon = [
                    Wine,
                    Heart,
                    Utensils,
                    Music2,
                    Sparkles,
                    CakeSlice,
                  ][i % 6];
                  return (
                    <motion.div
                      {...reveal}
                      key={s.time}
                      className="timeline-item"
                    >
                      <span className="timeline-time">{s.time}</span>
                      <span className="timeline-icon">
                        <Icon size={18} strokeWidth={1} />
                      </span>
                      <div>
                        <h3>{s.title}</h3>
                        <p>{s.text}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </section>
          <section
            className="dress-section section"
            id="dresscode"
            tabIndex={-1}
          >
            <motion.div {...reveal}>
              <h2>
                Елегантність
                <br />
                <em>у кожній деталі</em>
              </h2>
              <div className="dress-content">
                <div>
                  <span className="dress-label">ДРЕСКОД</span>
                  <h3>Вечірня елегантність</h3>
                  <p>

                    Нам буде дуже приємно, якщо ви підтримаєте атмосферу нашого
                    свята елегантними образами у відтінках нашої палітри</p>
                  <p className="dress-tip">

                    Вечірня сукня або костюм, смокінг — за бажанням; для
                    прохолодного листопада захопіть тепле пальто, а для танців —
                    зручне взуття</p>
                </div>
                <div className="palette">
                  {c.colors.map((color) => (
                    <div className="swatch" key={color.name}>
                      <div style={{ background: color.hex }} />
                      <span>{color.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="dress-bottom">
                <span>

                  ТЕПЛІ ВІДТІНКИ — ПРИРОДНІ ФАКТУРИ — ВАША ІНДИВІДУАЛЬНІСТЬ</span>
                <Heart size={15} />
              </div>
            </motion.div>
          </section>
          <section className="venue-section section" id="venue" tabIndex={-1}>
            <motion.div {...reveal} className="venue-layout">
              <div className="venue-art image-reveal">
                <span className="eyebrow">КИЇВ · ГОЛОСІЇВСЬКИЙ ПАРК</span>
                <svg
                  viewBox="0 0 600 400"
                  fill="none"
                  aria-label="Художня ілюстрація класичного фасаду, не точний план ресторану"
                  role="img"
                >
                  <g stroke="currentColor" strokeWidth="1.2">
                    <path d="M80 324H520M100 315H500V178H100ZM90 178H510L300 90Z M130 158H470L300 111ZM113 184H487M113 195H487M125 295H475M113 304H487" />
                    <path d="M150 200V289M170 200V289M210 200V289M230 200V289M370 200V289M390 200V289M430 200V289M450 200V289M140 199H180M140 291H180M200 199H240M200 291H240M360 199H400M360 291H400M420 199H460M420 291H460" />
                    <path d="M270 300V232C270 191 330 191 330 232V300M300 209V300M270 247H330M100 238H70V312M500 238H530V312M35 326C51 266 48 220 43 184M43 247C1 236 9 210 21 202C40 205 49 227 43 247M45 220C85 208 76 185 62 181C47 187 43 207 45 220M550 326C540 272 551 233 563 212M552 261C522 244 528 223 540 219C553 227 556 246 552 261M555 242C585 240 590 217 580 208C562 209 552 225 555 242" />
                    <ellipse cx="300" cy="140" rx="14" ry="15" />
                    <path d="M300 128V151M290 139H309M212 345C270 336 330 335 390 345M240 356C280 350 322 350 363 356" />
                  </g>
                </svg>
                <span className="venue-art-name">Прага</span>
                <span className="art-note">
                  ХУДОЖНЄ НАТХНЕННЯ · НЕ ПЛАН БУДІВЛІ
                </span>
              </div>
              <div className="venue-copy">
                <h2>
                  Місце
                  <br />
                  <em>святкування</em>
                </h2>
                <h3>{c.venue}</h3>
                <p>
                  <MapPin size={16} />
                  {c.address}
                </p>
                <p>
                  {dateText} · збір гостей о {c.schedule[0].time}
                </p>
                <div className="venue-actions">
                <a
                  className="button dark"
                  href={
                    "https://www.google.com/maps/dir/?api=1&destination=" +
                    encodeURIComponent(c.venue + " " + c.address)
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  Прокласти маршрут <ArrowUpRight size={17} />
                </a>
                <a
                  className="text-button"
                  href={c.website}
                  target="_blank"
                  rel="noreferrer"
                >
                  Сайт ресторану <ArrowUpRight size={15} />
                </a>
                </div>
              </div>
            </motion.div>
          </section>
          <section className="rsvp-section section" id="rsvp" tabIndex={-1}>
            <motion.div {...reveal} className="rsvp-layout">
              <div className="rsvp-intro">
                <h2>
                  Ви будете
                  <br />
                  <em>з нами?</em>
                </h2>
                <p>
                  Будь ласка, повідомте нам про ваше рішення
                  до {c.deadline}
                </p>
                <div className="rsvp-stamp">
                  <Heart size={28} strokeWidth={1} />
                  <span>З ЛЮБОВ’Ю</span>
                </div>
              </div>
              <RSVP key={guest.id + "-" + rsvpKey} guest={guest} />
            </motion.div>
          </section>
          <StarWishes key={guest.id} guestId={guest.id} />
        </main>
        <footer className="footer">
          <img className="footer-photo" src={c.images.footer} alt="" aria-hidden="true" loading="lazy" />
          <LightGlints active={opened} />
          <span className="eyebrow">
            У КОЖНІЙ ІСТОРІЇ ЛЮБОВІ Є ДЕНЬ, ЯКИЙ ЗМІНЮЄ ВСЕ
          </span>
          <h2>
            Чекаємо на вас
            <br />
            <em>із любов’ю</em>
          </h2>
          <span className="footer-names">
            <NameText text={c.names} />
          </span>
          <div className="footer-bottom">
            <span>{dateWithoutYearSuffix.toUpperCase()} · КИЇВ</span>
            <button className="text-button" onClick={replay}>
              <RotateCcw size={13} /> Відкрити запрошення ще раз
            </button>
            <span>СТВОРЕНО З ЛЮБОВ’Ю ♡</span>
          </div>
        </footer>
        {import.meta.env.DEV && (
          <DevPanel
            guest={guest}
            replay={replay}
            clear={() => setRsvpKey((k) => k + 1)}
          />
        )}
      </div>
    </MotionConfig>
  );
}
export default App;
