import React, { useState } from "react";
import AutocompleteSearch from "../common/AutocompleteSearch";
import GuessLimitSelector from "../common/GuessLimitSelector";
import GameOverModal from "../common/GameOverModal";
import SoundPlayer from "./SoundPlayer";
import { startSound, guessSound, getSoundAnswer } from "../../services/api";
import { AnswerResponse, SearchResult } from "../../types";

export default function SoundGame() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [guessLimit, setGuessLimit] = useState<number | null>(null);
  const [guessesRemaining, setGuessesRemaining] = useState<number | null>(null);
  const [soundUrl, setSoundUrl] = useState("");
  const [pastGuesses, setPastGuesses] = useState<string[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [answer, setAnswer] = useState<AnswerResponse | null>(null);
  const [error, setError] = useState("");

  async function handleStart() {
    try {
      const res = await startSound(guessLimit);
      setSessionId(res.sessionId);
      setGuessesRemaining(res.guessesRemaining);
      setSoundUrl(res.soundUrl);
      setPastGuesses([]);
      setGameOver(false);
      setWon(false);
      setAnswer(null);
      setError("");
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function handleGuess(item: SearchResult) {
    if (!sessionId || gameOver) return;
    try {
      const res = await guessSound(sessionId, item.name);
      setGuessesRemaining(res.guessesRemaining);
      setPastGuesses((prev) => [...prev, item.name]);

      if (res.correct) {
        setWon(true);
        setGameOver(true);
        const ans = await getSoundAnswer(sessionId);
        setAnswer(ans);
      } else if (res.guessesRemaining !== null && res.guessesRemaining <= 0) {
        setGameOver(true);
        const ans = await getSoundAnswer(sessionId);
        setAnswer(ans);
      }
      setError("");
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function handleGiveUp() {
    if (!sessionId) return;
    setGameOver(true);
    const ans = await getSoundAnswer(sessionId);
    setAnswer(ans);
  }

  function handlePlayAgain() {
    setSessionId(null);
    setPastGuesses([]);
    setGameOver(false);
    setWon(false);
    setAnswer(null);
  }

  if (!sessionId) {
    return (
      <div className="flex flex-col items-center gap-6 py-8">
        <h2 className="font-minecraft text-xl text-mc-gold">Sound Mode</h2>
        <p className="text-mc-gray text-sm max-w-md text-center">
          Listen to a Minecraft sound and identify which mob, block, or item it
          belongs to!
        </p>
        <GuessLimitSelector value={guessLimit} onChange={setGuessLimit} />
        <button onClick={handleStart} className="mc-btn-primary">
          Start Game
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="flex items-center justify-between w-full max-w-md px-4">
        <h2 className="font-minecraft text-sm text-mc-gold">Sound Mode</h2>
        <div className="flex gap-4 items-center">
          {guessesRemaining !== null && (
            <span className="font-minecraft text-xs text-mc-gray">
              Left: <span className="text-mc-gold">{guessesRemaining}</span>
            </span>
          )}
          {!gameOver && (
            <button onClick={handleGiveUp} className="mc-btn text-xs py-1 px-3">
              Give Up
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-mc-red text-xs">{error}</p>}

      <SoundPlayer soundUrl={soundUrl} />

      {pastGuesses.length > 0 && (
        <div className="text-xs text-mc-gray">
          <span className="font-minecraft">Guesses: </span>
          {pastGuesses.map((g, i) => (
            <span key={i} className="text-mc-red mx-1">
              {g}
            </span>
          ))}
        </div>
      )}

      {!gameOver && (
        <AutocompleteSearch
          onSelect={handleGuess}
          placeholder="Guess the sound source..."
        />
      )}

      {gameOver && answer && (
        <GameOverModal
          answer={answer}
          won={won}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </div>
  );
}
