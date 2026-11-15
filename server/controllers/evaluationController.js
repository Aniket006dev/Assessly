const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const Evaluation = require('../models/Evaluation');
const { MAX_UPLOAD_BYTES, fileFilter, hasValidFileSignature, toFileRecord } = require('../utils/uploadValidation');
const { initialStages, processEvaluation } = require('../services/evaluationProcessor');

const publicEvaluation = (evaluation) => {
  const data = evaluation.toObject ? evaluation.toObject() : { ...evaluation };
  for (const key of ['questionPaper', 'answerSheet']) {
    if (data[key]) {
      delete data[key].path;
      data[key].pages = (data[key].pages || []).map(({ imagePath, ...page }) => page);
    }
  }
  return data;
};

const uploadDir = path.join(__dirname, '..', 'uploads', 'evaluations');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safeBase = path.basename(file.originalname || 'document', ext)
      .replace(/[^a-z0-9_-]+/gi, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'document';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeBase}${ext}`);
  },
});

const uploadEvaluationFiles = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 2 },
}).fields([
  { name: 'questionPaper', maxCount: 1 },
  { name: 'answerSheet', maxCount: 1 },
]);

const removeUploadedFiles = (files = {}) => Object.values(files).flat().forEach((file) => {
  if (file?.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
});

const fingerprintFile = (file) => new Promise((resolve, reject) => {
  const hash = crypto.createHash('sha256');
  const stream = fs.createReadStream(file.path);
  stream.on('data', (chunk) => hash.update(chunk));
  stream.on('error', reject);
  stream.on('end', () => resolve(hash.digest('hex')));
});

const listEvaluations = async (req, res, next) => {
  try {
    const evaluations = await Evaluation.find({ teacher: req.user._id, isArchived: false })
      .sort({ createdAt: -1 })
      .select('-questions.boundingBox -answers.regions');
    res.json({ success: true, data: evaluations.map(publicEvaluation), total: evaluations.length });
  } catch (err) { next(err); }
};

const getEvaluation = async (req, res, next) => {
  try {
    const evaluation = await Evaluation.findOne({ _id: req.params.id, teacher: req.user._id });
    if (!evaluation) return res.status(404).json({ success: false, message: 'Evaluation not found' });
    res.json({ success: true, data: publicEvaluation(evaluation) });
  } catch (err) { next(err); }
};

const getEvaluationFile = async (req, res, next) => {
  try {
    const evaluation = await Evaluation.findOne({ _id: req.params.id, teacher: req.user._id });
    if (!evaluation) return res.status(404).json({ success: false, message: 'Evaluation not found' });
    const file = req.params.kind === 'question-paper' ? evaluation.questionPaper
      : req.params.kind === 'answer-sheet' ? evaluation.answerSheet : null;
    if (!file?.path) return res.status(404).json({ success: false, message: 'File not found' });
    res.type(file.mimeType);
    res.set('Cache-Control', 'private, no-store');
    res.download(file.path, file.originalName, (error) => {
      if (error && !res.headersSent) next(error);
    });
  } catch (err) { next(err); }
};

const getEvaluationPageImage = async (req, res, next) => {
  try {
    const evaluation = await Evaluation.findOne({ _id: req.params.id, teacher: req.user._id });
    if (!evaluation) return res.status(404).json({ success: false, message: 'Evaluation not found' });
    const file = req.params.kind === 'question-paper' ? evaluation.questionPaper
      : req.params.kind === 'answer-sheet' ? evaluation.answerSheet : null;
    const page = file?.pages?.find((item) => item.page === Number(req.params.page));
    if (!page?.imagePath || !fs.existsSync(page.imagePath)) return res.status(404).json({ success: false, message: 'Rendered page not found' });
    res.type(path.extname(page.imagePath).slice(1) || 'jpeg');
    res.set('Cache-Control', 'private, max-age=300');
    return res.sendFile(page.imagePath, (error) => { if (error && !res.headersSent) next(error); });
  } catch (err) { next(err); }
};

const createEvaluation = async (req, res, next) => {
  uploadEvaluationFiles(req, res, async (uploadErr) => {
    try {
      if (uploadErr) {
        removeUploadedFiles(req.files);
        const message = uploadErr.code === 'LIMIT_FILE_SIZE'
          ? `Each upload must be 25 MB or smaller. (${uploadErr.field || 'File'} exceeded the limit.)`
          : uploadErr.code === 'LIMIT_UNEXPECTED_FILE'
            ? 'Upload one question paper and one answer sheet. Remove extra files and try again.'
            : uploadErr.message;
        return res.status(400).json({ success: false, message });
      }
      const questionPaper = req.files?.questionPaper?.[0];
      const answerSheet = req.files?.answerSheet?.[0];
      if (!questionPaper || !answerSheet) {
        removeUploadedFiles(req.files);
        return res.status(400).json({ success: false, message: 'Upload both a question paper and an answer sheet.' });
      }
      const invalidFile = [questionPaper, answerSheet].find((file) => !hasValidFileSignature(file));
      if (invalidFile) {
        removeUploadedFiles(req.files);
        return res.status(400).json({
          success: false,
          message: `${invalidFile.originalname} does not match its file type. Upload a valid PDF, JPG, PNG, or WebP file.`,
        });
      }
      const [questionPaperHash, answerSheetHash] = await Promise.all([
        fingerprintFile(questionPaper),
        fingerprintFile(answerSheet),
      ]);
      if (questionPaperHash === answerSheetHash) {
        removeUploadedFiles(req.files);
        return res.status(400).json({
          success: false,
          message: 'The question paper and answer sheet are identical. Upload the question paper and a separate student answer sheet.',
        });
      }
      const evaluation = await Evaluation.create({
        teacher: req.user._id,
        title: req.body.title?.trim() || 'Untitled Evaluation',
        subject: req.body.subject?.trim() || '',
        referenceMaterial: String(req.body.referenceMaterial || '').trim().slice(0, 30000),
        grading: { enabled: req.body.gradingEnabled === 'true' },
        questionPaper: toFileRecord(questionPaper),
        answerSheet: toFileRecord(answerSheet),
        processingStatus: {
          state: 'uploaded',
          progress: 8,
          currentStage: 'uploaded',
          stages: initialStages(),
        },
      });
      setImmediate(() => processEvaluation(evaluation._id.toString(), { gradingEnabled: req.body.gradingEnabled === 'true' }));
      res.status(202).json({ success: true, data: publicEvaluation(evaluation) });
    } catch (err) {
      removeUploadedFiles(req.files);
      next(err);
    }
  });
};

const retryEvaluation = async (req, res, next) => {
  try {
    const evaluation = await Evaluation.findOne({ _id: req.params.id, teacher: req.user._id });
    if (!evaluation) return res.status(404).json({ success: false, message: 'Evaluation not found' });
    if (!fs.existsSync(evaluation.questionPaper.path) || !fs.existsSync(evaluation.answerSheet.path)) {
      return res.status(410).json({ success: false, message: 'One of the uploaded source files is no longer available. Upload both files again to start a new evaluation.' });
    }
    const gradingEnabled = evaluation.grading.enabled;
    evaluation.processingStatus = { state: 'uploaded', progress: 8, currentStage: 'uploaded', stages: initialStages() };
    evaluation.questions = [];
    evaluation.answers = [];
    evaluation.mappings = [];
    evaluation.grading = { enabled: gradingEnabled, items: [] };
    await evaluation.save();
    setImmediate(() => processEvaluation(evaluation._id.toString(), { gradingEnabled }));
    res.status(202).json({ success: true, data: publicEvaluation(evaluation) });
  } catch (err) { next(err); }
};

const updateMapping = async (req, res, next) => {
  try {
    const { questionId, answerId, status = 'manual' } = req.body;
    const evaluation = await Evaluation.findOne({ _id: req.params.id, teacher: req.user._id });
    if (!evaluation) return res.status(404).json({ success: false, message: 'Evaluation not found' });
    const mapping = evaluation.mappings.find((item) => item.questionId === questionId);
    if (!mapping) return res.status(404).json({ success: false, message: 'Question mapping not found' });
    if (answerId && !evaluation.answers.some((item) => item.id === answerId)) {
      return res.status(400).json({ success: false, message: 'Selected answer was not found in this evaluation.' });
    }
    mapping.answerId = answerId || null;
    mapping.status = answerId ? status : 'unanswered';
    mapping.confidence = answerId ? 1 : 0;
    mapping.manuallyEdited = true;
    evaluation.approvedAt = undefined;
    evaluation.approvedBy = null;
    evaluation.grading.questionsAnswered = evaluation.mappings.filter((item) => item.answerId).length;
    evaluation.grading.questionsUnanswered = evaluation.mappings.filter((item) => !item.answerId).length;
    evaluation.grading.questionsRequiringReview = new Set([
      ...evaluation.mappings.filter((item) => ['low', 'medium', 'unmatched'].includes(item.status)).map((item) => item.questionId),
      ...evaluation.grading.items.filter((item) => item.needsReview).map((item) => item.questionId),
    ]).size;
    await evaluation.save();
    res.json({ success: true, data: publicEvaluation(evaluation) });
  } catch (err) { next(err); }
};

const updateGrade = async (req, res, next) => {
  try {
    const { questionId, marksObtained, feedback } = req.body;
    const evaluation = await Evaluation.findOne({ _id: req.params.id, teacher: req.user._id });
    if (!evaluation) return res.status(404).json({ success: false, message: 'Evaluation not found' });
    const item = evaluation.grading.items.find((grade) => grade.questionId === questionId);
    if (!item) return res.status(404).json({ success: false, message: 'Grade item not found' });
    const score = Number(marksObtained);
    if (!Number.isFinite(score) || score < 0 || score > item.maxMarks) {
      return res.status(400).json({ success: false, message: `Marks must be between 0 and ${item.maxMarks}.` });
    }
    item.marksObtained = score;
    item.feedback = String(feedback || '').slice(0, 1200);
    item.correctness = score === 0 ? 'incorrect' : score === item.maxMarks ? 'correct' : 'partial';
    evaluation.approvedAt = undefined;
    evaluation.approvedBy = null;
    evaluation.grading.enabled = true;
    evaluation.grading.obtainedMarks = evaluation.grading.items.reduce((sum, grade) => sum + grade.marksObtained, 0);
    evaluation.grading.percentage = evaluation.grading.totalMarks
      ? Math.round((evaluation.grading.obtainedMarks / evaluation.grading.totalMarks) * 100) : 0;
    await evaluation.save();
    res.json({ success: true, data: publicEvaluation(evaluation) });
  } catch (err) { next(err); }
};

const updateAnswerText = async (req, res, next) => {
  try {
    const { answerId, extractedText } = req.body;
    if (typeof extractedText !== 'string' || extractedText.length > 12000) {
      return res.status(400).json({ success: false, message: 'Answer transcription must be text under 12,000 characters.' });
    }
    const evaluation = await Evaluation.findOne({ _id: req.params.id, teacher: req.user._id });
    if (!evaluation) return res.status(404).json({ success: false, message: 'Evaluation not found' });
    const answer = evaluation.answers.find((item) => item.id === answerId);
    if (!answer) return res.status(404).json({ success: false, message: 'Answer response not found' });
    answer.extractedText = extractedText.trim();
    answer.manuallyEdited = true;
    answer.confidence = 1;
    evaluation.approvedAt = undefined;
    evaluation.approvedBy = null;
    await evaluation.save();
    res.json({ success: true, data: publicEvaluation(evaluation) });
  } catch (err) { next(err); }
};

const approveEvaluation = async (req, res, next) => {
  try {
    const evaluation = await Evaluation.findOne({ _id: req.params.id, teacher: req.user._id });
    if (!evaluation) return res.status(404).json({ success: false, message: 'Evaluation not found' });
    if (evaluation.processingStatus.state !== 'completed' || !evaluation.questions.length) {
      return res.status(409).json({ success: false, message: 'Complete the AI review before approving this evaluation.' });
    }
    evaluation.approvedAt = new Date();
    evaluation.approvedBy = req.user._id;
    await evaluation.save();
    res.json({ success: true, data: publicEvaluation(evaluation) });
  } catch (err) { next(err); }
};

const deleteEvaluation = async (req, res, next) => {
  try {
    const evaluation = await Evaluation.findOne({ _id: req.params.id, teacher: req.user._id });
    if (!evaluation) return res.status(404).json({ success: false, message: 'Evaluation not found' });

    const filesToDelete = [
      evaluation.questionPaper?.path,
      evaluation.answerSheet?.path,
      ...(evaluation.questionPaper?.pages || []).map((page) => page.imagePath),
      ...(evaluation.answerSheet?.pages || []).map((page) => page.imagePath),
    ].filter(Boolean);

    for (const filePath of [...new Set(filesToDelete)]) {
      const resolvedPath = path.resolve(filePath);
      const resolvedUploadDir = path.resolve(uploadDir);
      if (!resolvedPath.startsWith(`${resolvedUploadDir}${path.sep}`)) continue;
      try {
        if (fs.existsSync(resolvedPath)) fs.unlinkSync(resolvedPath);
      } catch (error) {
        console.error(`Could not delete evaluation file ${resolvedPath}:`, error);
      }
    }

    await Evaluation.deleteOne({ _id: evaluation._id });
    res.json({ success: true, message: 'Evaluation deleted successfully.' });
  } catch (err) { next(err); }
};

module.exports = { listEvaluations, getEvaluation, getEvaluationFile, getEvaluationPageImage, createEvaluation, retryEvaluation, updateMapping, updateGrade, updateAnswerText, approveEvaluation, deleteEvaluation };
