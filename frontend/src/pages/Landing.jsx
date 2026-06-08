/* ==============================================================
   Landing page (/welcome) — the marketing surface.
   Two-column layout: hero copy on the left, three pillar cards
   stacked on the right. Locked to one viewport, no scroll.
   ============================================================== */
import { Link, Navigate } from "react-router-dom";
import BlurText from "../components/BlurText.jsx";
import SpotlightCard from "../components/SpotlightCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import "./Landing.css";

/* ---------- pillar visual designs (left side of each pillar card)
   Each is a pure CSS/SVG composition tied semantically to its pillar:
   stopwatch = speed, equalizer = voice/text, check seal = verified. */
const PILLAR_VISUALS = [
  // 1. Stopwatch — sweeping hand showing "answers in seconds"
  <div className="lv2-pv lv2-pv-design lv2-pv-clock">
    <span className="lv2-pv-clock-halo" />
    <div className="lv2-pv-clock-face">
      {Array.from({ length: 12 }).map((_, i) => (
        <span key={i} className="lv2-pv-clock-tick" style={{ "--i": i }} />
      ))}
      <span className="lv2-pv-clock-hand" />
      <span className="lv2-pv-clock-trail" />
      <span className="lv2-pv-clock-pin" />
      <span className="lv2-pv-clock-readout">~2s</span>
    </div>
  </div>,

  // 2. Equalizer — vertical bars dancing in teal (kept, fits "voice/text")
  <div className="lv2-pv lv2-pv-design lv2-pv-eq">
    <div className="lv2-pv-eq-stage">
      {Array.from({ length: 12 }).map((_, i) => (
        <span key={i} className="lv2-pv-eq-bar" style={{ "--i": i }} />
      ))}
    </div>
    <span className="lv2-pv-eq-line" />
  </div>,

  // 3. Verified check seal — big check badge with rotating notched ring
  <div className="lv2-pv lv2-pv-design lv2-pv-verified">
    <span className="lv2-pv-verified-glow" />
    <span className="lv2-pv-verified-ring" />
    <div className="lv2-pv-verified-badge">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 12l5 5L20 7" />
      </svg>
    </div>
    <span className="lv2-pv-verified-spark s1" />
    <span className="lv2-pv-verified-spark s2" />
    <span className="lv2-pv-verified-spark s3" />
    <span className="lv2-pv-verified-spark s4" />
  </div>,
];

/* ---------- pillar copy — paired by index with PILLAR_VISUALS above ---------- */
const PILLARS = [
  {
    title: "Immediate clarity",
    body: "Obtain a structured answer to any handbook query within seconds.",
  },
  {
    title: "Accessible by voice or text",
    body: "Each response is delivered in written and spoken form, available on demand.",
  },
  {
    title: "Verified content",
    body: "Every answer remains grounded in the official Student Handbook for 2024 to 2025.",
  },
];

export default function Landing() {
  /* already signed in? bounce straight to the chat */
  const { user } = useAuth();
  if (user) return <Navigate to="/ask" replace />;

  return (
    <div className="landing-v2">
      {/* ============ NAV (brand only — CTAs live in the hero) ============ */}
      <header className="lv2-nav">
        <Link to="/" className="lv2-brand">
          <span className="lv2-brand-mark" />
          <span className="lv2-brand-name">GriffithAI</span>
        </Link>
      </header>

      {/* ============ HERO (left column) — headline + lead + CTAs ============
         The headline uses two BlurText components (one per line) so each
         word can animate in independently. */}
      <section className="lv2-hero">
        <div
          className="lv2-hero-title"
          role="heading"
          aria-level={1}
          aria-label="The Griffith College, on demand."
        >
          <BlurText
            text="The Griffith College,"
            delay={120}
            animateBy="words"
            direction="top"
            stepDuration={0.45}
            className="lv2-hero-line"
          />
          <BlurText
            text="on demand."
            delay={160}
            animateBy="words"
            direction="top"
            stepDuration={0.5}
            className="lv2-hero-line lv2-hero-title-grad"
          />
        </div>

        <p className="lv2-hero-lead">
          The Griffith College now has a voice. <em>GriffithAI</em> is a chatbot
          that speaks every answer aloud, with the written transcript ready to
          read.
        </p>

        {/* dual CTA stack: primary (red) to sign-up, secondary (frosted) to sign-in */}
        <div className="lv2-hero-ctas">
          <Link to="/sign-up" className="lv2-action lv2-action-primary">
            <span className="lv2-action-orb" aria-hidden>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
            <span className="lv2-action-body">
              <span className="lv2-action-kicker">Get started</span>
              <span className="lv2-action-label">Hear your first answer</span>
            </span>
            <span className="lv2-action-arrow" aria-hidden>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14" />
                <path d="M13 5l7 7-7 7" />
              </svg>
            </span>
          </Link>

          <Link to="/sign-in" className="lv2-action lv2-action-secondary">
            <span className="lv2-action-orb" aria-hidden>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21a8 8 0 0 1 16 0" />
              </svg>
            </span>
            <span className="lv2-action-body">
              <span className="lv2-action-kicker">Already a member?</span>
              <span className="lv2-action-label">Sign in</span>
            </span>
            <span className="lv2-action-arrow" aria-hidden>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14" />
                <path d="M13 5l7 7-7 7" />
              </svg>
            </span>
          </Link>
        </div>
      </section>

      {/* ============ PILLARS (right column) — 3 stacked feature cards ============
         Each card uses SpotlightCard for a mouse-follow halo, with a per-card
         accent (red / teal / pink) matching its pillar's theme. */}
      <section className="lv2-pillars">
        {PILLARS.map((p, i) => {
          // spotlight halo colour, paired by index with each pillar's theme
          const spotlight = [
            "rgba(196, 18, 48, 0.28)",
            "rgba(0, 160, 176, 0.28)",
            "rgba(240, 133, 150, 0.28)",
          ][i];
          return (
            <SpotlightCard
              key={p.title}
              className={`lv2-pillar lv2-pillar-${i + 1}`}
              spotlightColor={spotlight}
            >
              <div className="lv2-pillar-visual">{PILLAR_VISUALS[i]}</div>
              <div className="lv2-pillar-text">
                <h3 className="lv2-pillar-title">{p.title}</h3>
                <p className="lv2-pillar-body">{p.body}</p>
              </div>
            </SpotlightCard>
          );
        })}
      </section>
    </div>
  );
}
