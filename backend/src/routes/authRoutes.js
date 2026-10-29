import { Router } from "express";
import {
  currentUser,
  login,
  logout,
  register,
  updateRole,
  updateProfile,
  listAccounts,
  switchAccount,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { uploadAvatar } from "../middleware/uploadMiddleware.js";

const router = Router();
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", protect, currentUser);
router.get("/accounts", listAccounts);
router.post("/switch", switchAccount);
router.patch("/role", protect, updateRole);
router.patch("/profile", protect, uploadAvatar, updateProfile);
export default router;
