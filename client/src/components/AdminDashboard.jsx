import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { LogOut, Download, UserPlus, Users, Calendar, Trash2, FileSpreadsheet } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const AdminDashboard = () => {
  const { logout } = useContext(AuthContext);
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [view, setView] = useState('attendance'); // 'attendance' or 'employees'
  const [newEmployee, setNewEmployee] = useState({ name: '', email: '', password: '', employee_id: '', role: 'EMPLOYEE' });

  useEffect(() => {
    fetchEmployees();
    fetchAttendance();
  }, []);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/auth/employees', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmployees(res.data);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch employees: ' + (err.response?.data?.error || err.response?.data?.message || err.message));
    }
  };

  const fetchAttendance = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/attendance/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAttendance(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/auth/register', newEmployee, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Employee Created Successfully');
      setNewEmployee({ name: '', email: '', password: '', employee_id: '', role: 'EMPLOYEE' });
      fetchEmployees();
    } catch (err) {
      alert(err.response?.data?.error || 'Error creating employee');
    }
  };

  const deleteEmployee = async (id) => {
      if (!window.confirm('Are you sure you want to delete this employee? This will also delete all their attendance records.')) return;
      try {
          const token = localStorage.getItem('token');
          await axios.delete(`/api/auth/employees/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          fetchEmployees();
          fetchAttendance(); // Refresh attendance as well
      } catch (err) {
          alert(err.response?.data?.error || 'Error deleting employee');
      }
  };

  const deleteAttendance = async (id) => {
      if (!window.confirm('Are you sure you want to delete this attendance record?')) return;
      try {
          const token = localStorage.getItem('token');
          await axios.delete(`/api/attendance/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          fetchAttendance();
      } catch (err) {
          alert(err.response?.data?.error || 'Error deleting attendance');
      }
  };

  const downloadExcel = () => {
    window.open('http://localhost:5000/api/attendance/download', '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8 bg-white p-4 rounded shadow">
          <h1 className="text-2xl font-bold text-blue-900">Admin Dashboard</h1>
          <div className="flex gap-4">
             <button onClick={() => setView('attendance')} className={`flex items-center gap-2 px-4 py-2 rounded ${view === 'attendance' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'}`}>
              <Calendar size={20} /> Attendance
            </button>
            <button onClick={() => setView('employees')} className={`flex items-center gap-2 px-4 py-2 rounded ${view === 'employees' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'}`}>
              <Users size={20} /> Employees
            </button>
            <button onClick={downloadExcel} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
              <Download size={20} /> Export Excel
            </button>
            <button onClick={logout} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
              <LogOut size={20} /> Logout
            </button>
          </div>
        </header>

        {view === 'employees' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-white p-6 rounded shadow h-fit">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2"><UserPlus size={20}/> Add Employee</h3>
              <form onSubmit={handleCreateEmployee} className="space-y-4">
                <input placeholder="Employee ID" className="w-full p-2 border rounded" value={newEmployee.employee_id} onChange={e => setNewEmployee({...newEmployee, employee_id: e.target.value})} required />
                <input placeholder="Full Name" className="w-full p-2 border rounded" value={newEmployee.name} onChange={e => setNewEmployee({...newEmployee, name: e.target.value})} required />
                <input placeholder="Email" type="email" className="w-full p-2 border rounded" value={newEmployee.email} onChange={e => setNewEmployee({...newEmployee, email: e.target.value})} required />
                <input placeholder="Password" type="password" className="w-full p-2 border rounded" value={newEmployee.password} onChange={e => setNewEmployee({...newEmployee, password: e.target.value})} required />
                <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Create Account</button>
              </form>
            </div>
            
            <div className="lg:col-span-2 bg-white p-6 rounded shadow overflow-auto">
              <h3 className="text-xl font-semibold mb-4">Employee List</h3>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b">
                    <th className="p-2">ID</th>
                    <th className="p-2">Name</th>
                    <th className="p-2">Email</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map(emp => (
                    <tr key={emp.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">{emp.employee_id}</td>
                      <td className="p-2">{emp.name}</td>
                      <td className="p-2">{emp.email}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${emp.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {emp.status ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-2">
                        <button onClick={() => deleteEmployee(emp.id)} className="text-red-500 hover:text-red-700">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === 'attendance' && (
          <div className="bg-white p-6 rounded shadow overflow-auto">
             <h3 className="text-xl font-semibold mb-4">Attendance Records</h3>
             <table className="w-full text-left">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="p-3">Date</th>
                    <th className="p-3">ID</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Morning IN</th>
                    <th className="p-3">Remarks</th>
                    <th className="p-3">Lunch OUT</th>
                    <th className="p-3">Lunch IN</th>
                    <th className="p-3">Office OUT</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map(record => (
                    <tr key={record.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">{record.date}</td>
                      <td className="p-3">{record.employee_id}</td>
                      <td className="p-3">{record.user?.name}</td>
                      <td className="p-3 text-green-600">{record.morning_in ? new Date(record.morning_in).toLocaleTimeString() : '-'}</td>
                      <td className="p-3 text-sm text-gray-600">{record.remarks || '-'}</td>
                      <td className="p-3 text-orange-600">{record.lunch_out ? new Date(record.lunch_out).toLocaleTimeString() : '-'}</td>
                      <td className="p-3 text-blue-600">{record.lunch_in ? new Date(record.lunch_in).toLocaleTimeString() : '-'}</td>
                      <td className="p-3 text-red-600">{record.office_out ? new Date(record.office_out).toLocaleTimeString() : '-'}</td>
                      <td className="p-3">
                         <button onClick={() => deleteAttendance(record.id)} className="text-red-500 hover:text-red-700">
                           <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
