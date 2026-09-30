import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  otp: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 600 } // Auto-deletes after 10 minutes (600s)
});

export default mongoose.model('OTP', otpSchema);
