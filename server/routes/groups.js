const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { getGroups, createGroup, deleteGroup, getGroupStats } = require('../controllers/groupController');
router.use(protect);
router.get('/', getGroups);
router.post('/', createGroup);
router.delete('/:id', deleteGroup);
router.get('/:id/stats', getGroupStats);
module.exports = router;
