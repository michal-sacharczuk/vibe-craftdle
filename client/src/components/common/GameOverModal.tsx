import React, { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import { AnswerResponse } from "../../types";

interface GameOverModalProps {
  answer: AnswerResponse;
  won: boolean;
  onPlayAgain: () => void;
}

function fireConfetti() {
  const duration = 2500;
  const end = Date.now() + duration;

  const frame = () => {
    // Left side
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.6 },
      colors: ["#55FF55", "#FFAA00", "#5D9B47"],
    });
    // Right side
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.6 },
      colors: ["#55FF55", "#FFAA00", "#5D9B47"],
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };
  frame();
}

export default function GameOverModal({
  answer,
  won,
  onPlayAgain,
}: GameOverModalProps) {
  const navigate = useNavigate();

  useEffect(() => {
    if (won) {
      fireConfetti();
      // Auto-redirect to home after 4 seconds
      const timer = setTimeout(() => {
        navigate("/");
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [won, navigate]);

  const handleGoHome = useCallback(() => {
    navigate("/");
  }, [navigate]);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="mc-card max-w-sm w-full text-center mx-4">
        <h2 className="font-minecraft text-lg mb-4">
          {won ? (
            <span className="text-mc-green text-2xl animate-bounce inline-block">
              🏆 You Win! 🏆
            </span>
          ) : (
            <span className="text-mc-red">Game Over</span>
          )}
        </h2>

        <div className="mb-4">
          {answer.textureUrl && (
            <img
              src={answer.textureUrl}
              alt={answer.name}
              className="w-16 h-16 mx-auto mb-2 pixelated object-contain"
              style={{ imageRendering: "pixelated" }}
            />
          )}
          <p className="font-minecraft text-sm text-mc-gold mb-2">
            {answer.name}
          </p>
          <a
            href={answer.wikiUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline text-xs"
          >
            View on Minecraft Wiki →
          </a>
        </div>

        {won ? (
          <div className="flex flex-col gap-2">
            <p className="text-mc-gray text-xs font-minecraft">
              Returning to menu...
            </p>
            <button onClick={handleGoHome} className="mc-btn-primary">
              Go Home Now
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <button onClick={onPlayAgain} className="mc-btn-primary">
              Play Again
            </button>
            <button onClick={handleGoHome} className="mc-btn text-xs py-2">
              Back to Menu
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
