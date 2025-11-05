const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getStaffUsers,
} = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validation');

// Staff list route (must be before /:id)
router.get('/staff/list', protect, getStaffUsers);

// Main CRUD routes (Admin only)
router
  .route('/')
  .get(protect, authorize('admin'), getUsers)
  .post(protect, authorize('admin'), validate('createUser'), createUser);

router
  .route('/:id')
  .get(protect, authorize('admin'), getUser)
  .put(protect, authorize('admin'), validate('updateUser'), updateUser)
  .delete(protect, authorize('admin'), deleteUser);

module.exports = router;