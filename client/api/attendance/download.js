// Vercel serverless function for downloading attendance as Excel
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const xlsx = require('xlsx');

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

    const allAttendance = await prisma.attendance.findMany({
      include: { user: true },
      orderBy: { created_at: 'desc' }
    });

    const data = allAttendance.map(record => ({
      Date: record.date,
      'Employee ID': record.employee_id,
      'Employee Name': record.user ? record.user.name : 'Unknown',
      'Morning IN': record.morning_in ? new Date(record.morning_in).toLocaleTimeString() : '',
      'Remarks': record.remarks || '',
      'Lunch OUT': record.lunch_out ? new Date(record.lunch_out).toLocaleTimeString() : '',
      'Lunch IN': record.lunch_in ? new Date(record.lunch_in).toLocaleTimeString() : '',
      'Office OUT': record.office_out ? new Date(record.office_out).toLocaleTimeString() : '',
    }));

    const ws = xlsx.utils.json_to_sheet(data);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Attendance');

    // Generate buffer
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=attendance.xlsx');
    res.send(buffer);
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
