const adminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6IkFETUlOIiwiZW1wbG95ZWVfaWQiOiJBRE1JTjAwMSIsImlhdCI6MTc2OTg1NjQ4NiwiZXhwIjoxNzY5OTQyODg2fQ.55Z_Xq4YZTewEe2P55iBBrBW2LzheYJhurmCXYg9y5M';

(async () => {
  const res = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      employee_id: 'EMP002',
      name: 'John Doe',
      email: 'employee@odissitech.com',
      password: 'emp123',
      role: 'EMPLOYEE'
    })
  });
  const data = await res.json();
  console.log('STATUS:', res.status);
  console.log(JSON.stringify(data, null, 2));
})();
