import mongoose from "mongoose";

const accountSchema = new mongoose.Schema({
  accountName: String,

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
});

export default mongoose.model("Account", accountSchema);