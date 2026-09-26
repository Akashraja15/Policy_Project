import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  firstName: String,
  dob: String,
  address: String,
  phone: String,
  state: String,
  zip: String,
  email: {
    type: String,
    index: true
  },
  gender: String,
  userType: String,
  agentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Agent"
  }
});

export default mongoose.model("User", userSchema);