import { Response } from 'express';
import { AttendanceMethod, AttendanceStatus } from '@prisma/client';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Radius of Earth in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in meters
}

export const markAttendance = async (req: AuthenticatedRequest, res: Response) => {
  const { sessionId, rollNumber, barcodeValue, method, qrCodeValue, latitude, longitude } = req.body;

  if (!sessionId || !method) {
    return res.status(400).json({ error: 'Session ID and verification method are required' });
  }

  try {
    // 1. Fetch Session
    const session = await prisma.classSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) {
      return res.status(404).json({ error: 'Class session not found' });
    }

    // 2. Fetch Student
    let student;
    if (rollNumber || barcodeValue) {
      const identifier = rollNumber || barcodeValue;
      student = await prisma.studentProfile.findUnique({
        where: { rollNumber: identifier },
        include: { user: true },
      });
    } else if (req.user && req.user.role === 'STUDENT') {
      student = await prisma.studentProfile.findUnique({
        where: { userId: req.user.id },
        include: { user: true },
      });
    }

    if (!student) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    // 3. Check for existing attendance record
    const existing = await prisma.attendanceRecord.findFirst({
      where: {
        studentId: student.id,
        sessionId: session.id,
      },
    });
    if (existing) {
      return res.status(400).json({ error: 'Attendance already marked for this session' });
    }

    // 4. Method specific validations
    let finalStatus: AttendanceStatus = 'PRESENT';

    if (method === AttendanceMethod.GPS) {
      if (latitude === undefined || longitude === undefined) {
        return res.status(400).json({ error: 'GPS coordinates are required' });
      }
      if (!session.gpsLatitude || !session.gpsLongitude || !session.geofenceRadius) {
        return res.status(400).json({ error: 'GPS Geofencing is not configured for this class' });
      }
      const distance = getDistance(latitude, longitude, session.gpsLatitude, session.gpsLongitude);
      if (distance > session.geofenceRadius) {
        return res.status(400).json({
          error: `Location verification failed. You are ${Math.round(distance)}m away from class (Allowed: ${session.geofenceRadius}m)`,
        });
      }
    }

    if (method === AttendanceMethod.QR) {
      if (!qrCodeValue) {
        return res.status(400).json({ error: 'QR Code payload is required' });
      }
      if (session.qrSecret !== qrCodeValue) {
        return res.status(400).json({ error: 'Invalid or expired QR code' });
      }
    }

    // 5. Check if student is late (e.g. 15 minutes after session startTime)
    const now = new Date();
    const lateThreshold = new Date(session.startTime.getTime() + 15 * 60 * 1000);
    if (now > lateThreshold) {
      finalStatus = 'LATE';
    }

    // 6. Create attendance record
    const record = await prisma.attendanceRecord.create({
      data: {
        studentId: student.id,
        sessionId: session.id,
        status: finalStatus,
        method: method as AttendanceMethod,
      },
      include: {
        student: {
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
        },
      },
    });

    return res.status(201).json({
      message: `Attendance marked successfully as: ${finalStatus}`,
      record,
    });
  } catch (error) {
    console.error('Error marking attendance:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getSessionAttendance = async (req: AuthenticatedRequest, res: Response) => {
  const { sessionId } = req.params;
  try {
    const records = await prisma.attendanceRecord.findMany({
      where: { sessionId },
      include: {
        student: {
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
        },
      },
      orderBy: { timestamp: 'desc' },
    });
    return res.json({ records });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getStudentAttendance = async (req: AuthenticatedRequest, res: Response) => {
  const { studentId } = req.params;
  try {
    const records = await prisma.attendanceRecord.findMany({
      where: { studentId },
      include: {
        session: {
          include: {
            faculty: {
              include: { user: { select: { name: true } } },
            },
          },
        },
      },
      orderBy: { timestamp: 'desc' },
    });
    return res.json({ records });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAnalytics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Return high-level aggregation metrics
    const totalRecords = await prisma.attendanceRecord.count();
    const presentRecords = await prisma.attendanceRecord.count({ where: { status: 'PRESENT' } });
    const lateRecords = await prisma.attendanceRecord.count({ where: { status: 'LATE' } });
    const absentRecords = await prisma.attendanceRecord.count({ where: { status: 'ABSENT' } });

    // Aggregate by method
    const records = await prisma.attendanceRecord.findMany({ select: { method: true } });
    const methodCounts = records.reduce((acc: any, cur) => {
      acc[cur.method] = (acc[cur.method] || 0) + 1;
      return acc;
    }, {});

    return res.json({
      summary: {
        total: totalRecords,
        present: presentRecords,
        late: lateRecords,
        absent: absentRecords,
        attendanceRate: totalRecords > 0 ? ((presentRecords + lateRecords) / totalRecords) * 100 : 0,
      },
      methods: methodCounts,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};
