// Vercel serverless function for marking attendance
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const user = verifyToken(req);
    const { employee_id } = user;
    const { type, remarks } = req.body; // morning_in, lunch_out, lunch_in, office_out

    // Use local date string YYYY-MM-DD
    const date = new Date().toISOString().split('T')[0];

    let attendance = await prisma.attendance.findUnique({
      where: { employee_id_date: { employee_id, date } }
    });

    if (!attendance) {
      if (type !== 'morning_in') {
        return res.status(400).json({ message: 'Must mark Morning IN first' });
      }
      attendance = await prisma.attendance.create({
        data: {
          employee_id,
          date,
          morning_in: new Date(),
          remarks: remarks || null
        }
      });
    } else {
      if (attendance[type]) {
        return res.status(400).json({ message: 'Already marked' });
      }

      // Basic Validation Logic Order
      if (type === 'lunch_out' && !attendance.morning_in) return res.status(400).json({ message: 'Morning IN missing' });
      if (type === 'lunch_in' && !attendance.lunch_out) return res.status(400).json({ message: 'Lunch OUT missing' });
      if (type === 'office_out' && !attendance.lunch_in) return res.status(400).json({ message: 'Lunch IN missing' });

      const updateData = {};
      updateData[type] = new Date();

      if (remarks) {
        if (type === 'lunch_in') {
          updateData.lunch_in_remarks = remarks;
        } else {
          updateData.remarks = attendance.remarks ? `${attendance.remarks} | ${remarks}` : remarks;
        }
      }

      attendance = await prisma.attendance.update({
        where: { id: attendance.id },
        data: updateData
      });
    }

    // Log the action
    await prisma.attendanceLog.create({
      data: { employee_id, action: type }
    });

    res.json(attendance);
  } catch (err) {
    if (err.message === 'No token provided') {
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
