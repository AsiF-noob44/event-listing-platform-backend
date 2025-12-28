import express from "express";
import {
  saveEvent,
  unsaveEvent,
  getSavedEvents,
  checkIfSaved,
} from "../controllers/savedEventController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getSavedEvents);
router.get("/check/:eventId", protect, checkIfSaved);
router.post("/:eventId", protect, saveEvent);
router.delete("/:eventId", protect, unsaveEvent);

export default router;
