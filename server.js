const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;
const BooksRouter = require('./routes/books.js');
const serverError = require('./middleware/serverError.js');
const notFound = require('./middleware/notFound.js');

// Auth dependencies
const session = require('express-session');
const passport = require('passport');
const initializePassport = require('./auth/passport-config.js');

initializePassport(passport);
app.use(session({

  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}))


// 👉 Middleware
// cors middleware
app.use(cors({
  origin: 'http://localhost:5174', // Allow requests from your React app myfront.dev
  credentials: true,
}));

// body parser middleware
app.use(express.json());
// static assets middleware
app.use(express.static('public'));


// 👉 Routes
app.get('/', (req, res) => {
  res.send('Books API Server!')
})

// use the books router
app.use('/api/v1/books', BooksRouter);



// Autherntication routes
app.post('/register', passport.authenticate('register'), (req, res) => {
  return res.json({ message: 'Registered successfully', user: req.user });
})

app.post('/login', passport.authenticate('login'), (req, res) => {

  return res.json({ message: 'Logged in successfully', user: req.user });

})





// Middleware for serve errors
app.use(serverError);

// Middleware for 404 errors
app.use(notFound);


// 👉 Start the server

app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
})