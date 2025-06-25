import express from 'express';
import { signup, login, refreshToken } from '../controller/auth.controller.js';
import { body } from 'express-validator';
import sanitizeHtml from 'sanitize-html';

const router = express.Router();

router.post('/signup', [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 50 }).withMessage('Name must be less than 50 characters').customSanitizer(value => sanitizeHtml(value)),
  body('email').isEmail().withMessage('Please enter a valid email address').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long').matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
], signup);

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], login);

router.post('/refresh-token', refreshToken);

export default router;