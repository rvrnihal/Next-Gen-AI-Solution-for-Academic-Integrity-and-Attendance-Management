import { Router } from 'express';
import { logMalpractice, getMalpracticeLogs, checkPlagiarism } from '../controllers/ai.controller';
import { authenticate, requireRole } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.post('/malpractice/log', authenticate, requireRole([Role.FACULTY, Role.HOD, Role.ADMIN]), logMalpractice);
router.get('/malpractice/logs', authenticate, requireRole([Role.FACULTY, Role.HOD, Role.PRINCIPAL, Role.ADMIN]), getMalpracticeLogs);
router.post('/plagiarism/check', authenticate, requireRole([Role.FACULTY, Role.HOD, Role.ADMIN]), checkPlagiarism);

export default router;
