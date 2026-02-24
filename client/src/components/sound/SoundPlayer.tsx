import React, { useRef, useState } from "react";

interface SoundPlayerProps {
  soundUrl: string;
}

export default function SoundPlayer({ soundUrl }: SoundPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(false);

  function handlePlay() {
    if (!audioRef.current) {
      audioRef.current = new Audio(soundUrl);
      audioRef.current.addEventListener("ended", () => setPlaying(false));
      audioRef.current.addEventListener("error", () => {
        setError(true);
        setPlaying(false);
      });
    }
    audioRef.current.currentTime = 0;
    audioRef.current
      .play()
      .then(() => setPlaying(true))
      .catch(() => setError(true));
  }

  function handleStop() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlaying(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-48 h-48 sm:w-56 sm:h-56 bg-mc-dark border-2 border-mc-stone flex items-center justify-center">
        <button
          onClick={playing ? handleStop : handlePlay}
          className={`${
            playing ? "mc-btn" : "mc-btn-primary"
          } text-3xl w-20 h-20 flex items-center justify-center rounded-full transition-transform ${
            playing ? "animate-pulse" : "hover:scale-110"
          }`}
          aria-label={playing ? "Stop sound" : "Play sound"}
        >
          {playing ? "⏸" : "▶"}
        </button>
      </div>
      {error ? (
        <span className="font-minecraft text-xs text-mc-red">
          Sound unavailable
        </span>
      ) : (
        <span className="font-minecraft text-xs text-mc-gray">
          {playing ? "Playing..." : "Click to play"}
        </span>
      )}
    </div>
  );
}
