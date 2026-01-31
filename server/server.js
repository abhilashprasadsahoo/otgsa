require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const { getDB } = require('./mongoClient');
const bcrypt = require('bcryptjs');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);

app.get('/', async (req, res) => {
  try {
    // Check database connection
    const db = getDB();
    await db.collection('users').countDocuments({ take: 1 });
    res.send(`
      <div style="font-family: sans-serif; text-align: center; padding-top: 50px;">
        <h1 style="color: #047857;">ODISSITECH Server is Running</h1>
        <p>Database Connection: <strong style="color: green;">Active</strong></p>
        <p>Status: <span style="background: #d1fae5; color: #065f46; padding: 4px 8px; rounded: 4px;">Online</span></p>
      </div>
    `);
  } catch (err) {
    res.status(500).send(`
      <div style="font-family: sans-serif; text-align: center; padding-top: 50px;">
        <h1 style="color: #dc2626;">Server Error</h1>
        <p>Database Connection: <strong style="color: red;">Failed</strong></p>
        <pre style="background: #fef2f2; color: #991b1b; padding: 20px; text-align: left; max-width: 800px; margin: 0 auto; overflow: auto;">${err.message}</pre>
      </div>
    `);
  }
});

const PORT = process.env.PORT || 5001;

// Connect to MongoDB and setup admin
async function initializeApp() {
  await connectToMongoDB();

  // Initial Admin Setup
  const setupAdmin = async () => {
    try {
      const db = getDB();
      const userCount = await db.collection('users').countDocuments();
      if (userCount === 0) {
        console.log('No users found. Creating initial Admin...');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await db.collection('users').insertOne({
          employee_id: 'ADMIN001',
          name: 'Super Admin',
          email: 'admin@odissitech.com',
          password: hashedPassword,
          role: 'ADMIN',
          status: true,
          created_at: new Date()
        });
        console.log('Admin created: admin@odissitech.com / admin123');
      }
    } catch (err) {
      console.error('Error in setupAdmin:', err.message);
    }
  };

  await setupAdmin();
}

initializeApp();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
