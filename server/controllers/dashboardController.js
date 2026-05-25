const Assignment = require('../models/Assignment');
const Group      = require('../models/Group');

const getStats = async (req, res, next) => {
  try {
    const id = req.user._id;
    const [totalAssignments, completedAssignments, totalGroups, recentAssignments] = await Promise.all([
      Assignment.countDocuments({ teacher: id, isArchived: false }),
      Assignment.countDocuments({ teacher: id, status: 'completed' }),
      Group.countDocuments({ teacher: id, isActive: true }),
      Assignment.find({ teacher: id }).sort({ createdAt: -1 }).limit(5).populate('group','name'),
    ]);
    const subjectDistribution = await Assignment.aggregate([
      { $match: { teacher: id } },
      { $group: { _id: '$subject', count: { $sum: 1 } } },
      { $sort: { count: -1 } }, { $limit: 6 },
    ]);
    res.json({ success: true, data: {
      totalAssignments, completedAssignments, totalGroups,
      pendingAssignments: totalAssignments - completedAssignments,
      recentAssignments, subjectDistribution,
    }});
  } catch (err) { next(err); }
};

module.exports = { getStats };
