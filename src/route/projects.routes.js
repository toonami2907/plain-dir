import express from 'express';
import { Auth } from '../middleware/auth.mid.js';
import { createProject, getProjects, toggleLike, addComment, getComments } from '../controller/project.controller.js';
import { body } from 'express-validator';
import sanitizeHtml from 'sanitize-html';
import multer from 'multer';

const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.match(/image\/(jpg|jpeg|png)/)) {
      return cb(new Error('Only JPG, JPEG, and PNG files are allowed'));
    }
    cb(null, true);
  }
});

const router = express.Router();

router.post('/', Auth, upload.single('coverImage'), [
  body('title').trim().notEmpty().isLength({ max: 100 }).customSanitizer(value => sanitizeHtml(value)),
  body('description').trim().notEmpty().isLength({ max: 2000 }).customSanitizer(value => sanitizeHtml(value)),
  body('status').isIn(['Ongoing', 'Need Help', 'Looking for Collaborators']),
  body('githubLink').optional().isURL().matches(/^https?:\/\/(www\.)?github\.com\/.+$/),
  body('driveLink').optional().isURL().matches(/^https?:\/\/(www\.)?(drive\.google\.com|docs\.google\.com)\/.+$/)
], createProject);

router.get('/', getProjects);
router.post('/:id/like', Auth, toggleLike);
router.post('/:id/comments', Auth, [
  body('text').trim().notEmpty().isLength({ max: 500 }).customSanitizer(value => sanitizeHtml(value))
], addComment);
router.get('/:id/comments', getComments);

export default router;