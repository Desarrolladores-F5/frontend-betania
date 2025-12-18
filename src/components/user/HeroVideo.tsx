// src/components/user/HeroVideo.tsx
"use client";

import React from "react";

type HeroVideoProps = {
  youtubeId: string;
  poster?: string | null; // ahora es opcional
};

export default function HeroVideo({ youtubeId, poster }: HeroVideoProps) {
  const [loaded, setLoaded] = React.useState(false);

  const videoUrl = `https://www.youtube.com/embed/${youtubeId}?rel=0&showinfo=0&modestbranding=1&playsinline=1&autoplay=1&mute=1&controls=1`;

  return (
    <div className="mt-10 flex justify-center">
      <div className="w-full max-w-4xl rounded-xl overflow-hidden shadow-xl border bg-black relative aspect-video">

        {/* Caso 1: NO hay poster = mostrar YouTube directo */}
        {!poster && (
          <iframe
            src={videoUrl}
            title="Video de presentación"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        )}

        {/* Caso 2: Sí hay poster = mostrarlo antes del click */}
        {poster && !loaded && (
          <div
            className="absolute inset-0 bg-cover bg-center cursor-pointer flex items-center justify-center"
            style={{ backgroundImage: `url(${poster})` }}
            onClick={() => setLoaded(true)}
          >
            <button className="bg-white/80 rounded-full px-6 py-3 text-black font-semibold">
              ▶ Reproducir
            </button>
          </div>
        )}

        {/* Caso 3: Poster existe + usuario clickeó = mostrar iframe */}
        {poster && loaded && (
          <iframe
            src={videoUrl}
            title="Video de presentación"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        )}
      </div>
    </div>
  );
}
