var express = require('express');
var app = express();
 app.use(express.json())
 const bodyParser = require('body-parser');
// Use express.json() middleware to parse JSON request bodies
var cors = require('cors')
app.use(bodyParser.json());
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "https://data-keeping-app.vercel.app"); // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });
  app.use(cors({
    origin: 'https://data-keeping-app.vercel.app',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));
  
 
  app.post('/api/registerUser', function (req, res) {
    console.log(req.body); // Log the request body
    const errors = {};
    
    const { username, email, password } = req.body || {}; // Destructure all variables at once
    
    // Validate username
    if (!username || username.length < 3) {
      errors.username = 'Minimum 3 characters required';
    }
  
    // Validate email with a regular expression
    const regx = /^[a-zA-Z0-9._%+-]+@example\.com$/;
    if (!email || !regx.test(email)) {
      errors.email = 'Invalid email address';
    }
  
    // Validate password length
    if (!password || password.length < 7) {
      errors.password = 'Minimum 8 characters required';
    }
  
    // Check if the errors object has any keys
    if (Object.keys(errors).length > 0) {
      // If there are validation errors, send a 400 response with the errors object
      return res.status(400).json({errors});
    }
    
  
    // If no errors, send a success response (for example purposes)
    res.status(200).json({ message: 'User registered successfully' });
  });
  
  
   
    
  

app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});
