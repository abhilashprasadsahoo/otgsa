const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

router.post('/login', authController.login);
router.post('/register', verifyToken, isAdmin, authController.register); // Admin creates employees
router.get('/employees', verifyToken, isAdmin, authController.getEmployees);
router.delete('/employees/:id', verifyToken, isAdmin, authController.deleteEmployee);

module.exports = router;
