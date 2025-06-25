import { Comment} from '../model/comment.model.js'
import { Project } from '../model/project.model.js'
import { User } from '../model/user.model.js'

export const getDashboard = async (req, res) => {
  try {
    const projects = await Project.find({ createdBy: req.user.id })
      .select('title description status createdAt');

    const comments = await Comment.find({ author: req.user.id })
      .populate({
        path: 'projectId',
        select: 'title'
      })
      .select('text projectId createdAt');

    res.json({
      projects,
      comments: comments.map(comment => ({
        text: comment.text,
        projectTitle: comment.projectId.title,
        createdAt: comment.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
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