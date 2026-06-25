import { Router } from 'express';
import { createSession, getSessions, updateSessionQR } from '../controllers/session.controller';
import { authenticate, requireRole } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.post('/', authenticate, requireRole([Role.FACULTY, Role.HOD, Role.ADMIN]), createSession);
router.get('/', authenticate, getSessions);
router.put('/:id/qr', authenticate, requireRole([Role.FACULTY, Role.HOD, Role.ADMIN]), updateSessionQR);

export default router;
