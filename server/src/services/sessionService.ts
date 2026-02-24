import { v4 as uuidv4 } from "uuid";
import { GameSession, CraftingSession, TextureSession } from "../types";

const sessions = new Map<
  string,
  GameSession | CraftingSession | TextureSession
>();

// Auto-clean sessions older than 1 hour
const SESSION_TTL = 60 * 60 * 1000;

export function createSession(
  mode: GameSession["mode"],
  targetId: string,
  guessLimit: number | null,
  extra?: Partial<CraftingSession | TextureSession>,
): string {
  const id = uuidv4();
  const session: GameSession = {
    id,
    mode,
    targetId,
    guessLimit,
    guesses: [],
    solved: false,
    createdAt: Date.now(),
    ...extra,
  };
  sessions.set(id, session);
  return id;
}

export function getSession(
  id: string,
): GameSession | CraftingSession | TextureSession | undefined {
  const session = sessions.get(id);
  if (session && Date.now() - session.createdAt > SESSION_TTL) {
    sessions.delete(id);
    return undefined;
  }
  return session;
}

export function updateSession(id: string, updates: Partial<GameSession>): void {
  const session = sessions.get(id);
  if (session) {
    Object.assign(session, updates);
  }
}

export function deleteSession(id: string): void {
  sessions.delete(id);
}

export function getGuessesRemaining(session: GameSession): number | null {
  if (session.guessLimit === null) return null;
  return Math.max(0, session.guessLimit - session.guesses.length);
}
