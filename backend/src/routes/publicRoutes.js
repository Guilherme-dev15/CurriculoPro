import express from 'express';
import { getPublicResume } from '../controllers/publicController.js';
import { catchAsync } from '../middleware/errorHandler.js';

const router = express.Router();

// Rota de visualização pública que também grava o analytic
router.get('/resume/:publicId', catchAsync(getPublicResume));

export default router;
