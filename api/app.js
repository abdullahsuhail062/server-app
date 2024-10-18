// import { sql } from "@vercel/postgres";
// import { config } from 'dotenv';
//  import dotenv from 'dotenv';
//  dotenv.config

// import express from 'express'
// var app = express();
// app.use(express.json());


// import bodyParser from 'body-parser';
// import cors from 'cors';

// app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

// app.use(bodyParser.json());
// app.use(cors({
//   origin: '*',
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['X-CSRF-Token', 'X-Requested-With', 'Content-Type', 'Authorization'],
//   credentials: true
// }));
// config({ path: '.env.development.local' });
// import { Client } from 'pg'; // Import the Client from pg package
// const client = new Client({
//   connectionString: process.env.POSTGRES_DATABASE, // Use the DATABASE_URL environment variable for connection
// });

// client.connect();
// process.env.POSTGRES_DATABASE 

// app.use((req, res, next) => {
//   res.setHeader("Content-Security-Policy", "default-src 'none'; img-src 'self' https://server-app-chi.vercel.app; script-src 'self'; style-src 'self'");
//   next();
// });

// // Enable pre-flight requests for CORS
// app.options('/api/registerUser', function (req, res) {
//   res.setHeader("Access-Control-Allow-Origin", "*");
//   res.setHeader('Access-Control-Allow-Methods', '*');
//   res.setHeader("Access-Control-Allow-Headers", "*");
//   res.end();
// });

// app.post('/api/registerUser', async function (req, res, next) {
//   const { username, email, password } = req.body; // Destructure all variables one by one
//   const errors = {};

//   // Validate username
//   if (!username || username.length < 3) {
//     errors.username = 'Username must be at least 3 characters long';
//   }
//   // Validate email with a regular expression
//   const emailRegx = /^[a-zA-Z0-9._%+-]+@example\.com$/;
//   if (!email || !emailRegx.test(email)) {
//     errors.email = 'Invalid email address';
//   }

//   // Validate password length and pattern
//   const passwordRegx = /^[a-zA-Z0-9]+$/;
//   if (!password || password.length < 8 || !passwordRegx.test(password)) {
//     errors.password = 'Password must be at least 8 characters long and alphanumeric';
//   }

//   // Check if there are validation errors
//   if (Object.keys(errors).length > 0) {
//     // Send a 400 response with the errors object
//     return res.status(400).json({ errors });
//   }

//   try {
//     // Query to check if username or email exists
//     const checkQuery = `
//       SELECT username, email
//       FROM users
//       WHERE username = $1 OR email = $2
//     `;
//     const values = [username, email];

//     const result = await client.query(checkQuery, values);

//     if (result.rows.length > 0) {
//       // Username or email already exists
//       return res.status(400).json({ message: 'Username or email already exists' });
//     }

//     // If no existing user is found, insert the new user
//     const insertQuery = `
//       INSERT INTO users (username, email, password)
//       VALUES ($1, $2, $3)
//       RETURNING id, username, email
//     `;
//     const insertValues = [username, email, password];
//     const insertResult = await client.query(insertQuery, insertValues);

//     // Send success response
//     return res.status(201).json({
//       message: 'User registered successfully',
//       user: insertResult.rows[0],
//     });
//   } catch (error) {
//     console.error('Error registering user:', error);
//     return res.status(500).json({ message: 'Internal server error' });
//   }
// });

// const PORT = process.env.PORT || 3000

// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });


import dotenv from 'dotenv';
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

app.post('/api/registerUser', async (req, res) => {
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
    // Query to check if username or email exists
    const result = await sql`
      SELECT username, email
      FROM users
      WHERE username = ${username} OR email = ${email};
    `;

    if (result.length > 0) {
      // Username or email already exists
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    // If no existing user is found, insert the new user
    const hashedPassword = await bcrypt.hash(password, 10); // Hash the password before storing
    const insertResult = await sql`
      INSERT INTO users (username, email, password)
      VALUES (${username}, ${email}, ${hashedPassword})
      RETURNING id, username, email;
    `;

    // Send success response
    return res.status(201).json({
      message: 'User registered successfully',
      user: insertResult[0],
    });
  } catch (error) {
    console.error('Error registering user:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000; // Default for local testing

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
