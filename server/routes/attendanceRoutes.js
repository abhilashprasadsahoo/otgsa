const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

router.post('/mark', verifyToken, attendanceController.markAttendance);
router.get('/my', verifyToken, attendanceController.getMyAttendance);
router.get('/all', verifyToken, isAdmin, attendanceController.getAllAttendance);
router.delete('/:id', verifyToken, isAdmin, attendanceController.deleteAttendance);
router.get('/download', verifyToken, isAdmin, attendanceController.downloadExcel);

module.exports = router;
