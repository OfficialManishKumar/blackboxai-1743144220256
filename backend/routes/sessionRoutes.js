const express = require('express');
const {
  createSession,
  getSessions,
  getSessionById,
  updateSession,
  joinSession,
  endSession,
  addChatMessage
} = require('../controllers/sessionController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router
  .route('/')
  .get(getSessions)
  .post(protect, authorize('founder', 'admin'), createSession);

router
  .route('/:id')
  .get(getSessionById)
  .put(protect, authorize('founder', 'admin'), updateSession);

router
  .route('/:id/join')
  .put(protect, joinSession);

router
  .route('/:id/cancel')
  .put(protect, authorize('founder', 'admin'), cancelSession);

router
  .route('/:id/end')
  .put(protect, authorize('founder', 'admin'), endSession);

router
  .route('/:id/chat')
  .post(protect, addChatMessage);

module.exports = router;
