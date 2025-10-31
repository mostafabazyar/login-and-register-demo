import express from "express";
import { updateProfile, updateGame } from "../controllers/updateController";
import auth from "../middleware/auth";

const router = express.Router();

router.put("/profile", auth, updateProfile);
router.put("/game", auth, updateGame);

export default router;