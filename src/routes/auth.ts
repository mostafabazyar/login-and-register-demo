import express from "express";
import { register, login, me, createGame, listGames } from "../controllers/authController";
import auth from "../middleware/auth";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", auth, me);
router.post("/game", auth, createGame);
router.get("/games", auth, listGames);

export default router;