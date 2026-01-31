// Vercel serverless function for getting all attendance (admin only)
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Middleware functions
const verifyToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) throw new Error('No token provided');

  const token = authHeader.split(' ')[1];
  return jwt.verify(token, process.env.JWT_SECRET);
};

const isAdmin = (user) => {
  if (user.role !== 'ADMIN') throw new Error('Require Admin Role');
  return true;
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const user = verifyToken(req);
    isAdmin(user);

    const attendance = await prisma.attendance.findMany({
      include: { user: true },
      orderBy: { date: 'desc' }
    });

    res.json(attendance);
  } catch (err) {
    if (err.message === 'No token provided' || err.message === 'Require Admin Role') {
      return res.status(403).json({ message: err.message });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    res.status(500).json({ error: err.message });
  } finally {
    await prisma.$disconnect();
  }
}
