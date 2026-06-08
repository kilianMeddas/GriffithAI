import { useMemo, useRef, useState } from "react";
import "./AnswerAudio.css";

function formatTime(value) {
  if (!Number.isFinite(value) || value <= 0) return "0:00";
  const m = Math.floor(value / 60);
  const s = Math.floor(value % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/* ---------- small inline icons ---------- */
const PlayIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);
const PauseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="5" width="4" height="14" rx="1" />
    <rect x="14" y="5" width="4" height="14" rx="1" />
  </svg>
);
const ReplayIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);
const DownloadIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

/* Deterministic but varied waveform per src — same audio always renders
   the same bar pattern, so it doesn't shuffle on every re-render. */
function makeBars(src, count = 44) {
  const seed = src ? src.length * 9301 + 49297 : 42;
  let s = (seed + 1) >>> 0;
  const out = [];
  for (let i = 0; i < count; i++) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const noise = ((s >>> 8) & 0xffff) / 0xffff;
    // soft sine envelope so it reads as a real waveform, not noise
    const envelope = Math.sin((i / count) * Math.PI) * 0.35 + 0.45;
    out.push(Math.max(0.12, Math.min(0.96, envelope + (noise - 0.5) * 0.45)));
  }
  return out;
}

export default function AnswerAudio({ src, downloadName }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  const bars = useMemo(() => makeBars(src), [src]);

  if (!src) return null;

  const progress = duration ? position / duration : 0;

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) el.play();
    else el.pause();
  };
  const replay = () => {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = 0;
    el.play();
  };
  const seek = (e) => {
    const el = audioRef.current;
    if (!el || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    el.currentTime = Math.max(0, Math.min(duration, pct * duration));
  };

  return (
    <div className={`audio-pro ${isPlaying ? "playing" : ""}`}>
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
        onTimeUpdate={(e) => setPosition(e.currentTarget.currentTime || 0)}
      />

      <button
        className={`play-orb ${isPlaying ? "is-playing" : ""}`}
        onClick={togglePlay}
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? (
          <span className="aiplay-loader" aria-hidden>
            <svg width="100" height="100" viewBox="0 0 100 100">
              <defs>
                <mask id="aiplay-clipping">
                  <polygon points="0,0 100,0 100,100 0,100" fill="black" />
                  <polygon points="25,25 75,25 50,75" fill="white" />
                  <polygon points="50,25 75,75 25,75" fill="white" />
                  <polygon points="35,35 65,35 50,65" fill="white" />
                  <polygon points="35,35 65,35 50,65" fill="white" />
                  <polygon points="35,35 65,35 50,65" fill="white" />
                  <polygon points="35,35 65,35 50,65" fill="white" />
                </mask>
              </defs>
            </svg>
            <span className="aiplay-box" />
          </span>
        ) : (
          <PlayIcon />
        )}
      </button>

      <div className="wave-block">
        <div className="wave-track" onClick={seek} role="slider" tabIndex={0}>
          {bars.map((h, i) => (
            <span
              key={i}
              className={`wave-bar ${i / bars.length < progress ? "played" : ""}`}
              style={{ "--h": `${h * 100}%`, "--i": i }}
            />
          ))}
        </div>
        <div className="wave-meta">
          <span className="audio-label">Voice response</span>
          <span className="time">
            {formatTime(position)}
            <span className="dim"> / {formatTime(duration)}</span>
          </span>
        </div>
      </div>

      <div className="audio-actions">
        <button onClick={replay} aria-label="Replay" title="Replay">
          <ReplayIcon />
        </button>
        {downloadName && (
          <a
            href={src}
            download={downloadName}
            aria-label="Download"
            title="Download"
          >
            <DownloadIcon />
          </a>
        )}
      </div>
    </div>
  );
}
