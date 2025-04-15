const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;


// 👉 Middleware
// cors middleware
app.use(cors(
  {
    origin: process.env.FRONT_URL || 'http://localhost:5173',
  }
));
// body parser middleware
app.use(express.json());

// static assets middleware
app.use(express.static('public'));


app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
})

// 👉 Routes

app.get('/', (req, res) => {
  res.send('Books API Server!')
})


// Index route for books
app.get('/api/v1/books', (req, res) => {

  res.json({ message: 'List of books' })

})


// Show route for single book

app.get('/api/v1/books/:id', (req, res) => {

  const { id } = req.params
  res.json({ message: `List of book with id: ${id}` })

})



// Middleware for serve errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Middleware for 404 errors
app.use((req, res, next) => {
  res.status(404).send('Sorry, that route does not exist!');
});








