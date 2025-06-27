// const Project = require('../models/Project');
// const Comment = require('../models/Comment');
// const { validationResult } = require('express-validator');
// const cloudinary = require('../utils/cloudinary');
import { validationResult } from "express-validator";
import { Project } from "../model/project.model.js";
import { Comment } from "../model/comment.model.js";
import winston from "winston";




export const createProject = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    let coverImage = null;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'project_covers',
        allowed_formats: ['jpg', 'png', 'jpeg'],
      });
      coverImage = result.secure_url;
    }

    const { title, description, status, githubLink, driveLink, tags } = req.body;

    // Parse tags if sent as a JSON string
    let parsedTags = [];
    if (tags) {
      try {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
        // Validate that parsedTags is an array of non-empty strings
        if (!Array.isArray(parsedTags) || !parsedTags.every(tag => typeof tag === 'string' && tag.trim().length > 0)) {
          return res.status(400).json({ error: 'Tags must be an array of non-empty strings' });
        }
      } catch (error) {
        return res.status(400).json({ error: 'Invalid tags format' });
      }
    }

    const project = new Project({
      title,
      description,
      status,
      githubLink,
      driveLink,
      coverImage,
      createdBy: req.user._id,
      tags: parsedTags, // Save the parsed array
    });

    await project.save();
    res.status(201).json(project);

    winston.info(`Project created by user ${req.user.email}: ${title}`);
  } catch (error) {
    winston.error(`Create project error: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getProjects = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, sortBy = 'createdAt' } = req.query;
    const query = status ? { status } : {};

    const projects = await Project.find(query)
      .populate('createdBy', 'name')
      .select('title description status githubLink driveLink coverImage createdBy likes createdAt')
      .sort({ [sortBy]: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    const total = await Project.countDocuments(query);

    const projectsWithCounts = await Promise.all(projects.map(async project => ({
      ...project,
      likesCount: project.likes.length,
      commentsCount: await Comment.countDocuments({ projectId: project._id })
    })));

    res.json({
      projects: projectsWithCounts,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page)
    });
  } catch (error) {
    winston.error(`Get projects error: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const toggleLike = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const userId = req.user._id;
    const likeIndex = project.likes.indexOf(userId);

    if (likeIndex === -1) {
      project.likes.push(userId);
    } else {
      project.likes.splice(likeIndex, 1);
    }

    await project.save();
    res.json(project);

    winston.info(`Like toggled by user ${req.user.email} on project ${project.title}`);
  } catch (error) {
    winston.error(`Toggle like error: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const addComment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const comment = new Comment({
      text: req.body.text,
      author: req.user._id,
      projectId: req.params.id
    });

    await comment.save();
    res.status(201).json(comment);

    winston.info(`Comment added by user ${req.user.email} on project ${project.title}`);
  } catch (error) {
    winston.error(`Add comment error: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ projectId: req.params.id })
      .populate('author', 'name')
      .select('text author createdAt')
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (error) {
    winston.error(`Get comments error: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const incrementViews = async (req, res) => {
  try {
    const loggedInUser = req.user._id;
    const viewedUser = req.params.userId;
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    if (project.Viewers.includes(viewedUser)) {
      return res.status(200).json({ error: 'You have already viewed this project' });
    }
    project.views += 1;
    project.Viewers.push(loggedInUser);
    await project.save();

    res.json(project);
    winston.info(`View incremented for project ${project.title}`);
  } catch (error) {
    winston.error(`Increment views error: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};