import { Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export const logMalpractice = async (req: AuthenticatedRequest, res: Response) => {
  const { sessionId, rollNumber, incidentType, confidence, snapshotUrl } = req.body;

  if (!sessionId || !rollNumber || !incidentType || !confidence) {
    return res.status(400).json({ error: 'Session ID, roll number, incident type, and confidence are required' });
  }

  try {
    const student = await prisma.studentProfile.findUnique({
      where: { rollNumber },
    });
    if (!student) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    const log = await prisma.malpracticeLog.create({
      data: {
        studentId: student.id,
        sessionId,
        incidentType,
        confidence: parseFloat(confidence),
        snapshotUrl,
      },
    });

    return res.status(201).json({
      message: 'Malpractice log recorded successfully',
      log,
    });
  } catch (error) {
    console.error('Error logging malpractice:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMalpracticeLogs = async (req: AuthenticatedRequest, res: Response) => {
  const { sessionId } = req.query;
  try {
    const filter = sessionId ? { sessionId: String(sessionId) } : {};
    const logs = await prisma.malpracticeLog.findMany({
      where: filter,
      include: {
        student: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
        session: { select: { subjectName: true } },
      },
      orderBy: { timestamp: 'desc' },
    });
    return res.json({ logs });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const checkPlagiarism = async (req: AuthenticatedRequest, res: Response) => {
  const { docA, docB } = req.body;
  if (!docA || !docB) {
    return res.status(400).json({ error: 'Both document A and document B are required' });
  }

  try {
    // Relay request to FastAPI AI service
    const response = await fetch(`${AI_SERVICE_URL}/ai/detect-plagiarism`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doc_a: docA, doc_b: docB }),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: `AI service error: ${err}` });
    }

    const data = await response.json();
    return res.json(data);
  } catch (error: any) {
    console.error('Error checking plagiarism:', error);
    return res.status(500).json({ error: `AI service unreachable: ${error.message}` });
  }
};
