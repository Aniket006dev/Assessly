const mongoose = require('mongoose');
const questionSchema = new mongoose.Schema({
  id: Number, text: { type: String, required: true },
  type: { type: String, default: 'MCQ' },
  difficulty: { type: String, enum: ['easy','medium','hard'], default: 'medium' },
  marks: { type: Number, default: 2 }, options: [String],
}, { _id: false });
const sectionSchema = new mongoose.Schema({
  id: String, title: String, instruction: String, questions: [questionSchema],
}, { _id: false });
const assignmentSchema = new mongoose.Schema({
  teacher:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  group:           { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },
  title:           { type: String, required: true, trim: true },
  subject:         { type: String, required: true, trim: true },
  classGroup:      { type: String, trim: true },
  dueDate:         { type: Date, required: true },
  instructions:    { type: String, default: '' },
  questionTypes:   [String],
  numQuestions:    { type: Number, default: 10 },
  marksPerQuestion:{ type: Number, default: 2 },
  difficulty:      [String],
  totalMarks:      { type: Number, default: 0 },
  duration:        { type: String, default: '2 Hours' },
  status:          { type: String, enum: ['draft','pending','generating','completed','failed'], default: 'draft' },
  jobId:           { type: String, default: null },
  paper:           { title: String, subject: String, duration: String, totalMarks: Number, sections: [sectionSchema] },
  isArchived:      { type: Boolean, default: false },
}, { timestamps: true });
module.exports = mongoose.model('Assignment', assignmentSchema);
