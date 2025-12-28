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
  getEventCategories,
} from "../controllers/eventController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { body, param, query } from "express-validator";

// Get categories dynamically from the Event model
const getCategoryOptions = () => {
  try {
    return getEventCategories();
  } catch {
    return [
      "Music",
      "Sports",
      "Arts",
      "Technology",
      "Business",
      "Food",
      "Health",
      "Education",
      "Lifestyle",
      "Environment",
      "Other",
    ];
  }
};

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
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Name is required")
      .isLength({ max: 100 }),
    body("description")
      .trim()
      .notEmpty()
      .withMessage("Description is required")
      .isLength({ max: 1000 }),
    body("date")
      .matches(/^\d{4}-\d{1,2}-\d{1,2}$/)
      .withMessage(
        "Date must be in YYYY-MM-DD format (MM and DD can be 1 or 2 digits)"
      )
      .custom((value) => {
        // Normalize the date format by padding month and day with zeros
        const parts = value.split("-");
        const year = parts[0];
        const month = parts[1].padStart(2, "0");
        const day = parts[2].padStart(2, "0");
        const normalizedDate = `${year}-${month}-${day}T00:00:00.000Z`;

        const date = new Date(normalizedDate);
        if (isNaN(date.getTime())) throw new Error("Invalid date");
        return true;
      }),
    body("time")
      .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("Time must be in HH:MM format (24-hour)"),
    body("location")
      .trim()
      .notEmpty()
      .withMessage("Location is required")
      .isLength({ max: 200 }),
    body("category")
      .isIn(getCategoryOptions())
      .withMessage("Category is invalid"),
  ]),
  createEvent
);
router.put(
  "/:id",
  protect,
  validateRequest([
    param("id").isMongoId().withMessage("Invalid event id"),
    body("name").optional().trim().notEmpty().isLength({ max: 100 }),
    body("description").optional().trim().notEmpty().isLength({ max: 1000 }),
    body("date")
      .optional()
      .matches(/^\d{4}-\d{1,2}-\d{1,2}$/)
      .withMessage(
        "Date must be in YYYY-MM-DD format (MM and DD can be 1 or 2 digits)"
      )
      .custom((value) => {
        // Normalize the date format by padding month and day with zeros
        const parts = value.split("-");
        const year = parts[0];
        const month = parts[1].padStart(2, "0");
        const day = parts[2].padStart(2, "0");
        const normalizedDate = `${year}-${month}-${day}T00:00:00.000Z`;

        const date = new Date(normalizedDate);
        if (isNaN(date.getTime())) throw new Error("Invalid date");
        return true;
      }),
    body("time")
      .optional()
      .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("Time must be in HH:MM format (24-hour)"),
    body("location").optional().trim().notEmpty().isLength({ max: 200 }),
    body("category").optional().isIn(getCategoryOptions()),
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
