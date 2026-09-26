import mongoose from "mongoose";

const policySchema = new mongoose.Schema({
  policyNumber: {
    type: String,
    unique: true
  },

  policyStartDate: String,

  policyEndDate: String,

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Account"
  },

  lobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "LOB"
  },

  carrierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Carrier"
  }
});

export default mongoose.model("Policy", policySchema);