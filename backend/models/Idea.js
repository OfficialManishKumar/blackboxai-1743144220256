const mongoose = require('mongoose');

const IdeaSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    trim: true,
    maxlength: [120, 'Title cannot be more than 120 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide a description']
  },
  problemStatement: {
    type: String,
    required: [true, 'Please describe the problem you are solving']
  },
  solution: {
    type: String,
    required: [true, 'Please describe your proposed solution']
  },
  targetMarket: {
    type: String,
    required: [true, 'Please describe your target market']
  },
  tags: {
    type: [String],
    enum: [
      'technology', 'healthcare', 'finance', 'education', 
      'ecommerce', 'sustainability', 'ai', 'blockchain',
      'saas', 'mobile', 'web', 'iot', 'hardware'
    ],
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'validating', 'funding', 'archived'],
    default: 'draft'
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  webChecks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WebCheck'
  }],
  sessions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session'
  }],
  teamMembers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['co-founder', 'developer', 'designer', 'marketer']
    }
  }],
  attachments: [{
    url: String,
    type: {
      type: String,
      enum: ['image', 'document', 'video', 'prototype']
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Update timestamp on save
IdeaSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Cascade delete comments when idea is removed
IdeaSchema.pre('remove', async function(next) {
  await this.model('Comment').deleteMany({ idea: this._id });
  next();
});

// Reverse populate with virtuals
IdeaSchema.virtual('feedbacks', {
  ref: 'Feedback',
  localField: '_id',
  foreignField: 'idea',
  justOne: false
});

module.exports = mongoose.model('Idea', IdeaSchema);