import mongoose from "mongoose";

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  status: {
    type: String,
    enum: ['Ongoing', 'Need Help', 'Looking for Collaborators'],
    required: true
  },
  githubLink: {
    type: String,
    trim: true,
    match: [/^https?:\/\/(www\.)?github\.com\/.+$/, 'Please provide a valid GitHub URL']
  },
  driveLink: {
    type: String,
    trim: true,
    match: [/^https?:\/\/(www\.)?(drive\.google\.com|docs\.google\.com)\/.+$/, 'Please provide a valid Google Drive URL']
  },
  coverImage: {
    type: String,
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

export const Project = mongoose.model('Project', projectSchema);