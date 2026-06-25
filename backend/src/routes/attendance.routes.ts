import { Router } from 'express';
import { markAttendance, getSessionAttendance, getStudentAttendance, getAnalytics } from '../controllers/attendance.controller';
import { authenticate, requireRole } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.post('/mark', authenticate, markAttendance);
router.get('/session/:sessionId', authenticate, requireRole([Role.FACULTY, Role.HOD, Role.PRINCIPAL, Role.ADMIN]), getSessionAttendance);
router.get('/student/:studentId', authenticate, getStudentAttendance);
router.get('/analytics', authenticate, requireRole([Role.HOD, Role.PRINCIPAL, Role.ADMIN]), getAnalytics);

export default router;
