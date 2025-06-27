import mongoose from "mongoose";
import validator from "validator";


const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Project title is required'],
    maxlength: [100, 'Title cannot exceed 100 characters'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Project description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
    trim: true,
  },
  status: {
    type: String,
    enum: ['Ongoing', 'Need Help', 'Looking for Collaborators'],
    required: [true, 'Project status is required'],
  },
  githubLink: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || validator.isURL(v, { protocols: ['https'], host_whitelist: [/github\.com/] });
      },
      message: 'Invalid GitHub URL',
    },
    trim: true,
  },
  driveLink: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || validator.isURL(v, { protocols: ['https'], host_whitelist: [/drive\.google\.com/, /docs\.google\.com/] });
      },
      message: 'Invalid Google Drive/Docs URL',
    },
    trim: true,
  },
  coverImage: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || validator.isURL(v);
      },
      message: 'Invalid image URL',
    },
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  Viewers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  views: {
    type: Number,
    default: 0,
  },
  tags: [{
    type: String,
    maxlength: [50, 'Tag cannot exceed 50 characters'],
  }],
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id;
      ret.likesCount = ret.likes.length;
      delete ret._id;
      delete ret.__v;
      if (ret.createdBy) {
        ret.createdBy = {
          id: ret.createdBy._id || ret.createdBy,
          name: ret.createdBy.name,
        };
      }
      return ret;
    },
  },
});

// Populate createdBy field
projectSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'createdBy',
    select: 'name',
  });
  next();
});

// Ensure only one of githubLink or driveLink is provided
projectSchema.pre('save', function(next) {
  if (this.githubLink && this.driveLink) {
    return next(new Error('Only one of GitHub link or Drive link can be provided'));
  }
  next();
});

export const Project = mongoose.model('Project', projectSchema);