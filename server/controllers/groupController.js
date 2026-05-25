const Group      = require('../models/Group');
const Assignment = require('../models/Assignment');

const getGroups  = async (req, res, next) => {
  try {
    const groups = await Group.find({ teacher: req.user._id, isActive: true }).sort({ createdAt: -1 });
    res.json({ success: true, data: groups });
  } catch (err) { next(err); }
};

const createGroup = async (req, res, next) => {
  try {
    const { name, subject, grade, section, studentCount, color, description } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name required' });
    const group = await Group.create({ teacher: req.user._id, name, subject, grade, section, studentCount: Number(studentCount)||0, color, description });
    res.status(201).json({ success: true, data: group });
  } catch (err) { next(err); }
};

const deleteGroup = async (req, res, next) => {
  try {
    await Group.findOneAndDelete({ _id: req.params.id, teacher: req.user._id });
    res.json({ success: true });
  } catch (err) { next(err); }
};

const getGroupStats = async (req, res, next) => {
  try {
    const count = await Assignment.countDocuments({ group: req.params.id, teacher: req.user._id });
    res.json({ success: true, data: { assignmentCount: count } });
  } catch (err) { next(err); }
};

module.exports = { getGroups, createGroup, deleteGroup, getGroupStats };
