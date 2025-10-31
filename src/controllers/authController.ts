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

/* ---------- register ---------- */
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

    // ---- create user + first game in ONE transaction ----
    const [user, _] = await prisma.$transaction([
      prisma.user.create({
        data: { name, family, username, password: hashed, phone, email },
        select: selectUser,
      }),
      prisma.game.create({
        data: { userId: 0, score: 0, level: 0 }, // userId will be replaced in the transaction
      }),
    ]);

    // replace placeholder game with real userId
    const firstGame = await prisma.game.update({
      where: { id: _.id },
      data: { userId: user.id },
      select: selectGame,
    });

    const token = generateToken(user.id);

    res.json({
      user,
      games: [firstGame], // Unity receives the initial game right away
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

/* ---------- login ---------- */
/* ---------- login ---------- */
export const login = async (req: Request, res: Response) => {
  try {
    const { usernameOrEmail, password } = req.body;
    if (!usernameOrEmail || !password)
      return res.status(400).json({ error: "Missing credentials" });

    // Step 1: Find user WITH password (but don't return it)
    const userWithPassword = await prisma.user.findFirst({
      where: { OR: [{ username: usernameOrEmail }, { email: usernameOrEmail }] },
      select: {
        id: true,
        password: true, // we need this for bcrypt.compare
        username: true,
        name: true,
        family: true,
        email: true,
        phone: true,
      },
    });

    if (!userWithPassword) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Step 2: Compare password
    const ok = await bcrypt.compare(password, userWithPassword.password);
    if (!ok) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Step 3: Remove password before sending to client
    const { password: _, ...user } = userWithPassword; // destructuring to exclude password

    // Step 4: Fetch games
    const games = await prisma.game.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: selectGame,
    });

    const token = generateToken(user.id);

    res.json({
      user,
      games,
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
/* ---------- me (profile) ---------- */
export const me = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: selectUser,
    });
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

/* ---------- create extra game (optional) ---------- */
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

    res.json({ message: "Game created", gameId: game.id, games });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
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

    res.json({ userId: req.user!.userId, totalGames: games.length, games });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};