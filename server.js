const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;
const BooksRouter = require('./routes/books.js');
const serverError = require('./middleware/serverError.js');
const notFound = require('./middleware/notFound.js');

// 👉 Middleware
// cors middleware
app.use(cors({ origin: process.env.FRONT_URL || 'http://localhost:5173' }));
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





// Middleware for serve errors
app.use(serverError);

// Middleware for 404 errors
app.use(notFound);


// 👉 Start the server

app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
})