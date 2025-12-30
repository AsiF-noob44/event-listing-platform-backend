import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: String,
      required: true,
      validate: {
        validator: function (value) {
          // Validate HH:MM format (24-hour)
          const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
          return timeRegex.test(value);
        },
        message: "Time must be in HH:MM format (24-hour)",
      },
    },
    location: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    category: {
      type: String,
      required: true,
      enum: [
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
        "Entertainment",
        "Other",
      ],
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual field to check if event is past
eventSchema.virtual("isPast").get(function () {
  const eventDateTime = new Date(this.date);
  const [hours, minutes] = this.time.split(":");
  eventDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  return eventDateTime < new Date();
});

// Index for better query performance
eventSchema.index({ date: 1 });
eventSchema.index({ category: 1, date: 1 });

export default mongoose.model("Event", eventSchema);
