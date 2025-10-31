import express from "express";
import { updateProfile, updateGame } from "../controllers/updateController";
import auth from "../middleware/auth";

const router = express.Router();

// PUT /update/profile → update user profile
router.put("/profile", auth, updateProfile);

// PUT /update/game → update user game
router.put("/game", auth, updateGame);

export default router;
