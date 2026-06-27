import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 120, // 120 second after 2 minute delete
  },
});

const OtpModel = mongoose.model("otp", otpSchema);

export default OtpModel;