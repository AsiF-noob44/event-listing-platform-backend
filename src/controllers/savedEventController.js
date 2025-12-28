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
export const getSavedEvents = async (req, res) => {
  try {
    const savedEvents = await SavedEvent.find({ user: req.user.id })
      .populate({
        path: "event",
        populate: { path: "organizer", select: "name email" },
      })
      .sort({ savedAt: -1 });

    res.json({
      success: true,
      count: savedEvents.length,
      data: savedEvents,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
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
