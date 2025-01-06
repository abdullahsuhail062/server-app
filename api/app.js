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
  const cokieToken = '2wbUqQdPIKP43QUJ5o83tm5o';
  res.cookie('__vercel_live_token', cokieToken, {
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
      RETURNING id, username, email`;
      
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
    await client.query('DELETE FROM Users WHERE id = $1', [userId]);

    res.status(200).json({ message: 'Account deleted successfully' });
    console.log('Account deleted successfully');
    
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/tasks', async (req, res) => {
  const { description } = req.body;
  const { title } = req.body;
  console.log(req.body);
  
  if (!title){
   return res.status(400).json({error: 'Tittle is required'})
  }

  if (!description) {
      return res.status(400).json({ error: 'Description is required' });
  }

  try {
      const result = await client.query(
          'INSERT INTO tasks (title,description) VALUES ($1,$2) RETURNING *',
          [description,title]

      );
      
      res.status(201).json(result.rows[0]);
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.put('/api/updateTask', async (req, res) => {
  const { description, title,taskId } = req.body;
  if (!description || !title || !taskId) {
    return res.status(400).json({ error: 'Description, title, and taskId are required' });
  }
  

  try {
      const result = await client.query(
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
  const taskId = req.query.id; // Retrieve taskTitle from query params
  if (!taskId) {
    return res.status(400).json({ error: 'Task ID is required' });
  }

  try {
    const result = await client.query(
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



// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
