import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';  // ES6 import
dotenv.config({ path: '.env.development.local' });

import express from 'express';
import { sql } from "@vercel/postgres";
import bodyParser from 'body-parser';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
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
import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  host: process.env.POSTGRES_HOST,          // Database host (e.g., 'localhost' or your cloud database host)
  port: process.env.POSTGRES_PORT,          // Database port (default is 5432 for PostgreSQL)
  user: process.env.POSTGRES_USER,          // Database username
  password: process.env.POSTGRES_PASSWORD,  // Database password
  database: process.env.POSTGRES_DATABASE,  // Database name
  ssl: {
    rejectUnauthorized: false               // Set to true for production with valid certs
  },
  connectionTimeoutMillis: 10000            // 10 seconds timeout for connecting
});

client.connect()
  .then(() => console.log('Connected to the database!'))
  .catch(err => console.error('Connection error', err.stack));



app.post('/api/registerUser', async (req, res) => {
const token = 'rXAPGKlhFRMWFEtztrVsUNmm'
  res.cookie('__vercel_live_token', token, {
    httpOnly: true,
    secure: true, // Cookie is only sent over HTTPS
    sameSite: 'None' // Allow the cookie to be sent in cross-site contexts
  });
  
  const { username, email, password } = req.body; // Destructure all variables one by one
  const errors = {};

  // Validate username
  if (!username || username.length < 3) {
    errors.username = 'Username must be at least 3 characters long';
  }
  
  // Validate email with a regular expression
  const emailRegx = /^[a-zA-Z0-9._%+-]+@example\.com$/; // Change the domain as needed
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
    // Query to check if username exists
    const usernameResult = await sql`
      SELECT username
      FROM users
      WHERE username = ${username}`;
  
    if (usernameResult.length > 0) {
      // Username already exists
      return res.status(400).json({ message: 'Username already exists' });
    }
  
    // Query to check if email exists
    const emailResult = await sql`
      SELECT email
      FROM users
      WHERE email = ${email}`;
  
    if (emailResult.length > 0) {
      // Email already exists
      return res.status(400).json({ message: 'Email already exists' });
    }
  
    // If no existing user is found, insert the new user
    const hashedPassword = await bcrypt.hash(password, 10); // Hash the password before storing
    const insertResult = await sql`
      INSERT INTO users (username, email, password)
      VALUES (${username}, ${email}, ${hashedPassword})
      RETURNING id, username, email;`;
  
    // Send success response
    return res.status(201).json({
      message: 'User registered successfully',
      user: insertResult[0],
    });
  } catch (error) {
    console.error('Error registering user:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
})

const PORT =process.env.PORT || 3000 // Default for local testing

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
})
