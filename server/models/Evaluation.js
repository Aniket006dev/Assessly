const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  originalName: { type: String, required: true },
  storedName: { type: String, required: true },
  path: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  pages: [{ page: Number, imagePath: String, width: Number, height: Number }],
}, { _id: false });

const boxSchema = new mongoose.Schema({
  page: { type: Number, required: true },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
}, { _id: false });

const questionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  number: { type: String, required: true },
  text: { type: String, default: '' },
  page: { type: Number, default: 1 },
  boundingBox: boxSchema,
  marks: { type: Number, default: 0 },
  parentNumber: { type: String, default: null },
  order: { type: Number, required: true },
}, { _id: false });

const answerSchema = new mongoose.Schema({
  id: { type: String, required: true },
  detectedQuestionNumber: { type: String, default: null },
  pages: [{ type: Number }],
  regions: [boxSchema],
  extractedText: { type: String, default: '' },
  confidence: { type: Number, min: 0, max: 1, default: 0 },
  status: { type: String, enum: ['matched', 'unmatched', 'needs_review'], default: 'needs_review' },
  manuallyEdited: { type: Boolean, default: false },
}, { _id: false });

const mappingSchema = new mongoose.Schema({
  questionId: { type: String, required: true },
  questionNumber: { type: String, required: true },
  answerId: { type: String, default: null },
  confidence: { type: Number, min: 0, max: 1, default: 0 },
  status: { type: String, enum: ['high', 'medium', 'low', 'unanswered', 'unmatched', 'manual'], default: 'unanswered' },
  manuallyEdited: { type: Boolean, default: false },
}, { _id: false });

const gradingSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: false },
  totalMarks: { type: Number, default: 0 },
  obtainedMarks: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  questionsAnswered: { type: Number, default: 0 },
  questionsUnanswered: { type: Number, default: 0 },
  questionsRequiringReview: { type: Number, default: 0 },
  items: [{
    questionId: String,
    marksObtained: Number,
    maxMarks: Number,
    correctness: String,
    feedback: String,
    modelAnswer: String,
    rubric: [{ criterion: String, marks: Number }],
    incorrectStatements: [String],
    missingConcepts: [String],
    irrelevantContent: [String],
    contradictions: [String],
    unsupportedClaims: [String],
    validatedDeductions: [String],
    consistencyFindings: [String],
    confidence: { type: Number, min: 0, max: 1, default: 0 },
    needsReview: { type: Boolean, default: false },
  }],
}, { _id: false });

const stageSchema = new mongoose.Schema({
  key: { type: String, required: true },
  label: { type: String, required: true },
  status: { type: String, enum: ['pending', 'active', 'complete', 'failed'], default: 'pending' },
  startedAt: Date,
  completedAt: Date,
  message: String,
}, { _id: false });

const evaluationSchema = new mongoose.Schema({
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true },
  subject: { type: String, trim: true, default: '' },
  referenceMaterial: { type: String, trim: true, default: '', maxlength: 30000 },
  questionPaper: fileSchema,
  answerSheet: fileSchema,
  questions: [questionSchema],
  answers: [answerSchema],
  mappings: [mappingSchema],
  grading: { type: gradingSchema, default: () => ({}) },
  approvedAt: Date,
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  processingStatus: {
    state: { type: String, enum: ['uploaded', 'processing', 'completed', 'failed', 'partial'], default: 'uploaded' },
    progress: { type: Number, min: 0, max: 100, default: 0 },
    currentStage: { type: String, default: 'uploaded' },
    stages: [stageSchema],
    error: String,
  },
  isArchived: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Evaluation', evaluationSchema);
