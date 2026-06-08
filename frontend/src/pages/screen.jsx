import { useState } from "react";
import "./screen.css";
const screenshots = ["/images/Architecture.png", "/images/handbook.png"];

export default function ScreenshotsPage() {
  const [selected, setSelected] = useState(null);

  return (
    <div className="page">
      <h1>Application Screenshots</h1>

      <div className="gallery">
        {screenshots.map((src, index) => (
          <img
            key={index}
            src={src}
            alt={`Screenshot ${index + 1}`}
            onClick={() => setSelected(src)}
          />
        ))}
      </div>

      {selected && (
        <div className="overlay" onClick={() => setSelected(null)}>
          <img src={selected} alt="Fullscreen" className="fullscreen" />
        </div>
      )}
    </div>
  );
}
