import { Request, Response } from "express";
import prisma from "../prismaClient";

interface AuthRequest extends Request {
  user?: { userId: number };
}

/* ---------- update profile ---------- */
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { name, family, phone, email } = req.body;
    const userId = req.user!.userId;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { name, family, phone, email },
      select: {
        id: true,
        username: true,
        name: true,
        family: true,
        email: true,
        phone: true,
      },
    });

    res.json({ message: "Profile updated", user: updated });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Server error", detail: err instanceof Error ? err.message : err });
  }
};

/* ---------- update a specific game ---------- */
export const updateGame = async (req: AuthRequest, res: Response) => {
  try {
    const { gameId, score, level } = req.body;
    const userId = req.user!.userId;

    if (!gameId) return res.status(400).json({ error: "gameId required" });

    const game = await prisma.game.findUnique({ where: { id: Number(gameId) } });
    if (!game || game.userId !== userId)
      return res.status(403).json({ error: "Game not found or not owned" });

    const updated = await prisma.game.update({
      where: { id: Number(gameId) },
      data: {
        score: score !== undefined ? Number(score) : game.score,
        level: level !== undefined ? Number(level) : game.level,
      },
      select: { id: true, score: true, level: true, createdAt: true },
    });

    res.json({ message: "Game updated", game: updated });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Server error", detail: err instanceof Error ? err.message : err });
  }
};