const express = require('express');
const router = express.Router();
const {
  getEnquiries,
  getEnquiry,
  createEnquiry,
  updateEnquiry,
  deleteEnquiry,
  getEnquiryStats,
  createPublicEnquiry,
} = require('../controllers/enquiryController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validation');

// Stats route (must be before /:id)
router.post('/public', validate('createEnquiry'), createPublicEnquiry);
router.get('/stats', protect, getEnquiryStats);

// Main CRUD routes
router
  .route('/')
  .get(protect, getEnquiries)
  .post(protect, validate('createEnquiry'), createEnquiry);

router
  .route('/:id')
  .get(protect, getEnquiry)
  .put(protect, validate('updateEnquiry'), updateEnquiry)
  .delete(protect, authorize('admin'), deleteEnquiry);

module.exports = router;