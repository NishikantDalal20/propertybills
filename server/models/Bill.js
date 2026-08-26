import mongoose from 'mongoose';

const billSchema = new mongoose.Schema({
  unitId: { type: mongoose.Schema.Types.ObjectId, ref: 'RentalUnit', required: true },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' },
  month: { type: String, required: true },
  invoiceNumber: { type: String, required: true, unique: true },
  rent: Number,
  electricity: Number,
  water: Number,
  maintenance: Number,
  otherCharges: Number,
  discount: { type: Number, default: 0 },
  lateFee: { type: Number, default: 0 },
  totalAmount: Number,
  dueDate: Date,
  status: { type: String, enum: ['Pending', 'Paid', 'Partial', 'Overdue'], default: 'Pending' }
}, { timestamps: true });

export default mongoose.model('Bill', billSchema);