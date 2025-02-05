import { OpenAI } from "openai";
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
dotenv.config({ path: '.env.development.local' });
import postgres from 'postgres'

import express from 'express';
// import { sql } from "@vercel/postgres";
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

// const sql = new Client({
//   host: process.env.POSTGRES_HOST,
//   port: process.env.POSTGRES_PORT,
//   user: process.env.POSTGRES_USER,
//   password: process.env.POSTGRES_PASSWORD,
//   database: process.env.POSTGRES_DATABASE,

//   ssl: {
//     rejectUnauthorized: false
//   },
//   connectionTimeoutMillis: 10000
// });

// sql.connect()
//   .then(() => console.log('Connected to the database!!!'))
//   .catch(err => console.error('Connection error', err.stack));


import { neon } from '@neondatabase/serverless';
const { PGHOST, PGDATABASE, PGUSER, PGPASSWORD } = process.env;

//const sql = neon(process.env.DATABASE_URL);
const sql = neon(`postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}/${PGDATABASE}?sslmode=require`);

// async function getPgVersion() {
//   try {
//     const result = await sql`SELECT version();`;
//     console.log("PostgreSQL Version:", result[0].version);
//   } catch (error) {
//     console.error("Error fetching PostgreSQL version:", error);
//   }
// }
 


// getPgVersion();

