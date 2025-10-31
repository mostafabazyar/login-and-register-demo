import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import updateRoutes from "./routes/updateRoute";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/update", updateRoutes);

app.get("/", (_req: Request, res: Response) => {
  res.json({ ok: true, message: "Node.js + Prisma Auth Server (TS)" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));