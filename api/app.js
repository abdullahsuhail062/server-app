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


import { neon } from '@neondatabase/serverless';
const { PGHOST, PGDATABASE, PGUSER, PGPASSWORD } = process.env;

//const sql = neon(process.env.DATABASE_URL);
const sql = neon(`postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}/${PGDATABASE}?sslmode=require`);


app.post('/api/registerUser', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const dataBaseValidationErrors = {};

    // Check if username already exists
    const resultUsername = await sql`SELECT username FROM users WHERE username = ${username}`;
    if (resultUsername.length > 0) {
      dataBaseValidationErrors.usernameExist = 'Username already exists';
    }

    // Check if email already exists
    const resultEmail = await sql`SELECT email FROM users WHERE email = ${email}`;
    if (resultEmail.length > 0) {
      dataBaseValidationErrors.userEmailExist = 'Email already exists';
    }

    // If username or email exists, return error response
    if (Object.keys(dataBaseValidationErrors).length > 0) {
      return res.status(401).json(dataBaseValidationErrors);
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new user
    const insertResult = await sql`
      INSERT INTO users (username, email, password) 
      VALUES (${username}, ${email}, ${hashedPassword}) 
      RETURNING id, username, email`;

      const newUser = insertResult  // ✅ Correct way to access the inserted user
    console.log(newUser);
    
    
      // Generate JWT token
      const token = jwt.sign(
        { id: newUser.id, email: newUser.email },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      
      console.log('Generated token:', token);
      
      // Return response
      return res.status(201).json({
        message: 'User registered successfully',
        token,
      });
      
      } catch (error) {
    console.error('Error registering user:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});
app.post('/api/loginUser', async (req, res) => {
  try {
    const { email, password } = req.body;
    const errors = {};

    // Find user by email
    const result = await sql`SELECT * FROM users WHERE email = ${email}`;
    const user = result[0];  // ✅ Corrected

    // If no user found, return error
    if (!user) {
      return res.status(400).json({ email: 'Invalid email or password' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ password: 'Invalid email or password' });
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

// Authentication Middleware
function authenticateUser(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach the user object to `req`
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
}

// Fetch User Profile Route
app.get('/api/fetchUserProfile', authenticateUser, async (req, res) => {
  const userId = req.user.id; // ✅ Extract user ID correctly
  console.log('User ID:', userId);

  try {
    const result = await sql`
      SELECT username, email FROM users WHERE id = ${userId}`;
      console.log(result[0]);
      if (!result[0] || result[0].length === 0) { 
        return res.status(404).json({ message: 'User not found' });
      }
     
      
      

    const user = result[0];
    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


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
app.post('/api/tasks', authMiddleware, async (req, res) => {
  const { title, description } = req.body;
  const userId = req.userId;
  
  console.log(userId);
  
  if (!title) return res.status(400).json({ error: 'Title is required' });
  if (!description) return res.status(400).json({ error: 'Description is required' });
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  try {
    async function isTitleUnique(title, userId) {
      const result = await sql`SELECT COUNT(*) FROM tasks WHERE title = ${title} AND userId = ${userId}`;
      return result[0].count === '0'; // Returns true if the title is unique for this user
    }
  
    const isUnique = await isTitleUnique(title, userId);
    if (!isUnique) {
      console.log('Title already exists for this user.');
      return res.status(400).json({ error: 'Title already exists. Choose a different one.' });
    }

    const result = await sql(
      'INSERT INTO tasks (title, description, userId) VALUES ($1, $2, $3) RETURNING *',
      [title, description, userId]
    );
    
    res.status(201).json(result[0]);
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

      if (result.length > 0) {
          res.status(200).json(result[0]);
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
  const taskId = req.query.id; // Retrieve taskTitle from  params
  console.log(taskId)
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
      deletedTask: result[0], // Return details of the deleted task
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
    res.status(200).json({ success: true, updatedTask: result[0] });
  } catch (error) {
    console.error('Error updating task completion:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

app.get('/api/fetchTasks', authMiddleware, async (req, res) => {
  const userId = req.userId; // Extract userId from the middleware
  try {
    const result = await sql('SELECT * FROM tasks WHERE userId = $1', [userId]);
    res.status(200).json(result);
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
