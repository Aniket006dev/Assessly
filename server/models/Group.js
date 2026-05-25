const mongoose = require('mongoose');
const groupSchema = new mongoose.Schema({
  teacher:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name:         { type: String, required: true, trim: true },
  subject:      { type: String, trim: true },
  grade:        { type: String, trim: true },
  section:      { type: String, trim: true },
  studentCount: { type: Number, default: 0 },
  color:        { type: String, default: '#E8440A' },
  description:  { type: String, default: '' },
  isActive:     { type: Boolean, default: true },
}, { timestamps: true });
module.exports = mongoose.model('Group', groupSchema);
