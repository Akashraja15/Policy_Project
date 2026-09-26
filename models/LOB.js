import mongoose from "mongoose";

const lobSchema = new mongoose.Schema(
  {
    category_name: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

const LOB = mongoose.model("LOB", lobSchema);

export default LOB;