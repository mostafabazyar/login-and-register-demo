import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";
import cors from "cors";

import authRoutes from "./routes/auth";
import updateRoutes from "./routes/updateRoute";

const app = express();

// ✅ Middlewares
app.use(cors());
app.use(express.json());

// ✅ Routes
app.use("/auth", authRoutes);
app.use("/update", updateRoutes);

// ✅ Root route
app.get("/", (req: Request, res: Response) => {
  res.json({ ok: true, message: "Node.js + Prisma Auth Server (TypeScript)" });
});

// ✅ Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server started on port ${PORT}`));
