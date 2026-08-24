import mongoose from 'mongoose';

const readingSchema = new mongoose.Schema({
  unitId: { type: mongoose.Schema.Types.ObjectId, ref: 'RentalUnit', required: true },
  month: { type: String, required: true }, // "2026-08"
  previousReading: { type: Number, required: true },
  currentReading: { type: Number, required: true }
}, { timestamps: true });

export default mongoose.model('MeterReading', readingSchema);