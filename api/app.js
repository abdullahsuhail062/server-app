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
const token = '5KZ72CbN8USncapi3rxGWLfy';
res.cookie('__vercel_live_token', token, {
  sameSite: 'None',  // Allows cross-site requests
  secure: true
});

// Enable pre-flight requests for CORS
app.options('/api/registerUser', function (req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader('Access-Control-Allow-Methods', '*');
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.end();
});

app.post('/api/registerUser', function (req, res, next) {
 
 
  const token = '5KZ72CbN8USncapi3rxGWLfy';
  res.cookie('__vercel_live_token', token, {
    sameSite: 'None',  // Allows cross-site requests
    secure: true
  });

  const {username, email, password}=req.body; // Destructure all variables one by one
  const errors = {};

  if (Object.keys(req.body).length === 0) {
     res.status(400).json({ errors: 'Request body is empty' });
  }else{res.status(200).json({message: 'Request body is not empty'})}
 

 
  


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

  // Check if the errors object has any keys
  if (Object.keys(errors).length > 0) {
    // If there are validation errors, send a 400 response with the errors object
    return res.status(400).json({ errors });
  }

  // If no errors, return success response
  return res.status(200).json({ message: 'User registered successfully' });
 
});

// Start the server
app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
