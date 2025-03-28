const Session = require('../models/Session');
const Idea = require('../models/Idea');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Create a session
// @route   POST /api/sessions
// @access  Private (Founders)
exports.createSession = asyncHandler(async (req, res, next) => {
  const idea = await Idea.findById(req.body.idea);

  if (!idea) {
    return next(new ErrorResponse(`No idea found with id ${req.body.idea}`, 404));
  }

  // Verify user is idea author
  if (idea.author.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to create sessions for this idea`,
        401
      )
    );
  }

  const session = await Session.create({
    ...req.body,
    host: req.user.id
  });

  // Add session to idea
  idea.sessions.push(session._id);
  await idea.save();

  res.status(201).json({
    success: true,
    data: session
  });
});

// @desc    Get all sessions
// @route   GET /api/sessions
// @access  Public
exports.getSessions = asyncHandler(async (req, res, next) => {
  const { status, idea, upcoming } = req.query;
  
  let query = {};
  
  if (status) {
    query.status = status;
  }
  
  if (idea) {
    query.idea = idea;
  }
  
  if (upcoming === 'true') {
    query.scheduledTime = { $gte: Date.now() };
  }

  const sessions = await Session.find(query)
    .populate('host', 'username avatar')
    .populate('idea', 'title')
    .sort({ scheduledTime: 1 });

  res.status(200).json({
    success: true,
    count: sessions.length,
    data: sessions
  });
});

// @desc    Join a session
// @route   PUT /api/sessions/:id/join
// @access  Private
exports.joinSession = asyncHandler(async (req, res, next) => {
  const session = await Session.findById(req.params.id);

  if (!session) {
    return next(new ErrorResponse(`No session found with id ${req.params.id}`, 404));
  }

  // Check if session is live or upcoming
  if (session.status !== 'scheduled' && session.status !== 'live') {
    return next(new ErrorResponse('Session is not available to join', 400));
  }

  // Check if user already joined
  const alreadyJoined = session.participants.some(
    participant => participant.user.toString() === req.user.id
  );

  if (alreadyJoined) {
    return next(new ErrorResponse('User already joined this session', 400));
  }

  // Check if session is full
  if (session.participants.length >= session.maxParticipants) {
    return next(new ErrorResponse('Session has reached maximum capacity', 400));
  }

  session.participants.push({ user: req.user.id });
  await session.save();

  res.status(200).json({
    success: true,
    data: session
  });
});

// @desc    Cancel a session
// @route   PUT /api/sessions/:id/cancel
// @access  Private (Host/Admin)
exports.cancelSession = asyncHandler(async (req, res, next) => {
  let session = await Session.findById(req.params.id);

  if (!session) {
    return next(new ErrorResponse(`No session found with id ${req.params.id}`, 404));
  }

  // Verify user is session host or admin
  if (session.host.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to cancel this session`,
        401
      )
    );
  }

  // Can only cancel scheduled sessions
  if (session.status !== 'scheduled') {
    return next(
      new ErrorResponse(
        'Only scheduled sessions can be cancelled',
        400
      )
    );
  }

  session = await Session.findByIdAndUpdate(
    req.params.id,
    { status: 'cancelled' },
    { new: true }
  );

  res.status(200).json({
    success: true,
    data: session
  });
});

// @desc    End a session
// @route   PUT /api/sessions/:id/end
// @access  Private (Host/Admin)
exports.endSession = asyncHandler(async (req, res, next) => {
  let session = await Session.findById(req.params.id);

  if (!session) {
    return next(new ErrorResponse(`No session found with id ${req.params.id}`, 404));
  }

  // Verify user is session host or admin
  if (session.host.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to end this session`,
        401
      )
    );
  }

  session = await Session.findByIdAndUpdate(
    req.params.id,
    { status: 'completed' },
    { new: true }
  );

  res.status(200).json({
    success: true,
    data: session
  });
});

// @desc    Get single session
// @route   GET /api/sessions/:id
// @access  Public
exports.getSessionById = asyncHandler(async (req, res, next) => {
  const session = await Session.findById(req.params.id)
    .populate('host', 'username avatar')
    .populate('idea', 'title description')
    .populate('participants.user', 'username avatar');

  if (!session) {
    return next(new ErrorResponse(`No session found with id ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: session
  });
});

// @desc    Update session
// @route   PUT /api/sessions/:id
// @access  Private (Host/Admin)
exports.updateSession = asyncHandler(async (req, res, next) => {
  let session = await Session.findById(req.params.id);

  if (!session) {
    return next(new ErrorResponse(`No session found with id ${req.params.id}`, 404));
  }

  // Verify user is session host or admin
  if (session.host.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this session`,
        401
      )
    );
  }

  // Can only update scheduled sessions
  if (session.status !== 'scheduled') {
    return next(
      new ErrorResponse(
        'Only scheduled sessions can be updated',
        400
      )
    );
  }

  // Prevent changing certain fields
  const { status, host, idea, participants, chatMessages, ...updatableFields } = req.body;

  session = await Session.findByIdAndUpdate(
    req.params.id,
    updatableFields,
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    success: true,
    data: session
  });
});

// @desc    Add chat message to session
// @route   POST /api/sessions/:id/chat
// @access  Private (Participants)
exports.addChatMessage = asyncHandler(async (req, res, next) => {
  const session = await Session.findById(req.params.id);

  if (!session) {
    return next(new ErrorResponse(`No session found with id ${req.params.id}`, 404));
  }

  // Check if user is a participant
  const isParticipant = session.participants.some(
    participant => participant.user.toString() === req.user.id
  );

  if (!isParticipant && session.host.toString() !== req.user.id) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to chat in this session`,
        401
      )
    );
  }

  session.chatMessages.push({
    user: req.user.id,
    message: req.body.message
  });

  await session.save();

  res.status(200).json({
    success: true,
    data: session.chatMessages
  });
});