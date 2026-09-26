import mongoose from "mongoose";

const agentSchema = new mongoose.Schema({
  agentName: {
    type: String,
    required: true,
    unique: true
  }
});

export default mongoose.model("Agent", agentSchema);