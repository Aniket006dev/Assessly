const router = require('express').Router();
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const { getAssignments, getAssignment, createAssignment, deleteAssignment, regenerateAssignment } = require('../controllers/assignmentController');

router.use(protect);
router.get('/', getAssignments);
router.get('/:id', getAssignment);
router.post('/', [
  body('title').trim().notEmpty().withMessage('Title required'),
  body('subject').trim().notEmpty().withMessage('Subject required'),
  body('dueDate').notEmpty().withMessage('Due date required'),
  body('numQuestions').isInt({ min: 1, max: 50 }).withMessage('1-50 questions'),
  body('marksPerQuestion').isInt({ min: 1, max: 20 }).withMessage('1-20 marks'),
], createAssignment);
router.delete('/:id', deleteAssignment);
router.post('/:id/regenerate', regenerateAssignment);
module.exports = router;
