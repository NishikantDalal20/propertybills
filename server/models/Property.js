import mongoose from 'mongoose';

const propertySchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  address: { type: String, required: true },
  type: { type: String, enum: ['House', 'Flat', 'Shop', 'Office', 'Room'], required: true }
}, { timestamps: true });

export default mongoose.model('Property', propertySchema);