// Vercel serverless function for initial setup (run once)
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      return res.status(400).json({ message: 'Setup already completed' });
    }

    console.log('No users found. Creating initial Admin...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: {
        employee_id: 'ADMIN001',
        name: 'Super Admin',
        email: 'admin@odissitech.com',
        password: hashedPassword,
        role: 'ADMIN'
      }
    });

    console.log('Admin created: admin@odissitech.com / admin123');
    res.json({ message: 'Initial admin setup completed successfully' });
  } catch (err) {
    console.error('Error in setup:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    await prisma.$disconnect();
  }
}
