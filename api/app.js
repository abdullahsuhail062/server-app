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
  const result = await client.query('SELECT COUNT(*) FROM users');
  console.log(result); // Check the structure of result

  app.post('/api/registerUser', async (req, res) => {
    const token = 'rXAPGKlhFRMWFEtztrVsUNmm';
    res.cookie('__vercel_live_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'None'
    });
  
    const { username, email, password } = req.body;
    const errors = {};
  
    if (!username || username.length < 3) {
      errors.username = 'Username must be at least 3 characters long';
    }
  
    const emailRegx = /^[a-zA-Z0-9._%+-]+@example\.com$/;
    if (!email || !emailRegx.test(email)) {
      errors.email = 'Invalid email address';
    }
  
    const passwordRegx = /^[a-zA-Z0-9]+$/;
    if (!password || password.length < 8 || !passwordRegx.test(password)) {
      errors.password = 'Password must be at least 8 characters long and alphanumeric';
    }
  
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }
  
    try {
     
      const result = await client.query(`SELECT COUNT(*) AS user_count FROM Users WHERE username = '${username}'`);
      const userExists = result.rows[0].user_count > 0;
      
      if (userExists) {
          console.log("Username already exists.");
          return res.status(400).json({usernameExist: 'username already exist'})
      } 
      
      
     
  
      // Check if email exists
      const emailResult = await sql`
        SELECT COUNT(*) AS count
        FROM users
        WHERE email = ${email}`;
  
      if (emailResult[0].count > 0) {
        return res.status(400).json({ message: 'Email already exists' });
      }
     
  
      // If no existing user is found, insert the new user
      const hashedPassword = await bcrypt.hash(password, 10);
      const insertResult = await sql`
        INSERT INTO users (username, email, password)
        VALUES (${username}, ${email}, ${hashedPassword})
        RETURNING id, username, email;`;
  
      return res.status(201).json({
        message: 'User registered successfully',
        user: insertResult[0],
      });
   

    } catch (error) {
      console.error('Error registering user:', error);
      return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  });
  


const PORT =process.env.PORT || 3000 // Default for local testing

app.listen(PORT, () => {
})// instead of sending username or email already exist error i