import { getSounds, getMobs } from "../data/dataLoader";
import {
  createSession,
  getSession,
  getGuessesRemaining,
} from "./sessionService";
import {
  SoundEntry,
  SoundStartResponse,
  SoundGuessResponse,
  AnswerResponse,
} from "../types";

function getRandomSound(): SoundEntry {
  const sounds = getSounds();
  return sounds[Math.floor(Math.random() * sounds.length)];
}

function findSoundByEntityId(entityId: string): SoundEntry | undefined {
  return getSounds().find((s) => s.entityId === entityId);
}

export function startSoundGame(guessLimit: number | null): SoundStartResponse {
  const sound = getRandomSound();
  const sessionId = createSession("sound", sound.entityId, guessLimit);

  return {
    sessionId,
    guessLimit,
    guessesRemaining: guessLimit,
    soundUrl: sound.soundFile,
  };
}

export function guessSound(
  sessionId: string,
  guessName: string,
): SoundGuessResponse | { error: string } {
  const session = getSession(sessionId);
  if (!session) return { error: "Session not found" };
  if (session.solved) return { error: "Game already completed" };

  const remaining = getGuessesRemaining(session);
  if (remaining !== null && remaining <= 0)
    return { error: "No guesses remaining" };

  const targetSound = findSoundByEntityId(session.targetId);
  if (!targetSound) return { error: "Sound not found" };

  session.guesses.push(guessName);

  const correct = guessName.toLowerCase() === targetSound.name.toLowerCase();
  if (correct) session.solved = true;

  return {
    correct,
    guessesRemaining: getGuessesRemaining(session),
  };
}

export function getSoundAnswer(
  sessionId: string,
): AnswerResponse | { error: string } {
  const session = getSession(sessionId);
  if (!session) return { error: "Session not found" };

  const targetSound = findSoundByEntityId(session.targetId);
  if (!targetSound) return { error: "Sound not found" };

  session.solved = true;

  // Get mob info for texture
  const mob = getMobs().find((m) => m.id === targetSound.entityId);

  return {
    id: targetSound.entityId,
    name: targetSound.name,
    textureUrl: mob?.textureUrl || "",
    wikiUrl:
      mob?.wikiUrl ||
      `https://minecraft.wiki/w/${targetSound.name.replace(/ /g, "_")}`,
  };
}
