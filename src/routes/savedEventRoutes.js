import express from "express";
import {
  saveEvent,
  unsaveEvent,
  getSavedEvents,
  checkIfSaved,
} from "../controllers/savedEventController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { param } from "express-validator";

const router = express.Router();

router.get("/", protect, getSavedEvents);
router.get(
  "/check/:eventId",
  protect,
  validateRequest([
    param("eventId").isMongoId().withMessage("Invalid event id"),
  ]),
  checkIfSaved
);
router.post(
  "/:eventId",
  protect,
  validateRequest([
    param("eventId").isMongoId().withMessage("Invalid event id"),
  ]),
  saveEvent
);
router.delete(
  "/:eventId",
  protect,
  validateRequest([
    param("eventId").isMongoId().withMessage("Invalid event id"),
  ]),
  unsaveEvent
);

export default router;
