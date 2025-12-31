import Event from "../models/Event.js";
import SavedEvent from "../models/SavedEvent.js";

// Export categories for use in routes
export const getEventCategories = () => {
  return Event.schema.path("category").enumValues || [];
};

// @desc    Get all events
// @route   GET /api/events
// @access  Public
export const getAllEvents = async (req, res) => {
  try {
    const { category, location, search, includePast } = req.query;
    const now = new Date();
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 10, 1),
      50
    );

    let query = {};

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by location
    if (location) {
      query.location = { $regex: location, $options: "i" };
    }

    // Search by name
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    // Exclude past events by default
    if (includePast !== "true") {
      query.date = { $gte: now };
    }

    const total = await Event.countDocuments(query);

    const events = await Event.find(query)
      .populate("organizer", "name email")
      .sort({ date: 1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      count: events.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: events,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single event by ID
// @route   GET /api/events/:id
// @access  Public
export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate(
      "organizer",
      "name email"
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    res.json({
      success: true,
      data: event,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create new event
// @route   POST /api/events
// @access  Private
export const createEvent = async (req, res) => {
  try {
    const { name, description, date, time, location, category } = req.body;

    // Parse date components
    const dateParts = date.split("-");
    const year = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1; // JavaScript months are 0-indexed
    const day = parseInt(dateParts[2], 10);

    // Parse time components
    const [hours, minutes] = time.split(":").map(Number);

    // Create event datetime using explicit constructor (local timezone)
    const eventDateTime = new Date(year, month, day, hours, minutes, 0, 0);

    // Require a practical buffer to avoid near-immediate past events
    const minimumLeadTimeMs = 60 * 60 * 1000; // 60 minutes
    const minimumAllowedTime = new Date(Date.now() + minimumLeadTimeMs);

    if (eventDateTime.getTime() <= minimumAllowedTime.getTime()) {
      return res.status(400).json({
        success: false,
        message: "Event must be at least 60 minutes in the future",
      });
    }

    const event = await Event.create({
      name,
      description,
      date: eventDateTime, // Store full UTC datetime for accurate comparisons
      time,
      location,
      category,
      organizer: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: event,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private
export const updateEvent = async (req, res) => {
  try {
    let event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Check if user is the organizer
    if (event.organizer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this event",
      });
    }

    // If updating date or time, validate the combined datetime is in the future
    if (req.body.date || req.body.time) {
      const existingDate = new Date(event.date);

      let year, month, day;
      if (req.body.date) {
        const dateParts = req.body.date.split("-");
        year = parseInt(dateParts[0], 10);
        month = parseInt(dateParts[1], 10) - 1; // JavaScript months are 0-indexed
        day = parseInt(dateParts[2], 10);
      } else {
        year = existingDate.getFullYear();
        month = existingDate.getMonth();
        day = existingDate.getDate();
      }

      const eventTime = req.body.time || event.time;
      const [hours, minutes] = eventTime.split(":").map(Number);

      // Create event datetime using explicit constructor (local timezone)
      const eventDateTime = new Date(year, month, day, hours, minutes, 0, 0);

      const minimumLeadTimeMs = 60 * 60 * 1000; // 60 minutes
      const minimumAllowedTime = new Date(Date.now() + minimumLeadTimeMs);

      if (eventDateTime.getTime() <= minimumAllowedTime.getTime()) {
        return res.status(400).json({
          success: false,
          message: "Event must be at least 60 minutes in the future",
        });
      }

      // Persist full datetime for accurate future/past checks
      req.body.date = eventDateTime;
    }

    event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      data: event,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Check if user is the organizer
    if (event.organizer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this event",
      });
    }

    await event.deleteOne();

    res.json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get user's created events
// @route   GET /api/events/user/my-events
// @access  Private
export const getUserEvents = async (req, res) => {
  try {
    const allEvents = await Event.find({ organizer: req.user.id }).sort({
      date: 1,
    });

    const now = new Date();

    const upcomingEvents = allEvents.filter(
      (event) => new Date(event.date) >= now
    );
    const pastEvents = allEvents.filter((event) => new Date(event.date) < now);

    res.json({
      success: true,
      count: allEvents.length,
      data: {
        upcoming: upcomingEvents,
        past: pastEvents,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get categories list
// @route   GET /api/events/categories
// @access  Public
export const getCategories = async (_req, res) => {
  try {
    const categories = Event.schema.path("category").enumValues || [];

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get user stats (created count, saved count)
// @route   GET /api/events/user/stats
// @access  Private
export const getUserStats = async (req, res) => {
  try {
    const now = new Date();

    const [totalCreated, upcomingCreated, pastCreated, savedCount] =
      await Promise.all([
        Event.countDocuments({ organizer: req.user.id }),
        Event.countDocuments({ organizer: req.user.id, date: { $gte: now } }),
        Event.countDocuments({ organizer: req.user.id, date: { $lt: now } }),
        SavedEvent.countDocuments({ user: req.user.id }),
      ]);

    res.json({
      success: true,
      data: {
        createdCount: totalCreated,
        upcomingCount: upcomingCreated,
        pastCount: pastCreated,
        savedCount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
