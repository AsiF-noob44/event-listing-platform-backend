import express from "express";
import {
  register,
  login,
  logout,
  getMe,
} from "../controllers/userController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { body } from "express-validator";

const router = express.Router();

router.post(
  "/register",
  validateRequest([
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ]),
  register
);
router.post(
  "/login",
  validateRequest([
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ]),
  login
);
router.post("/logout", logout);
router.get("/me", protect, getMe);

export default router;
