import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await login(email, password);
    if (res.success) {
      // Navigate based on role is handled in ProtectedRoute or here?
      // Better here or let the dashboard redirect.
      // We will navigate to /dashboard and let the router decide which component to render
      navigate('/'); 
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 via-black to-red-900">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md border-t-4 border-red-600">
        <h1 className="text-4xl font-extrabold mb-2 text-center text-red-600 tracking-wider">OTGS</h1>
        <h2 className="text-xl font-semibold mb-6 text-center text-gray-800">ODISSITECH Login</h2>
        {error && <div className="bg-red-100 text-red-700 p-2 mb-4 rounded border border-red-200">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Email</label>
            <input 
              type="email" 
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">Password</label>
            <input 
              type="password" 
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          <button type="submit" className="w-full bg-red-600 text-white p-3 rounded font-bold hover:bg-red-700 transition duration-200 shadow-lg">Login</button>
        </form>
      </div>
    </div>
  );
};

export default Login;
