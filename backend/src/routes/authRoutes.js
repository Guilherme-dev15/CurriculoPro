import express from 'express';
import { register, login } from '../controllers/authController.js';
import { catchAsync } from '../middleware/errorHandler.js';

const router = express.Router();

router.post('/register', catchAsync(register));
router.post('/login', catchAsync(login));

export default router;
