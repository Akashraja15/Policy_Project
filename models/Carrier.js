import mongoose from "mongoose";

const carrierSchema = new mongoose.Schema({
  companyName: {
    type: String,
    unique: true
  }
});

export default mongoose.model("Carrier", carrierSchema);