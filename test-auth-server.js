const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get('/api/test', (req, res) => {
  console.log('Test route hit');
  res.json({ msg: 'API is working' });
});

// User routes
app.post('/api/users/register', (req, res) => {
  console.log('Register route hit');
  console.log('Request body:', req.body);
  res.json({ token: 'test-token' });
});

app.post('/api/users/login', (req, res) => {
  console.log('Login route hit');
  console.log('Request body:', req.body);
  res.json({ token: 'test-token' });
});

app.get('/api/users/me', (req, res) => {
  console.log('Me route hit');
  res.json({ name: 'Test User', email: 'test@example.com' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log('Available routes:');
  console.log('- GET /api/test');
  console.log('- POST /api/users/register');
  console.log('- POST /api/users/login');
  console.log('- GET /api/users/me');
});