// Register User Route
app.post('/api/registerUser', async (req, res) => {
  const cokieToken = '2wbUqQdPIKP43QUJ5o83tm5o';
  res.cookie('__vercel_live_token', cokieToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'None'
  });

  const errors = {};  
  const { username, email, password } = req.body;
  console.log(req.body);
  


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
    const resultUsername = await sql(`SELECT * FROM users WHERE username = ${username}`);
    const usernameExist = resultUsername.rows[0].user_count > 0;
    
    if (usernameExist) {
      dataBaseValidationErrors.usernameExist = 'Username already exists';
    }else{ console.log('Email Query Result (Full Response):', resultEmail);
      console.log('Rows:', resultEmail.rows); // Check if 'rows' is defined
      console.log('Rows[0]:', resultEmail.rows?.[0]); // Check if 'rows[0]' exists
          const userEmailExist = resultEmail.rows[0].user_count > 0;
      }

    const resultEmail = await sql(`SELECT * FROM users WHERE email = ${email}`);
   
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
  RETURNING id, username, email;
`;

      console.log(insertResult)
    
// Extract the user details from the insertResult
const newUser = insertResult.rows[0];

//Generate the token using the new user's details
const token = jwt.sign(
  { id: newUser.id, email: newUser.email },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
);

console.log('Generated token:', token);

// Return the response with the token
return res.status(201).json({
  message: 'User registered successfully',token   
});

  } catch (error) {
    console.error('Error registering user:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});
// app.post('/api/registerUser', async (req, res) => {
//   const cokieToken = '2wbUqQdPIKP43QUJ5o83tm5o';
//   res.cookie('__vercel_live_token', cokieToken, {
//     httpOnly: true,
//     secure: true,
//     sameSite: 'None'
//   });

//   const errors = {};  
//   const { username, email, password } = req.body;
//   console.log('Received Request Body:', req.body); // ✅ Log request body

//   if (!username || username.length < 3) {
//     errors.username = 'Username must be at least 3 characters long';
//   }

//   const emailRegx = /^[a-zA-Z0-9._%+-]+@example\.com$/;
//   if (!email || !emailRegx.test(email)) {
//     errors.email = 'Invalid email address';
//   }

//   const passwordRegx = /^[a-zA-Z0-9]+$/;
//   if (!password || password.length < 8 || !passwordRegx.test(password)) {
//     errors.password = 'Password must be at least 8 characters long and alphanumeric';
//   }

//   if (Object.keys(errors).length > 0) {
//     console.log('Validation Errors:', errors);
//     return res.status(400).json(errors);
//   }

//   const dataBaseValidationErrors = {};

//   try {
//     // 🛠️ **Debugging: Check if the SQL queries return the expected results**
//     const resultUsername = await sql`SELECT COUNT(*) AS user_count FROM users WHERE username = ${username}`;
//     console.log('Username Query Result:', resultUsername); // ✅ Log result
//     const usernameExist = resultUsername.rows[0].length > 0
//     if (usernameExist) {
     
//         dataBaseValidationErrors.usernameExist = 'Username already exists';
      
//     } else {
//       console.error('Error: Unexpected response for username query');
//     }

//     const resultEmail = await sql`SELECT COUNT(*) AS user_count FROM users WHERE email = ${email}`;
//     console.log('Email Query Result:', resultEmail); // ✅ Log result

//      const userEmailExist = resultUsername.rows[0].length > 0;
// if (userEmailExist) {
//   dataBaseValidationErrors.userEmailExist = 'Email already exists';
// } else {
//       console.error('Error: Unexpected response for email query');
//     }

//     if (Object.keys(dataBaseValidationErrors).length > 0) {
//       console.log('Database Validation Errors:', dataBaseValidationErrors);
//       return res.status(401).json(dataBaseValidationErrors);
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);
//     console.log('Hashed Password:', hashedPassword); // ✅ Log hashed password

//     console.log('Inserting user into database...');
//     const insertResult = await sql`
//       INSERT INTO users (username, email, password)
//       VALUES (${username}, ${email}, ${hashedPassword})
//       RETURNING id, username, email`;

//     console.log('Insert Query Result:', insertResult); // ✅ Log insert result

//     // 🚀 **Fix: Ensure `insertResult.rows` exists**
//     if (!insertResult || !insertResult.rows || insertResult.rows.length === 0) {
//       throw new Error('User insertion failed: No data returned.');
//     }

//     const newUser = insertResult.rows[0]; // 🔴 Error happens here if `rows[0]` is undefined
//     console.log('New User:', newUser); // ✅ Log new user

//     // Generate JWT token
//     const token = jwt.sign(
//       { id: newUser.id, email: newUser.email },
//       process.env.JWT_SECRET,
//       { expiresIn: '1h' }
//     );

//     console.log('Generated Token:', token); // ✅ Log token

//     return res.status(201).json({
//       message: 'User registered successfully',
//       token
//     });

//   } catch (error) {
//     console.error('Error registering user:', error);
//     return res.status(500).json({ message: 'Internal server error', error: error.message });
//   }
// });

// Login User Route
app.post('/api/loginUser', async (req, res) => {
  const { email, password } = req.body;
 const errors ={}

  try {
    // Check if user exists
    const result = await sql('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      errors.email = 'Invalid email or password' 
      console.log(errors.email)
    }
    if (user.length===0) {
      errors.noUserExist = 'User does not exist'
      
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
  

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    req.userId = decoded.id 
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
    const result = await sql(
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

function authenticateUser(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Add user info to the request
    next();
  } catch (err) {
    res.status(403).json({ message: 'Invalid or expired token' });
  }
}

app.delete('/api/deleteAccount', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id; // Assuming `req.user` is populated by middleware

    // Delete the user from the database
    await sql('DELETE FROM users WHERE id = $1', [userId]);

    res.status(200).json({ message: 'Account deleted successfully' });
    console.log('Account deleted successfully');
    
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
// 
app.post('/api/tasks',authMiddleware, async (req, res) => {
  const { description,title } = req.body;
  const userId =req.userId;
  console.log(userId);
  
  
  
  if (!title){
   return res.status(400).json({error: 'Tittle is required'})
  }

  if (!description) {
      return res.status(400).json({ error: 'Description is required' });
  }
  if (!userId) {
    return res.status(400).json({error: 'userId is required'})
  }

  try {
      const result = await sql(
          'INSERT INTO tasks (title,description,userId) VALUES ($1,$2,$3) RETURNING *',
          [description,title,userId]

      );
      
      res.status(201).json(result.rows[0]);
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.put('/api/updateTask', async (req, res) => {
  const { description, title,taskId } = req.body;
  console.log(taskId);
  
  if (!description || !title || !taskId) {
    return res.status(400).json({ error: 'Description, title, and taskId are required' });
  }
  

  try {
      const result = await sql(
          'UPDATE tasks SET title = $1, description = $2 WHERE id =$3  RETURNING *',
          [description, title,taskId]
      );

      if (result.rows.length > 0) {
          res.status(200).json(result.rows[0]);
      } else {
          res.status(404).json({ error: 'Task not found' });
      }
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Endpoint to delete a task by id
app.delete('/api/deleteTask', async (req, res) => {
  const taskId = req.id; // Retrieve taskTitle from  params
  if (!taskId) {
    return res.status(400).json({ error: 'Task ID is required' });
  }

  try {
    const result = await sql(
      'DELETE FROM tasks WHERE id = $1 RETURNING *', 
      [taskId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
      deletedTask: result.rows[0], // Return details of the deleted task
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

app.put('/api/taskCompeletion', async (req, res) => {
  const { completed, taskId } = req.body; // Extract completed status and taskId from the request body

  console.log('Received data:', { completed, taskId });

  // Validate input
  if (typeof completed !== 'boolean') {
    return res.status(400).json({ error: 'Invalid completion status. Must be a boolean.' });
  }

  if (!taskId) {
    return res.status(400).json({ error: 'Task ID is required.' });
  }

  try {
    // Update task completion status
    const result = await sql(
      'UPDATE tasks SET completed = $1 WHERE id = $2 RETURNING *',
      [completed, taskId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    // Respond with the updated task
    res.status(200).json({ success: true, updatedTask: result.rows[0] });
  } catch (error) {
    console.error('Error updating task completion:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

app.get('/api/fetchTasks', authMiddleware, async (req, res) => {
  const userId = req.userId; // Extract userId from the middleware
  try {
    const result = await sql('SELECT * FROM tasks WHERE userId = $1', [userId]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Database  failed' });
  }
});

const baseURL = "https://api.aimlapi.com/v1";
const apiKey = "c88657e0a6ad41a18809bc0a4321126b"; // Replace with your actual API key
const api = new OpenAI({
  apiKey,
  baseURL,
});

// Endpoint to interact with AI
app.post("/ask", async (req, res) => {
  const { userPrompt } = req.body;

  if (!userPrompt) {
    return res.status(400).json({ error: "userPrompt is required" });
  }

  try {
    const systemPrompt = "You are a travel agent. Be descriptive and helpful";

    const completion = await api.chat.completions.create({
      model: "mistralai/Mistral-7B-Instruct-v0.2",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 256,
    });

    const response = completion.choices[0].message.content;

    res.json({
      userPrompt,
      response,
    });
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    res.status(500).json({ error: "Failed to process request" });
  }
});


// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
