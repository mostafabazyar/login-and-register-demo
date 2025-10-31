import { Request, Response } from "express";
import prisma from "../prismaClient";

interface AuthRequest extends Request {
  user?: { userId: number };
}

// ✅ Update user profile
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { name, family, phone, email } = req.body;
    const userId = req.user!.userId;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { name, family, phone, email },
    });

    res.json({ message: "Profile updated successfully", user: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error", detail: err instanceof Error ? err.message : err });
  }
};

// ✅ Update score and level
export const updateGame = async (req: AuthRequest, res: Response) => {
  try {
    const { gameId, score, level } = req.body;
    const userId = req.user!.userId;

    const game = await prisma.game.findUnique({ where: { id: Number(gameId) } });
    if (!game || game.userId !== userId)
      return res.status(403).json({ error: "Not allowed or game not found" });

    const updatedGame = await prisma.game.update({
      where: { id: Number(gameId) },
      data: { score: Number(score) || game.score, level: Number(level) || game.level },
    });

    res.json({ message: "Game updated successfully", game: updatedGame });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error", detail: err instanceof Error ? err.message : err });
  }
};
