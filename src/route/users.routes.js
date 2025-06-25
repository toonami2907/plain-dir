import express from 'express';
import { Auth } from '../middleware/auth.mid.js'
import { getDashboard,getUserById} from '../controller/users.controller.js';

const router = express.Router();

router.get('/dashboard', Auth, getDashboard);
router.get('/:id', Auth, getUserById);
export default router;