const router = require('express').Router();
const { protect } = require('../middleware/auth');
const {
  listEvaluations,
  getEvaluation,
  getEvaluationFile,
  getEvaluationPageImage,
  createEvaluation,
  retryEvaluation,
  updateMapping,
  updateGrade,
  updateAnswerText,
  approveEvaluation,
  deleteEvaluation,
} = require('../controllers/evaluationController');

router.use(protect);
router.get('/', listEvaluations);
router.post('/', createEvaluation);
router.post('/:id/retry', retryEvaluation);
router.get('/:id/files/:kind', getEvaluationFile);
router.get('/:id/files/:kind/pages/:page', getEvaluationPageImage);
router.get('/:id', getEvaluation);
router.patch('/:id/mappings', updateMapping);
router.patch('/:id/grading', updateGrade);
router.patch('/:id/answers', updateAnswerText);
router.post('/:id/approve', approveEvaluation);
router.delete('/:id', deleteEvaluation);

module.exports = router;
