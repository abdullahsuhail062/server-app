import { sql } from "@vercel/postgres";
import { VercelRequest, VercelResponse } from '@vercel/node';
var express = require('express');
var app = express();
app.use(express.json());

const bodyParser = require('body-parser');
var cors = require('cors');
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

app.use(bodyParser.json());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['X-CSRF-Token', 'X-Requested-With', 'Content-Type', 'Authorization'],
  credentials: true
}));
app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy", "default-src 'none'; img-src 'self' https://server-app-chi.vercel.app; script-src 'self'; style-src 'self'");
  next();
});

// Enable pre-flight requests for CORS
app.options('/api/registerUser', function (req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader('Access-Control-Allow-Methods', '*');
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.end();
});

app.post('/api/registerUser', async function (req, res, next) {
  const { username, email, password } = req.body; // Destructure all variables one by one
  const errors = {};

  // Validate username
  if (!username || username.length < 3) {
    errors.username = 'Username must be at least 3 characters long';
  }
  // Validate email with a regular expression
  const emailRegx = /^[a-zA-Z0-9._%+-]+@example\.com$/;
  if (!email || !emailRegx.test(email)) {
    errors.email = 'Invalid email address';
  }

  // Validate password length and pattern
  const passwordRegx = /^[a-zA-Z0-9]+$/;
  if (!password || password.length < 8 || !passwordRegx.test(password)) {
    errors.password = 'Password must be at least 8 characters long and alphanumeric';
  }

  // Check if there are validation errors
  if (Object.keys(errors).length > 0) {
    // Send a 400 response with the errors object
    return res.status(400).json({ errors });
  }

  try {
    // Insert the validated data into the Vercel Postgres database
    const result = await sql`
      INSERT INTO users (username, email, password) 
      VALUES (${username}, ${email}, ${password})
      RETURNING *;
    `;

    // Send a success response with the inserted data
    res.status(200).json({ message: 'User registered successfully', user: result.rows[0] });
  } catch (error) {
    console.error('Error inserting user:', error);
    res.status(500).json({ error: 'Failed to register user', details: error.message });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
