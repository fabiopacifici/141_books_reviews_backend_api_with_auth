const connection = require('../database/db.js')

function index(req, res) {
  res.json({ message: 'List of books' })
}


function show(req, res) {

  const { id } = req.params
  res.json({ message: `List of book with id: ${id}` })

}


module.exports = {
  index,
  show
}