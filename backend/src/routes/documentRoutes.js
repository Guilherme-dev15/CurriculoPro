import express from 'express';
import * as docController from '../controllers/documentController.js';
import { catchAsync } from '../middleware/errorHandler.js';

const router = express.Router();

router.get('/', catchAsync(docController.getDocuments));
router.post('/', catchAsync(docController.createDocument));

router.get('/:id/analytics', catchAsync(docController.getDocumentAnalytics));

router.put('/:id', catchAsync(docController.updateDocument));
router.delete('/:id', catchAsync(docController.deleteDocument));
router.patch('/:id/share', catchAsync(docController.toggleSharing));

export default router;
