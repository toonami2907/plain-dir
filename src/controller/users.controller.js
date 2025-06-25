import { Comment} from '../model/comment.model.js'
import { Project } from '../model/project.model.js'
import { User } from '../model/user.model.js'
import winston from 'winston';
import { validationResult } from 'express-validator';



export const getDashboard = async (req, res) => {
  try {
    const projects = await Project.find({ createdBy: req.user._id })
      .select('title description status coverImage createdAt likes')
      .lean();

    const comments = await Comment.find({ author: req.user._id })
      .populate({
        path: 'projectId',
        select: 'title'
      })
      .select('text projectId createdAt')
      .lean();

    res.json({
      projects: projects.map(project => ({
        ...project,
        likesCount: project.likes.length
      })),
      user: {
        name: req.user.name,
        id: req.user._id,
        email: req.user.email
      },
      comments: comments.map(comment => ({
        text: comment.text,
        projectTitle: comment.projectId.title,
        createdAt: comment.createdAt
      }))
    });

    winston.info(`Dashboard accessed by user ${req.user.email}`);
  } catch (error) {
    winston.error(`Get dashboard error: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('name email createdAt -_id');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
    winston.info(`User profile accessed: ${user.email} by ${req.user.email}`);
  } catch (error) {
    winston.error(`Get user by ID error: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already in use' });
      }
      user.email = email;
    }

    if (name) {
      user.name = name;
    }

    await user.save();

    res.json({
      name: user.name,
      id: user._id,
      email: user.email,
      createdAt: user.createdAt
    });

    winston.info(`Profile updated for user ${user.email}`);
  } catch (error) {
    winston.error(`Update profile error: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};