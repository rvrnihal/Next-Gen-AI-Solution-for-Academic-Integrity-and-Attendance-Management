import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';
const JWT_EXPIRES_IN = '7d';

export const register = async (req: AuthenticatedRequest, res: Response) => {
  const { email, password, name, role, rollNumber, employeeId } = req.body;

  if (!email || !password || !name || !role) {
    return res.status(400).json({ error: 'Email, password, name, and role are required' });
  }

  const normalizedRole = role.toUpperCase() as Role;
  if (!Object.values(Role).includes(normalizedRole)) {
    return res.status(400).json({ error: 'Invalid user role' });
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Encrypt password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Use Prisma transaction to create user and profile
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          name,
          role: normalizedRole,
        },
      });

      if (normalizedRole === Role.STUDENT) {
        if (!rollNumber) {
          throw new Error('Roll number is required for students');
        }
        await tx.studentProfile.create({
          data: {
            userId: user.id,
            rollNumber,
          },
        });
      } else if (([Role.FACULTY, Role.HOD, Role.PRINCIPAL] as Role[]).includes(normalizedRole)) {
        if (!employeeId) {
          throw new Error('Employee ID is required for faculty/staff');
        }
        await tx.facultyProfile.create({
          data: {
            userId: user.id,
            employeeId,
          },
        });
      }

      return user;
    });

    return res.status(214).json({
      message: 'Registration successful',
      user: {
        id: result.id,
        email: result.email,
        name: result.name,
        role: result.role,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: error.message || 'Registration failed' });
  }
};

export const login = async (req: AuthenticatedRequest, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        studentProfile: true,
        facultyProfile: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Sign JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        studentProfileId: user.studentProfile?.id,
        facultyProfileId: user.facultyProfile?.id,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Log action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_LOGIN',
        ipAddress: req.ip || 'unknown',
      },
    });

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        studentProfileId: user.studentProfile?.id,
        facultyProfileId: user.facultyProfile?.id,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        studentProfile: {
          select: {
            id: true,
            rollNumber: true,
          },
        },
        facultyProfile: {
          select: {
            id: true,
            employeeId: true,
          },
        },
      },
    });
    return res.json({ user });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};
