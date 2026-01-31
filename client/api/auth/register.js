// Vercel serverless function for employee registration
const bcrypt = require('bcryptjs');
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
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const user = verifyToken(req);
    isAdmin(user);

    const { employee_id, name, email, password, role } = req.body;

    // Check for existing users
    const existingId = await prisma.user.findUnique({ where: { employee_id } });
    if (existingId) {
      return res.status(400).json({ error: 'Employee ID already exists' });
    }

    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: { employee_id, name, email, password: hashedPassword, role: role || 'EMPLOYEE' }
    });

    console.log(`[EMAIL SENT] To: ${email} | Credentials: ID=${employee_id}, Password=${password}`);

    res.status(201).json(newUser);
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
