const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a session title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  idea: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Idea',
    required: true
  },
  scheduledTime: {
    type: Date,
    required: [true, 'Please add a scheduled time']
  },
  duration: {
    type: Number, // in minutes
    default: 30,
    min: [15, 'Minimum session duration is 15 minutes'],
    max: [120, 'Maximum session duration is 120 minutes']
  },
  status: {
    type: String,
    enum: ['scheduled', 'live', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  maxParticipants: {
    type: Number,
    default: 20,
    min: [1, 'Minimum 1 participant required']
  },
  recordingUrl: {
    type: String
  },
  chatMessages: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for faster querying
SessionSchema.index({ idea: 1 });
SessionSchema.index({ host: 1 });
SessionSchema.index({ status: 1 });
SessionSchema.index({ scheduledTime: 1 });

// Cascade delete session references when idea is deleted
SessionSchema.pre('remove', async function(next) {
  await this.model('Idea').updateMany(
    { sessions: this._id },
    { $pull: { sessions: this._id } }
  );
  next();
});

module.exports = mongoose.model('Session', SessionSchema);