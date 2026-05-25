const { validationResult } = require('express-validator');
const Assignment = require('../models/Assignment');
const { enqueueGeneration } = require('../jobs/generationWorker');
const { getRedis } = require('../config/redis');

const invalidateCache = async (userId) => {
  try {
    const redis = getRedis();
    const keys  = await redis.keys(`assignments:${userId}:*`);
    if (keys.length) await redis.del(...keys);
  } catch (_) {}  // non-fatal
};

const getAssignments = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '', status } = req.query;
    const query = { teacher: req.user._id, isArchived: false };
    if (status) query.status = status;
    if (search) query.title  = { $regex: search, $options: 'i' };

    // Try Redis cache
    const cacheKey = `assignments:${req.user._id}:${page}:${search}:${status || 'all'}`;
    try {
      const cached = await getRedis().get(cacheKey);
      if (cached) return res.json(JSON.parse(cached));
    } catch (_) {}

    const total       = await Assignment.countDocuments(query);
    const assignments = await Assignment.find(query)
      .populate('group', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const result = { success: true, data: assignments, total, page: Number(page), pages: Math.ceil(total / limit) };
    try { await getRedis().setex(cacheKey, 60, JSON.stringify(result)); } catch (_) {}
    res.json(result);
  } catch (err) { next(err); }
};

const getAssignment = async (req, res, next) => {
  try {
    const a = await Assignment.findOne({ _id: req.params.id, teacher: req.user._id })
      .populate('group', 'name subject')
      .populate('teacher', 'name school');
    if (!a) return res.status(404).json({ success: false, message: 'Assignment not found' });
    res.json({ success: true, data: a });
  } catch (err) { next(err); }
};

const createAssignment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, errors: errors.array() });

    const {
      title, subject, classGroup, dueDate, instructions,
      questionTypes, numQuestions, marksPerQuestion, difficulty, groupId,
    } = req.body;

    const assignment = await Assignment.create({
      teacher: req.user._id,
      group:   groupId || null,
      title, subject, classGroup, dueDate, instructions,
      questionTypes:    questionTypes    || ['MCQ'],
      numQuestions:     Number(numQuestions)    || 10,
      marksPerQuestion: Number(marksPerQuestion) || 2,
      difficulty:       difficulty       || ['easy', 'medium', 'hard'],
      status: 'pending',
    });

    const { jobId, mode } = await enqueueGeneration(assignment._id.toString(), {
      title, subject, classGroup,
      numQuestions:     Number(numQuestions)    || 10,
      marksPerQuestion: Number(marksPerQuestion) || 2,
      questionTypes:    questionTypes    || ['MCQ'],
      difficulty:       difficulty       || ['easy', 'medium', 'hard'],
      instructions,
    });

    await invalidateCache(req.user._id);
    console.log(`📋 Assignment created — jobId: ${jobId}, mode: ${mode}`);
    res.status(202).json({ success: true, data: assignment, jobId });
  } catch (err) { next(err); }
};

const deleteAssignment = async (req, res, next) => {
  try {
    const a = await Assignment.findOneAndDelete({ _id: req.params.id, teacher: req.user._id });
    if (!a) return res.status(404).json({ success: false, message: 'Not found' });
    await invalidateCache(req.user._id);
    res.json({ success: true, message: 'Assignment deleted' });
  } catch (err) { next(err); }
};

const regenerateAssignment = async (req, res, next) => {
  try {
    const a = await Assignment.findOne({ _id: req.params.id, teacher: req.user._id });
    if (!a) return res.status(404).json({ success: false, message: 'Not found' });

    a.status = 'pending';
    a.paper  = undefined;
    await a.save();

    const { jobId } = await enqueueGeneration(a._id.toString(), {
      title: a.title, subject: a.subject, classGroup: a.classGroup,
      numQuestions: a.numQuestions, marksPerQuestion: a.marksPerQuestion,
      questionTypes: a.questionTypes, difficulty: a.difficulty,
      instructions: a.instructions,
    });

    res.json({ success: true, jobId });
  } catch (err) { next(err); }
};

module.exports = { getAssignments, getAssignment, createAssignment, deleteAssignment, regenerateAssignment };
