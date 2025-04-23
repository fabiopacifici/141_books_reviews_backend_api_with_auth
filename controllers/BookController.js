const connection = require('../database/db.js')


// Index route for books
function index(req, res) {

  // add sql query to get all books
  const sql = 'SELECT * FROM books'

  // perform the query and return the results
  connection.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message })

    console.log(results);
    res.json(results)

  })


}


// Show route for single book
function show(req, res) {

  // take the id from the params
  const id = Number(req.params.id)


  // get the book with the given id
  const sql = 'SELECT * FROM books WHERE id = ?'
  const sqlReviews = 'SELECT * FROM reviews WHERE book_id = ?'
  // perform the query and return the results
  connection.query(sql, [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message })
    if (results.length === 0) return res.status(404).json({ error: 'Book not found' })

    const book = results[0]
    // get the reviews for the book
    connection.query(sqlReviews, [id], (err, reviews) => {
      if (err) return res.status(500).json({ error: err.message })
      book.reviews = reviews
      console.log(book.reviews);

      res.json(book)
    })

  })

}



// store a book's review
function storeReview(req, res) {

  const id = Number(req.params.id)
  const { username, summary, review, vote } = req.body

  const created_at = new Date().toISOString().slice(0, 19).replace('T', ' ')
  const updated_at = created_at


  const insertSql = 'INSERT INTO reviews (book_id, username, summary, review, vote, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  const values = [id, username, summary, review, vote, created_at, updated_at]

  connection.query(insertSql, values, (err, results) => {
    if (err) return res.status(500).json({ error: err.message })


    console.log(results);
    res.status(201).json({ message: 'Review added successfully', reviewId: results.insertId })
  })

}


function create(req, res) {

  console.log(req.body, req.file);

  // Get the data from the request
  const { title, author, abstract } = req.body
  const cover_image = req.file.filename

  // prepare the sql query to insert the book
  const sql = 'INSERT INTO books (title, author, abstract, cover_image) VALUES (?, ?, ?, ?)'
  const values = [title, author, abstract, cover_image]

  connection.query(sql, values, (err, results) => {
    if (err) return res.status(500).json({ success: false, error: err.message })

    console.log(results);
    return res.status(201).json({ success: true, message: 'Book created successfully', bookId: results.insertId })

  })

}


module.exports = {
  index,
  show,
  storeReview,
  create
}