import express from 'express';
import { Auth } from '../middleware/auth.mid.js'
import { getDashboard,getUserById, updateProfile} from '../controller/users.controller.js';
import { body } from 'express-validator';
import sanitizeHtml from 'sanitize-html';


const router = express.Router();

router.get('/dashboard', Auth, getDashboard);
router.get('/:id', Auth, getUserById);
router.patch('/profile', Auth, [
    body('name').optional().trim().notEmpty().isLength({ max: 50 }).customSanitizer(value => sanitizeHtml(value)),
    body('email').optional().isEmail().normalizeEmail()
  ], updateProfile);
export default router;