import { Router, Request, Response } from "express";
import {
  startSoundGame,
  guessSound,
  getSoundAnswer,
} from "../services/soundService";

const router = Router();

router.post("/start", (req: Request, res: Response) => {
  const { guessLimit = null } = req.body;
  const result = startSoundGame(guessLimit);
  res.json(result);
});

router.post("/guess", (req: Request, res: Response) => {
  const { sessionId, guess } = req.body;
  if (!sessionId || !guess) {
    return res.status(400).json({ error: "sessionId and guess are required" });
  }
  const result = guessSound(sessionId, guess);
  if ("error" in result) {
    return res.status(400).json(result);
  }
  res.json(result);
});

router.get("/answer/:sessionId", (req: Request, res: Response) => {
  const result = getSoundAnswer(req.params.sessionId);
  if ("error" in result) {
    return res.status(404).json(result);
  }
  res.json(result);
});

export default router;
