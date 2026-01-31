import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Clock, Coffee, Briefcase, CheckCircle, AlertCircle } from 'lucide-react';

const EmployeeDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [attendance, setAttendance] = useState([]);
  const [todayRecord, setTodayRecord] = useState(null);
  const [showRemarkModal, setShowRemarkModal] = useState(false);
  const [remarkText, setRemarkText] = useState('');
  const [remarkType, setRemarkType] = useState(null);
  
  // Get today's date in YYYY-MM-DD format to match server
  const todayDate = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchMyAttendance();
  }, []);

  const fetchMyAttendance = async () => {
    try {
      const res = await axios.get('https://otgsa.onrender.com/api/attendance/my');
      setAttendance(res.data);
      const today = res.data.find(r => r.date === todayDate);
      setTodayRecord(today || {});
    } catch (err) {
      console.error(err);
    }
  };

  const markAttendance = async (type, remarks = null) => {
    if (!remarks && !window.confirm(`Confirm mark ${type.replace('_', ' ').toUpperCase()}?`)) return;

    try {
      await axios.post('https://otgsa.onrender.com/api/attendance/mark', { type, remarks });
      fetchMyAttendance();
      setShowRemarkModal(false);
      setRemarkText('');
      setRemarkType(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Error marking attendance');
    }
  };

  const handleAttendanceClick = (type) => {
     // Check for lateness and remarks
     const now = new Date();
     const hours = now.getHours();
     const minutes = now.getMinutes();
     const currentTime = hours * 60 + minutes;
     
     // Morning IN limit: 10:45 (10 * 60 + 45 = 645 minutes)
     if (type === 'morning_in' && currentTime > 645) {
         setRemarkType(type);
         setShowRemarkModal(true);
         return;
     }
 


     markAttendance(type);
  };

  const handleRemarkSubmit = (e) => {
      e.preventDefault();
      if (!remarkText.trim()) return;
      markAttendance(remarkType, remarkText);
  };

  const getButtonStatus = (type) => {
    // If already marked, disable
    if (todayRecord && todayRecord[type]) return { disabled: true, label: 'Done', color: 'bg-gray-400' };

    // Sequence Logic
    if (type === 'morning_in') return { disabled: false, label: 'Morning IN', color: 'bg-green-600 hover:bg-green-700' };
    
    if (type === 'lunch_out') {
       if (!todayRecord?.morning_in) return { disabled: true, label: 'Locked', color: 'bg-gray-300' };
       return { disabled: false, label: 'Lunch OUT', color: 'bg-orange-500 hover:bg-orange-600' };
    }

    if (type === 'lunch_in') {
        if (!todayRecord?.lunch_out) return { disabled: true, label: 'Locked', color: 'bg-gray-300' };
        return { disabled: false, label: 'Lunch IN', color: 'bg-blue-500 hover:bg-blue-600' };
    }

    if (type === 'office_out') {
        if (!todayRecord?.lunch_in) return { disabled: true, label: 'Locked', color: 'bg-gray-300' };
        return { disabled: false, label: 'Office OUT', color: 'bg-red-600 hover:bg-red-700' };
    }

    return { disabled: true, label: 'Locked', color: 'bg-gray-300' };
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8 bg-white p-6 rounded-lg shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Welcome, {user?.name}</h1>
            <p className="text-gray-500">Employee ID: {user?.employee_id}</p>
          </div>
          <button onClick={logout} className="text-red-600 hover:text-red-800 font-medium">Logout</button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {['morning_in', 'lunch_out', 'lunch_in', 'office_out'].map(type => {
             const status = getButtonStatus(type);
             const icons = {
                morning_in: <Clock className="mb-2" />,
                lunch_out: <Coffee className="mb-2" />,
                lunch_in: <Coffee className="mb-2" />,
                office_out: <Briefcase className="mb-2" />
             };

             return (
               <button 
                 key={type}
                 onClick={() => handleAttendanceClick(type)}
                 disabled={status.disabled}
                 className={`flex flex-col items-center justify-center p-6 rounded-xl text-white shadow-md transition-all ${status.color} ${status.disabled ? 'cursor-not-allowed opacity-70' : 'transform hover:scale-105'}`}
               >
                 {icons[type]}
                 <span className="font-semibold text-lg">{status.label}</span>
                 {todayRecord && todayRecord[type] && <span className="text-xs mt-1">{new Date(todayRecord[type]).toLocaleTimeString()}</span>}
               </button>
             );
          })}
        </div>

        {showRemarkModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
                    <h3 className="text-xl font-bold mb-4 text-red-600 flex items-center gap-2">
                        <AlertCircle /> Late Arrival Reason Required
                    </h3>
                    <p className="mb-4 text-gray-600">You are marking attendance after the allowed time. Please provide a reason to proceed.</p>
                    <form onSubmit={handleRemarkSubmit}>
                        <textarea 
                            className="w-full p-3 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-red-500"
                            rows="4"
                            placeholder="Enter your reason here..."
                            value={remarkText}
                            onChange={e => setRemarkText(e.target.value)}
                            required
                        ></textarea>
                        <div className="flex justify-end gap-2">
                            <button 
                                type="button" 
                                onClick={() => { setShowRemarkModal(false); setRemarkText(''); }}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium"
                            >
                                Submit & Mark
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><CheckCircle size={20} className="text-green-600"/> Attendance History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="p-3">Date</th>
                  <th className="p-3">Morning IN</th>
                  <th className="p-3">Lunch OUT</th>
                  <th className="p-3">Office OUT</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map(record => (
                  <tr key={record.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{record.date}</td>
                    <td className="p-3">{record.morning_in ? new Date(record.morning_in).toLocaleTimeString() : '-'}</td>
                    <td className="p-3">{record.lunch_out ? new Date(record.lunch_out).toLocaleTimeString() : '-'}</td>
                    <td className="p-3">{record.office_out ? new Date(record.office_out).toLocaleTimeString() : '-'}</td>
                  </tr>
                ))}
                {attendance.length === 0 && (
                    <tr><td colSpan="4" className="p-4 text-center text-gray-500">No records found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
