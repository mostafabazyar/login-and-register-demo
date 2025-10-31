import { Request, Response } from "express";
import prisma from "../prismaClient";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

interface JwtPayload {
  userId: number;
}

const generateToken = (user: { id: number }): string => {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not defined");
  return jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// ✅ Register
export const register = async (req: Request, res: Response) => {
  try {
    const { name, family, username, password, confirmPassword, phone, email } = req.body;

    if (!name || !family || !username || !password || !confirmPassword || !email)
      return res.status(400).json({ error: "Missing required fields" });

    if (password !== confirmPassword)
      return res.status(400).json({ error: "Passwords do not match" });

    const existing = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    });
    if (existing)
      return res.status(400).json({ error: "Username or email already in use" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, family, username, password: hashed, phone, email },
    });

    const token = generateToken(user);
    res.json({
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        family: user.family,
        email: user.email,
      },
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ Login
export const login = async (req: Request, res: Response) => {
  try {
    const { usernameOrEmail, password } = req.body;
    if (!usernameOrEmail || !password)
      return res.status(400).json({ error: "Missing credentials" });

    const user = await prisma.user.findFirst({
      where: { OR: [{ username: usernameOrEmail }, { email: usernameOrEmail }] },
    });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ error: "Invalid credentials" });

    const token = generateToken(user);
    res.json({
      user: { id: user.id, username: user.username, email: user.email },
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ Get profile
export const me = async (req: Request & { user?: JwtPayload }, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, name: true, family: true, username: true, email: true, phone: true },
    });
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ Create game (returns game ID + game list)
export const createGame = async (req: Request & { user?: JwtPayload }, res: Response) => {
  try {
    const { score = 0, level = 1 } = req.body;

    const game = await prisma.game.create({
      data: { score: Number(score), level: Number(level), userId: req.user!.userId },
    });

    const games = await prisma.game.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: "desc" },
      select: { id: true, score: true, level: true, createdAt: true },
    });

    res.json({
      message: "Game created successfully",
      gameId: game.id,
      games, // list for Unity
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ List games (for Unity)
export const listGames = async (req: Request & { user?: JwtPayload }, res: Response) => {
  try {
    const games = await prisma.game.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: "desc" },
      select: { id: true, score: true, level: true, createdAt: true },
    });

    res.json({
      userId: req.user!.userId,
      totalGames: games.length,
      games,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
