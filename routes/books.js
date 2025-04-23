const router = require('express').Router();
const BookController = require('../controllers/BookController.js')

// Multer middeware for file uploads
const multer = require('multer')
// Configure the storage engine 
const storage = multer.diskStorage({
  destination: 'public/images',
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
})

const upload = multer({ storage: storage })



// Index route for books
router.get('/', BookController.index)


// Show route for single book
router.get('/:id', BookController.show)

// Store a book's review
router.post('/:id/review', BookController.storeReview)

// Store a book with images
router.post('/create', upload.single('cover_image'), BookController.create);


// export the router instance
module.exports = router;

