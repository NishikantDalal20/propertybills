import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  billId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bill', required: true },
  amountPaid: { type: Number, required: true },
  paymentDate: { type: Date, default: Date.now },
  method: String,
  transactionRef: String
}, { timestamps: true });

export default mongoose.model('Payment', paymentSchema);