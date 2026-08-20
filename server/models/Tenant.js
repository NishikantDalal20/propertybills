import mongoose from 'mongoose';

const tenantSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  phone: String,
  email: String,
  unitId: { type: mongoose.Schema.Types.ObjectId, ref: 'RentalUnit' },
  moveInDate: Date,
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

export default mongoose.model('Tenant', tenantSchema);