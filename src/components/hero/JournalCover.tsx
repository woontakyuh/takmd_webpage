import { useState } from "react";

interface Props {
  style: React.CSSProperties;
}

export default function JournalCover({ style }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (error) return null;

  return (
    <div
      className="absolute overflow-hidden pointer-events-none"
      style={style}
    >
      <div className="w-full h-full relative group">
        <img
          src="/journal/current-cover.jpg"
          alt="Neurospine Journal"
          className="w-full h-full object-cover transition-[filter] duration-300"
          style={{
            opacity: loaded ? 1 : 0,
            transform: "perspective(800px) rotateY(-3deg)",
            transition: "opacity 0.3s, filter 0.3s",
          }}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          draggable={false}
        />
      </div>
    </div>
  );
}
