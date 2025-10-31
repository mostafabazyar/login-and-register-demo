import { Request, Response } from "express";
import prisma from "../prismaClient";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

interface JwtPayload {
  userId: number;
}
interface AuthRequest extends Request {
  user?: JwtPayload;
}

/* ---------- helpers ---------- */
const generateToken = (userId: number): string => {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET missing");
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

const selectUser = {
  id: true,
  username: true,
  name: true,
  family: true,
  email: true,
  phone: true,
};

const selectGame = {
  id: true,
  score: true,
  level: true,
  createdAt: true,
};

/* ---------- register (user + first game) ---------- */
export const register = async (req: Request, res: Response) => {
  try {
    const { name, family, username, password, confirmPassword, phone, email } = req.body;

    // --- validation ---
    if (!name || !family || !username || !password || !confirmPassword || !email) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    // --- check duplicate ---
    const existing = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    });
    if (existing) {
      return res.status(400).json({ error: "Username or email already in use" });
    }

    const hashed = await bcrypt.hash(password, 10);

    // --- 1. Create user ---
    const user = await prisma.user.create({
      data: { name, family, username, password: hashed, phone, email },
      select: selectUser,
    });

    // --- 2. Create first game (score:0, level:0) ---
    const firstGame = await prisma.game.create({
      data: {
        userId: user.id,
        score: 0,
        level: 0,
      },
      select: selectGame,
    });

    const token = generateToken(user.id);

    return res.json({
      user,
      games: [firstGame],
      token,
    });
  } catch (err: any) {
    console.error("Register error:", err);

    // Prisma unique constraint violation
    if (err.code === "P2002") {
      return res.status(400).json({ error: "Username or email already exists" });
    }

    return res.status(500).json({ error: "Server error" });
  }
};

/* ---------- login (with games) ---------- */
export const login = async (req: Request, res: Response) => {
  try {
    const { usernameOrEmail, password } = req.body;
    if (!usernameOrEmail || !password) {
      return res.status(400).json({ error: "Missing credentials" });
    }

    // 1. Find user + password (id is in selectUser)
    const userWithPassword = await prisma.user.findFirst({
      where: { OR: [{ username: usernameOrEmail }, { email: usernameOrEmail }] },
      select: {
        password: true,     // ← only add password
        ...selectUser,      // ← includes id, username, name, etc.
      },
    });

    if (!userWithPassword) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // 2. Verify password
    const match = await bcrypt.compare(password, userWithPassword.password);
    if (!match) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // 3. Remove password
    const { password: _, ...user } = userWithPassword;

    // 4. Get all games
    const games = await prisma.game.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: selectGame,
    });

    const token = generateToken(user.id);

    return res.json({
      user,
      games,
      token,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

/* ---------- me (profile) ---------- */
export const me = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: selectUser,
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json({ user });
  } catch (err) {
    console.error("Me error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

/* ---------- create extra game ---------- */
export const createGame = async (req: AuthRequest, res: Response) => {
  try {
    const { score = 0, level = 0 } = req.body;

    const game = await prisma.game.create({
      data: {
        score: Number(score),
        level: Number(level),
        userId: req.user!.userId,
      },
      select: selectGame,
    });

    const games = await prisma.game.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: "desc" },
      select: selectGame,
    });

    return res.json({ message: "Game created", gameId: game.id, games });
  } catch (err) {
    console.error("CreateGame error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

/* ---------- list games ---------- */
export const listGames = async (req: AuthRequest, res: Response) => {
  try {
    const games = await prisma.game.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: "desc" },
      select: selectGame,
    });

    return res.json({
      userId: req.user!.userId,
      totalGames: games.length,
      games,
    });
  } catch (err) {
    console.error("ListGames error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};