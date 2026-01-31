const { google } = require('googleapis');

function getSheetsClient() {
  const saJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!saJson || !sheetId) return null;
  let key;
  try {
    key = typeof saJson === 'string' ? JSON.parse(saJson) : saJson;
  } catch (e) {
    console.error('Invalid GOOGLE_SERVICE_ACCOUNT_JSON:', e.message);
    return null;
  }

  const jwtClient = new google.auth.JWT(
    key.client_email,
    null,
    key.private_key,
    ['https://www.googleapis.com/auth/spreadsheets']
  );

  const sheets = google.sheets({ version: 'v4', auth: jwtClient });
  return { sheets, sheetId };
}

async function appendAttendanceRow(record) {
  const client = getSheetsClient();
  if (!client) return;
  const { sheets, sheetId } = client;

  const row = [
    record.date,
    record.employee_id,
    record.user ? record.user.name : '',
    record.morning_in ? new Date(record.morning_in).toLocaleTimeString() : '',
    record.remarks || '',
    record.lunch_out ? new Date(record.lunch_out).toLocaleTimeString() : '',
    record.lunch_in ? new Date(record.lunch_in).toLocaleTimeString() : '',
    record.office_out ? new Date(record.office_out).toLocaleTimeString() : ''
  ];

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: 'Attendance!A:H',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [row] }
    });
  } catch (err) {
    console.error('Google Sheets append error:', err.message);
  }
}

module.exports = { appendAttendanceRow };
