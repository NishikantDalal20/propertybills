import mongoose from 'mongoose';

const rentalUnitSchema = new mongoose.Schema({
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  unitNumber: { type: String, required: true },
  unitType: { type: String, enum: ['House', 'Flat', 'Shop', 'Office', 'Room'], required: true },
  rentAmount: { type: Number, required: true },
  meterNumber: { type: String, required: true },
  status: { type: String, enum: ['Occupied', 'Vacant'], default: 'Vacant' }
}, { timestamps: true });

export default mongoose.model('RentalUnit', rentalUnitSchema);