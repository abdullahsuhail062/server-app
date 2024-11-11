// import dotenv from 'dotenv';
// import bcrypt from 'bcryptjs';  // ES6 import
// dotenv.config({ path: '.env.development.local' });

// import express from 'express';
// import { sql } from "@vercel/postgres";
// import bodyParser from 'body-parser';
// import cors from 'cors';

// const app = express();
// app.use(express.json());
// app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
// app.use(bodyParser.json());
// app.use(cors({
//   origin: '*',
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['X-CSRF-Token', 'X-Requested-With', 'Content-Type', 'Authorization'],
//   credentials: true
// }));

// app.use((req, res, next) => {
//   res.setHeader("Content-Security-Policy", "default-src 'none'; img-src 'self' https://server-app-chi.vercel.app; script-src 'self'; style-src 'self'");
//   next();
// });
// import pkg from 'pg';
// const { Client } = pkg;

// const client = new Client({
//   host: process.env.POSTGRES_HOST,          // Database host (e.g., 'localhost' or your cloud database host)
//   port: process.env.POSTGRES_PORT,          // Database port (default is 5432 for PostgreSQL)
//   user: process.env.POSTGRES_USER,          // Database username
//   password: process.env.POSTGRES_PASSWORD,  // Database password
//   database: process.env.POSTGRES_DATABASE,  // Database name
//   ssl: {
//     rejectUnauthorized: false               // Set to true for production with valid certs
//   },
//   connectionTimeoutMillis: 10000            // 10 seconds timeout for connecting
// });

// client.connect()
//   .then(() => console.log('Connected to the database!'))
//   .catch(err => console.error('Connection error', err.stack));
  

//   app.post('/api/registerUser', async (req, res) => {
//     const token = '2wbUqQdPIKP43QUJ5o83tm5o';
//     res.cookie('__vercel_live_token', token, {
//       httpOnly: true,
//       secure: true,
//       sameSite: 'None'
//     });
//     const errors = {};  
//     const { username, email, password } = req.body;
    

//     // Validate username
//     if (!username || username.length < 3) {
//       errors.username = 'username must be at least 3 characters long';
//     }
  
//     // Validate email
//     const emailRegx = /^[a-zA-Z0-9._%+-]+@example\.com$/;
//     if (!email || !emailRegx.test(email)) {
//       errors.email = 'Invalid email address';
//     }
  
//     // Validate password
//     const passwordRegx = /^[a-zA-Z0-9]+$/;
//     if (!password || password.length < 8 || !passwordRegx.test(password)) {
//       errors.password = 'Password must be at least 8 characters long and alphanumeric';
//     }
  
//     // If there are any errors, return them
//     if (Object.keys(errors).length > 0) {
//       return res.status(400).json(errors);
//     }
  
//   const dataBaseValidationErrors ={}


  
//     try {
     
//       const resultUsername = await client.query(`SELECT COUNT(*) AS user_count FROM Users WHERE username = '${username}'`);
//       const usernameExist = resultUsername.rows[0].user_count > 0;
      
//       if (usernameExist) {
//           dataBaseValidationErrors.usernameExist = 'Username already exist'
//       } 
      
      
     
  
//       // Check if email exists
//       const resultEmail = await client.query(`SELECT COUNT(*) AS user_count FROM Users WHERE email = '${email}'`);
//       const userEmailExist = resultEmail.rows[0].user_count > 0;
      
//       if (userEmailExist) {
//           dataBaseValidationErrors.userEmailExist = 'Email already exist'
//         } 
//          // If there are any errors, return them
//     if (Object.keys(dataBaseValidationErrors).length > 0) {
//       console.log(dataBaseValidationErrors);
      
//       return res.status(401).json(dataBaseValidationErrors);
//     }
     
  
//       // If no existing user is found, insert the new user
//       const hashedPassword = await bcrypt.hash(password, 10);
//       const insertResult = await sql`
//         INSERT INTO users (username, email, password)
//         VALUES (${username}, ${email}, ${hashedPassword})
//         RETURNING id, username, email;`;
  
//       return res.status(201).json({
//         message: 'User registered successfully',
//         user: insertResult[0],
//       });
   

//     } catch (error) {
//       console.error('Error registering user:', error);
//       return res.status(500).json({ message: 'Internal server error', error: error.message });
//     }
//   });
  

  
// const PORT = 3000
// app.listen(PORT, () => {
//   console.log('app running on port 3000');
  
// })


import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
dotenv.config({ path: '.env.development.local' });

import express from 'express';
import { sql } from "@vercel/postgres";
import bodyParser from 'body-parser';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,

  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 10000
});

client.connect()
  .then(() => console.log('Connected to the database!'))
  .catch(err => console.error('Connection error', err.stack));

// Register User Route
app.post('/api/registerUser', async (req, res) => {
  const token = '2wbUqQdPIKP43QUJ5o83tm5o';
  res.cookie('__vercel_live_token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'None'
  });

  const errors = {};  
  const { username, email, password } = req.body;

  if (!username || username.length < 3) {
    errors.username = 'username must be at least 3 characters long';
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
    return res.status(400).json(errors);
  }

  const dataBaseValidationErrors = {};

  try {
    const resultUsername = await client.query(`SELECT COUNT(*) AS user_count FROM Users WHERE username = '${username}'`);
    const usernameExist = resultUsername.rows[0].user_count > 0;
    
    if (usernameExist) {
      dataBaseValidationErrors.usernameExist = 'Username already exists';
    }

    const resultEmail = await client.query(`SELECT COUNT(*) AS user_count FROM Users WHERE email = '${email}'`);
    const userEmailExist = resultEmail.rows[0].user_count > 0;

    if (userEmailExist) {
      dataBaseValidationErrors.userEmailExist = 'Email already exists';
    }

    if (Object.keys(dataBaseValidationErrors).length > 0) {
      return res.status(401).json(dataBaseValidationErrors);
    }

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

// Login User Route
app.post('/api/loginUser', async (req, res) => {
  const { email, password } = req.body;
 const errors ={}

  try {
    // Check if user exists
    const result = await client.query('SELECT * FROM Users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      errors.email = 'Invalid email or password' 
      console.log(errors.email)
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      errors.password = 'Invalid email or password'
      console.log(errors.password)

    }
    if (Object.keys(errors).length >0) {
      return res.status(400).json(errors)
      
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    return res.json({ message: 'Login successful', token });
  } catch (error) {
    console.error('Error logging in:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  
  if (!authHeader) {
    console.log('No token provided');
    
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  console.log(token);
  

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;  
    console.log(req.userId);
              // Extract user ID from token
    next();
  } catch (error) {
    console.log('Invalid or expired token');
    
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

app.get('/api/fetchUserProfile',authMiddleware,async (req, res)=> {
  const userId = req.userId; // Retrieve user ID from the request object or token

  try {
    const result = await client.query(
      'SELECT username, email FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result.rows[0];
    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});




const PORT = 3000;
app.listen(PORT, () => {
  console.log(`App running on port ${PORT}`);
});
