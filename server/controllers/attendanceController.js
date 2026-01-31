const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const sheetsService = require('../services/sheetsService');

const EXCEL_FILE = path.join(__dirname, '../../attendance_sheet.xlsx');

const syncToExcel = async () => {
  try {
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
    xlsx.writeFile(wb, EXCEL_FILE);

    // Try syncing to Google Sheets as well (if configured)
    if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON && process.env.GOOGLE_SHEET_ID) {
      // append all rows in order (lightweight for small teams). For larger datasets, consider incremental updates.
      for (const record of allAttendance.reverse()) {
        try {
          await sheetsService.appendAttendanceRow(record);
        } catch (e) {
          console.error('Sheets sync error for record:', record, e.message || e);
        }
      }
    }
  } catch (error) {
    console.error('Excel Sync Error:', error);
  }
};

exports.markAttendance = async (req, res) => {
  const { employee_id } = req.user;
  const { type } = req.body; // morning_in, lunch_out, lunch_in, office_out

  // Use local date string YYYY-MM-DD
  const date = new Date().toISOString().split('T')[0];

  try {
    let attendance = await prisma.attendance.findFirst({ where: { employee_id, date } });

    if (!attendance) {
      if (type !== 'morning_in') {
        return res.status(400).json({ message: 'Must mark Morning IN first' });
      }
      attendance = await prisma.attendance.create({
        data: {
          employee_id,
          date,
          morning_in: new Date(),
          remarks: req.body.remarks || null,
          created_at: new Date()
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

      if (req.body.remarks) {
          if (type === 'lunch_in') {
             updateData.lunch_in_remarks = req.body.remarks;
          } else {
             updateData.remarks = attendance.remarks ? `${attendance.remarks} | ${req.body.remarks}` : req.body.remarks;
          }
      }

      attendance = await prisma.attendance.update({
        where: { id: attendance.id },
        data: updateData
      });
    }

    // Log
    await prisma.attendanceLog.create({
      data: {
        employee_id,
        action: type,
        timestamp: new Date()
      }
    });

    // Fetch attendance with related user for syncing
    const attendanceWithUser = await prisma.attendance.findMany({
      where: { id: attendance.id },
      include: { user: true }
    });
    const attendanceWithUserRecord = attendanceWithUser[0];

    // Sync (local Excel + Google Sheets if configured)
    syncToExcel();
    // Also attempt to append only the new/updated row to Google Sheets (faster incremental sync)
    if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON && process.env.GOOGLE_SHEET_ID) {
      try {
        await sheetsService.appendAttendanceRow(attendanceWithUserRecord);
      } catch (e) {
        console.error('Incremental sheets append failed:', e.message || e);
      }
    }

    res.json(attendance);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMyAttendance = async (req, res) => {
    const { employee_id } = req.user;
    try {
        const attendance = await prisma.attendance.findMany({
            where: { employee_id },
            orderBy: { date: 'desc' }
        });
        res.json(attendance);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getAllAttendance = async (req, res) => {
    try {
        const attendance = await prisma.attendance.findMany({
            include: {
                user: true
            },
            orderBy: {
                date: 'desc'
            }
        });
        res.json(attendance);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteAttendance = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.attendance.delete({ where: { id: id } });
        res.json({ message: 'Attendance record deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.downloadExcel = async (req, res) => {
    // Regenerate Excel file to ensure latest data
    await syncToExcel();
    
    if (fs.existsSync(EXCEL_FILE)) {
        res.download(EXCEL_FILE);
    } else {
        res.status(404).json({ message: 'Excel file could not be generated' });
    }
};
