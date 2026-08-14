import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['owner', 'tenant'], default: 'owner' }
}, { timestamps: true });

export default mongoose.model('User', userSchema);