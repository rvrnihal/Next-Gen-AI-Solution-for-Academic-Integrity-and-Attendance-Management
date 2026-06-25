import { Response } from 'express';
import crypto from 'crypto';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';

export const createSession = async (req: AuthenticatedRequest, res: Response) => {
  const { subjectName, startTime, endTime, gpsLatitude, gpsLongitude, geofenceRadius } = req.body;

  if (!subjectName || !startTime || !endTime) {
    return res.status(400).json({ error: 'Subject name, start time, and end time are required' });
  }

  const facultyProfileId = req.user?.facultyProfileId;
  if (!facultyProfileId) {
    return res.status(403).json({ error: 'Only registered faculty members can create sessions' });
  }

  try {
    const qrSecret = crypto.randomBytes(16).toString('hex');
    const session = await prisma.classSession.create({
      data: {
        facultyId: facultyProfileId,
        subjectName,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        qrSecret,
        gpsLatitude: gpsLatitude ? parseFloat(gpsLatitude) : null,
        gpsLongitude: gpsLongitude ? parseFloat(gpsLongitude) : null,
        geofenceRadius: geofenceRadius ? parseFloat(geofenceRadius) : null,
      },
    });

    return res.status(201).json({
      message: 'Class session created successfully',
      session,
    });
  } catch (error) {
    console.error('Session creation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getSessions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sessions = await prisma.classSession.findMany({
      include: {
        faculty: {
          include: {
            user: { select: { name: true } },
          },
        },
      },
      orderBy: { startTime: 'desc' },
    });
    return res.json({ sessions });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateSessionQR = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  try {
    const qrSecret = crypto.randomBytes(16).toString('hex');
    const updated = await prisma.classSession.update({
      where: { id },
      data: { qrSecret },
    });
    return res.json({
      message: 'Dynamic QR updated successfully',
      qrSecret: updated.qrSecret,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update dynamic QR' });
  }
};
