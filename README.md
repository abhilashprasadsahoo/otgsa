# ODISSITECH Attendance Management System

A secure web-based attendance system with Admin & Employee roles.

## Prerequisites

- Node.js (v16 or higher) installed.

## Setup Instructions

### 1. Server Setup

Open a terminal in the `server` folder:

```bash
cd server
npm install
npx prisma generate
npx prisma db push
node server.js
```

The server will run on `http://localhost:5000`.
**Initial Admin Credentials:**
- Email: `admin@odissitech.com`
- Password: `admin123`

### 2. Client Setup

Open a new terminal in the `client` folder:

```bash
cd client
npm install
npm run dev
```

The client will usually run on `http://localhost:5173`.

## Features

- **Admin Dashboard**:
    - Manage Employees (Add/View/Deactivate).
    - View all attendance records.
    - Download Attendance as Excel.
    - Automatic Excel Sync (saved as `attendance_sheet.xlsx` in project root).
- **Employee Dashboard**:
    - Mark Attendance (Morning IN, Lunch OUT, Lunch IN, Office OUT).
    - View personal attendance history.
    - Logic ensures correct sequence of attendance marking.
