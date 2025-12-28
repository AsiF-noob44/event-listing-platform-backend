import express from "express";
import {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getUserEvents,
  getCategories,
  getUserStats,
} from "../controllers/eventController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { body, param, query } from "express-validator";

const CATEGORY_OPTIONS = [
  "Music",
  "Sports",
  "Arts",
  "Technology",
  "Business",
  "Food",
  "Health",
  "Education",
  "Lifestyle",
  "Other",
];

const router = express.Router();

router.get(
  "/",
  validateRequest([
    query("page").optional().isInt({ min: 1 }).withMessage("page must be >= 1"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("limit must be between 1 and 50"),
    query("category").optional().isString(),
    query("location").optional().isString(),
    query("search").optional().isString(),
  ]),
  getAllEvents
);

router.get("/categories", getCategories);
router.get("/user/my-events", protect, getUserEvents);
router.get("/user/stats", protect, getUserStats);
router.get(
  "/:id",
  validateRequest([param("id").isMongoId().withMessage("Invalid event id")]),
  getEventById
);
router.post(
  "/",
  protect,
  validateRequest([
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("description")
      .trim()
      .notEmpty()
      .withMessage("Description is required"),
    body("date").isISO8601().toDate().withMessage("Valid date is required"),
    body("time").trim().notEmpty().withMessage("Time is required"),
    body("location").trim().notEmpty().withMessage("Location is required"),
    body("category").isIn(CATEGORY_OPTIONS).withMessage("Category is invalid"),
  ]),
  createEvent
);
router.put(
  "/:id",
  protect,
  validateRequest([
    param("id").isMongoId().withMessage("Invalid event id"),
    body("name").optional().trim().notEmpty(),
    body("description").optional().trim().notEmpty(),
    body("date").optional().isISO8601().toDate(),
    body("time").optional().trim().notEmpty(),
    body("location").optional().trim().notEmpty(),
    body("category").optional().isIn(CATEGORY_OPTIONS),
  ]),
  updateEvent
);
router.delete(
  "/:id",
  protect,
  validateRequest([param("id").isMongoId().withMessage("Invalid event id")]),
  deleteEvent
);

export default router;
