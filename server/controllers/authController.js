const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prismaClient');

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.status) return res.status(403).json({ message: 'Account inactive' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id.toString(), role: user.role, employee_id: user.employee_id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    res.json({
      token,
      user: {
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        employee_id: user.employee_id
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.register = async (req, res) => {
  const { employee_id, name, email, password, role } = req.body;
  try {
    // Check for existing users to provide better error messages
    const existingId = await prisma.user.findUnique({ where: { employee_id } });
    if (existingId) {
      return res.status(400).json({ error: 'Employee ID already exists' });
    }

    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { employee_id, name, email, password: hashedPassword, role: role || 'EMPLOYEE' }
    });
    
    // Simulate sending email
    console.log(`[EMAIL SENT] To: ${email} | Credentials: ID=${employee_id}, Password=${password}`);
    
    res.status(201).json(user);
  } catch (err) {
    // Handle Prisma unique constraint errors gracefully
    if (err.code === 'P2002') {
       return res.status(400).json({ error: `A user with this ${err.meta?.target} already exists` });
    }
    res.status(400).json({ error: err.message });
  }
};

exports.deleteEmployee = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.attendance.deleteMany({ where: { employee_id: id } });
        await prisma.user.delete({ where: { id: id } });
        res.json({ message: 'Employee deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getEmployees = async (req, res) => {
    try {
        const employees = await prisma.user.findMany({
            select: { id: true, employee_id: true, name: true, email: true, role: true, status: true, created_at: true, password: true }
        });
        console.log(`Fetched ${employees.length} employees`);
        res.json(employees);
    } catch (err) {
        console.error('Error fetching employees:', err);
        res.status(500).json({ message: err.message, error: err.message });
    }
};
