const express = require('express')
const router = express.Router()
const Book = require('../models/book')
const imageMimeTypes = ['image/jpeg', 'image/png', 'image/gif']
const Author = require('../models/author')

// All Books Route
router.get('/', async (req, res) => {
    let query = Book.find()
    if (req.query.title && req.query.title !== '') {
        query = query.regex('title', new RegExp(req.query.title, 'i'))
    }
    if (req.query.publishedBefore && req.query.publishedBefore !== '') {
        // the .lte emthod means less than or equal
        query = query.lte('publishDate', req.query.publishedBefore)  
    }
    if (req.query.publishedAfter && req.query.publishedAfter !== '') {
        // the .lte emthod means greater than or equal
        query = query.gte('publishDate', req.query.publishedAfter)  
    }
    try {
        const books = await query.exec()
        res.render('books/index', {
            books: books,
            searchOptions: req.query
        })
    } catch {
        res.redirect('/')
    }
})

// New Book Route
router.get('/new', async (req, res) => {
    renderNewpage(res, new Book())
})

// Create Book
router.post('/', async (req, res) => {
    const book = new Book({
        title: req.body.title,
        author: req.body.author,
        publishDate: new Date(req.body.publishDate),
        pageCount: req.body.pageCount,
        description: req.body.description
    })
    saveCover(book, req.body.cover)

    try {
        const newBook = await book.save()
        res.redirect(`books`)
        // res.redirect(`books/${newBook.id}`)
    } catch {
        // if (book.coverImageName != null) {
        //     removeBookCover(book.coverImageName)
        // }
        renderNewpage(res, book, true)
    }
})

// function removeBookCover(fileName) {
//     fs.unlink(path.join(uploadPath, fileName), err => {
//         if (err) console.error(err)
//     })
// }

async function renderNewpage(res, book, hasError = false) {
    try {
        const authors = await Author.find({})
        const params = {
            authors: authors,
            book: book
        }
        if (hasError) params.errorMessage = 'Error Creating Book'
        // const book = new Book()
        res.render('books/new', params)
    } catch {
        res.redirect('/books')
    }
}

function saveCover(book, coverEncoded) {
    if (coverEncoded == null) return
    const cover = JSON.parse(coverEncoded)
    if (cover != null && imageMimeTypes.includes(cover.type)) {
      book.coverImage = new Buffer.from(cover.data, 'base64')
      book.coverImageType = cover.type
    }
}

module.exports = router