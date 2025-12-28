import mongoose from "mongoose";

const savedEventSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    savedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Prevent duplicate saves
savedEventSchema.index({ user: 1, event: 1 }, { unique: true });

export default mongoose.model("SavedEvent", savedEventSchema);
