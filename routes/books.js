const router = require('express').Router();
const BookController = require('../controllers/BookController.js')


// Index route for books
router.get('/', BookController.index)


// Show route for single book

router.get('/:id', BookController.show)



// export the router instance
module.exports = router;

