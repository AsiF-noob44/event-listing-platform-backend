import SavedEvent from "../models/SavedEvent.js";
import Event from "../models/Event.js";

// @desc    Save an event
// @route   POST /api/saved/:eventId
// @access  Private
export const saveEvent = async (req, res) => {
  try {
    const eventId = req.params.eventId;

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Check if already saved
    const alreadySaved = await SavedEvent.findOne({
      user: req.user.id,
      event: eventId,
    });

    if (alreadySaved) {
      return res.status(400).json({
        success: false,
        message: "Event already saved",
      });
    }

    // Save event
    const savedEvent = await SavedEvent.create({
      user: req.user.id,
      event: eventId,
    });

    res.status(201).json({
      success: true,
      message: "Event saved successfully",
      data: savedEvent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Unsave an event
// @route   DELETE /api/saved/:eventId
// @access  Private
export const unsaveEvent = async (req, res) => {
  try {
    const savedEvent = await SavedEvent.findOneAndDelete({
      user: req.user.id,
      event: req.params.eventId,
    });

    if (!savedEvent) {
      return res.status(404).json({
        success: false,
        message: "Saved event not found",
      });
    }

    res.json({
      success: true,
      message: "Event removed from saved list",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all saved events for user
// @route   GET /api/saved
// @access  Private
export const getSavedEvents = async (req, res) => {\n  try {\n    const savedEvents = await SavedEvent.find({ user: req.user.id })\n      .populate({\n        path: \"event\",\n        populate: { path: \"organizer\", select: \"name email\" },\n      })\n      .sort({ savedAt: -1 });\n\n    // Filter out saved events where the event no longer exists or is past\n    const now = new Date().setHours(0, 0, 0, 0);\n    \n    const validSavedEvents = savedEvents.filter(\n      (saved) => saved.event && new Date(saved.event.date) >= now\n    );\n    \n    const pastSavedEvents = savedEvents.filter(\n      (saved) => saved.event && new Date(saved.event.date) < now\n    );\n\n    res.json({\n      success: true,\n      count: validSavedEvents.length,\n      data: {\n        upcoming: validSavedEvents,\n        past: pastSavedEvents,\n      },\n    });\n  } catch (error) {\n    res.status(500).json({\n      success: false,
      message: error.message,
    });
  }
};

// @desc    Check if event is saved by user
// @route   GET /api/saved/check/:eventId
// @access  Private
export const checkIfSaved = async (req, res) => {
  try {
    const savedEvent = await SavedEvent.findOne({
      user: req.user.id,
      event: req.params.eventId,
    });

    res.json({
      success: true,
      isSaved: !!savedEvent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
