var Book = require('../models/book');
var Author = require('../models/author');
var Genre = require('../models/genre');
var BookInstance = require('../models/bookinstance');
var Prize = require('../models/prize');
var Formato = require('../models/formato');

const { body,validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

var async = require('async');

exports.index = function(req, res) {

    async.parallel({
        book_count: function(callback) {
            Book.count(callback);
        },
        book_instance_count: function(callback) {
            BookInstance.count(callback);
        },
        book_instance_available_count: function(callback) {
            BookInstance.count({status:'Available'},callback);
        },
        author_count: function(callback) {
            Author.count(callback);
        },
        genre_count: function(callback) {
            Genre.count(callback);
        },
        prize_count: function(callback) {
            Prize.count(callback);
        },
        formato_count: function(callback) {
            Formato.count(callback);
        },
    }, function(err, results) {
        res.render('index', { title: 'Local Library Home', error: err, data: results });
    });
};

// Display list of all books.
exports.book_list = function(req, res, next) {
  //Coger por GET los params de paginación / ordenación
  var url = require('url')
    , qs = require('querystring')
    , params = qs.parse(url.parse(req.url).query)
    , str = ''

  //Variables de paginación
  var perPage = 5;
  var page = params.page > 0 ? params.page : 0;
  var count = 0;

  //Variables de ordenación
  var sortParams = params.sort;
  var sortProperty = { sortParams : 'asc' };

  //Crea enlaces paginación
  res.locals.createPagination = function (pages, page) {
    str = ''
    params.page = 0;
    //Crea enlaces con páginas y | entre ellos
    for(var i = 0; i  <= pages; i++){
      params.page = i;
      str += '<a href="?'+qs.stringify(params)+'">'+ (i+1) +'</a>'
      if(i < pages - 1){
        str += ' | ';
      }
    }
    return str
  }

  //Crea THs con ordenación
  res.locals.createOrdering = function () {
    str = ''
    //Valores de sorteo y nombre de los campos
    var sortValue = ['title', 'author.first_name']
    var sortName = ['Title', 'Author']

    //Crear THs
    for(var z = 0; z  < sortValue.length; z++){
      str += '<th><a class="sortLink" href="?sort='+sortValue[z]+'&page=0">'+sortName[z]+'</a></th>'
    }
    return str
  }

  Book.find({}, 'title author')
    .sort(sortParams)
    .limit(perPage)
    .skip(perPage * page)
    .populate('author')
    .exec(function (err, list_books) {
        Book.countDocuments().exec(function(err, count){
          res.render('book_list', { title: 'Book List', book_list:  list_books, page: page, pages: count / perPage, count: count});
        });
    });
};

// Display detail page for a specific book.
exports.book_detail = function(req, res, next) {

    async.parallel({
        book: function(callback) {

            Book.findById(req.params.id)
              .populate('author')
              .populate('genre')
              .populate('formato')
              .populate('prize')
              .exec(callback);
        },
        book_instance: function(callback) {

          BookInstance.find({ 'book': req.params.id })
          .exec(callback);
        },
    }, function(err, results) {
        if (err) { return next(err); }
        if (results.book==null) { // No results.
            var err = new Error('Book not found');
            err.status = 404;
            return next(err);
        }
        // Successful, so render.
        res.render('book_detail', { title: 'Title', book:  results.book, book_instances: results.book_instance } );
    });

};

// Display book create form on GET.
exports.book_create_get = function(req, res, next) {

    // Get all authors and genres, which we can use for adding to our book.
    async.parallel({
        authors: function(callback) {
            Author.find(callback);
        },
        genres: function(callback) {
            Genre.find(callback);
        },
        formatos: function(callback) {
            Formato.find(callback);
        },
        prizes: function(callback) {
            Prize.find(callback);
        },
    }, function(err, results) {
        if (err) { return next(err); }
        res.render('book_form', { title: 'Create Book',authors:results.authors, genres:results.genres, formatos:results.formatos, prizes:results.prizes});
    });

};

// Handle book create on POST.
exports.book_create_post = [
    // Convert the genre to an array.
    (req, res, next) => {
        if(!(req.body.genre instanceof Array)){
            if(typeof req.body.genre==='undefined')
            req.body.genre=[];
            else
            req.body.genre=new Array(req.body.genre);
        }
        //no seguro de lo siguiente
        if(!(req.body.formato instanceof Array)){
            if(typeof req.body.formato==='undefined')
            req.body.formato=[];
            else
            req.body.formato=new Array(req.body.formato);
        }
        if(!(req.body.prize instanceof Array)){
            if(typeof req.body.prize==='undefined')
            req.body.prize=[];
            else
            req.body.prize=new Array(req.body.prize);
        }
        next();
    },

    // Validate fields.
    body('title', 'Title must not be empty.').isLength({ min: 1 }).trim(),
    body('author', 'Author must not be empty.').isLength({ min: 1 }).trim(),
    body('summary', 'Summary must not be empty.').isLength({ min: 1 }).trim(),
    body('isbn', 'ISBN must not be empty').isLength({ min: 1 }).trim(),

    // Sanitize fields.
    sanitizeBody('*').escape(),
    sanitizeBody('genre.*').escape(),
    sanitizeBody('formato.*').escape(),
    sanitizeBody('prize.*').escape(),
    // Process request after validation and sanitization.
    (req, res, next) => {


        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a Book object with escaped and trimmed data.
        var book = new Book(
          { title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: req.body.genre,
            formato: req.body.formato,
            prize: req.body.prize
           });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/error messages.

            // Get all authors and genres for form.
            async.parallel({
                authors: function(callback) {
                    Author.find(callback);
                },
                genres: function(callback) {
                    Genre.find(callback);
                },
                formatos: function(callback) {
                    Formato.find(callback);
                },
                prizes: function(callback) {
                    Prize.find(callback);
                },
            }, function(err, results) {
                if (err) { return next(err); }

                // Mark our selected genres as checked.
                for (let i = 0; i < results.genres.length; i++) {
                    if (book.genre.indexOf(results.genres[i]._id) > -1) {
                        results.genres[i].checked='true';
                    }
                }
                // Mark our selected formatos as checked.
                for (let i = 0; i < results.formatos.length; i++) {
                    if (book.formato.indexOf(results.formatos[i]._id) > -1) {
                        results.formatos[i].checked='true';
                    }
                }
                // Mark our selected prizes as checked.
                for (let i = 0; i < results.prizes.length; i++) {
                    if (book.prize.indexOf(results.prizes[i]._id) > -1) {
                        results.prizes[i].checked='true';
                    }
                }
                res.render('book_form', { title: 'Create Book',authors:results.authors, genres:results.genres, formatos:results.formatos, prizes:results.prizes, book: book, errors: errors.array() });
            });
            return;
        }
        else {
            // Data from form is valid. Save book.
            book.save(function (err) {
                if (err) { return next(err); }
                   // Successful - redirect to new book record.
                   res.redirect(book.url);
                });
        }
    }
];



// Display book delete form on GET.
exports.book_delete_get = function(req, res, next) {

    async.parallel({
        book: function(callback) {
            Book.findById(req.params.id).populate('author').populate('genre').populate('formato').populate('prize').exec(callback);
        },
        book_bookinstances: function(callback) {
            BookInstance.find({ 'book': req.params.id }).exec(callback);
        },
    }, function(err, results) {
        if (err) { return next(err); }
        if (results.book==null) { // No results.
            res.redirect('/catalog/books');
        }
        // Successful, so render.
        res.render('book_delete', { title: 'Delete Book', book: results.book, book_instances: results.book_bookinstances,
        book_formatos: results.book_formatos, book_prizes: results.book_prizes } );
    });

};

// Handle book delete on POST.
exports.book_delete_post = function(req, res, next) {

    // Assume the post has valid id (ie no validation/sanitization).

    async.parallel({
        book: function(callback) {
            Book.findById(req.body.id).populate('author').populate('genre').populate('formato').populate('prize').exec(callback);
        },
        book_bookinstances: function(callback) {
            BookInstance.find({ 'book': req.body.id }).exec(callback);
        },
    }, function(err, results) {
        if (err) { return next(err); }
        // Success
        if ((results.book_bookinstances.length > 0)) {
            // Book has book_instances. Render in same way as for GET route.
            res.render('book_delete', { title: 'Delete Book', book: results.book, book_instances: results.book_bookinstances } );
            return;
        }
        else {
            // Book has no BookInstance objects. Delete object and redirect to the list of books.
            Book.findByIdAndRemove(req.body.id, function deleteBook(err) {
                if (err) { return next(err); }
                // Success - got to books list.
                res.redirect('/catalog/books');
            });

        }
    });

};

// Display book update form on GET.
exports.book_update_get = function(req, res, next) {

    // Get book, authors,genres,formatos,prizes for form.
    async.parallel({
        book: function(callback) {
            Book.findById(req.params.id).populate('author').populate('genre').populate('formato').populate('prize').exec(callback);
        },
        authors: function(callback) {
            Author.find(callback);
        },
        genres: function(callback) {
            Genre.find(callback);
        },
        formatos: function(callback) {
            Formato.find(callback);
        },
        prizes: function(callback) {
            Prize.find(callback);
        },
        }, function(err, results) {
            if (err) { return next(err); }
            if (results.book==null) { // No results.
                var err = new Error('Book not found');
                err.status = 404;
                return next(err);
            }
            // Success.
            // Mark our selected genres as checked.
            for (var all_g_iter = 0; all_g_iter < results.genres.length; all_g_iter++) {
                for (var book_g_iter = 0; book_g_iter < results.book.genre.length; book_g_iter++) {
                    if (results.genres[all_g_iter]._id.toString()==results.book.genre[book_g_iter]._id.toString()) {
                        results.genres[all_g_iter].checked='true';
                    }
                }
            }
            // Mark our selected formatos as checked.
            for (var all_g_iter = 0; all_g_iter < results.formatos.length; all_g_iter++) {
                for (var book_g_iter = 0; book_g_iter < results.book.formato.length; book_g_iter++) {
                    if (results.formatos[all_g_iter]._id.toString()==results.book.formato[book_g_iter]._id.toString()) {
                        results.formatos[all_g_iter].checked='true';
                    }
                }
            }
            // Mark our selected prizes as checked.
            for (var all_g_iter = 0; all_g_iter < results.prizes.length; all_g_iter++) {
                for (var book_g_iter = 0; book_g_iter < results.book.prize.length; book_g_iter++) {
                    if (results.prizes[all_g_iter]._id.toString()==results.book.prize[book_g_iter]._id.toString()) {
                        results.prizes[all_g_iter].checked='true';
                    }
                }
            }
            res.render('book_form', { title: 'Update Book', authors:results.authors, genres:results.genres, formatos:results.formatos, prizes:results.prizes, book: results.book });
        });

};


// Handle book update on POST.
exports.book_update_post = [

    // Convert the genre to an array.
    (req, res, next) => {
        if(!(req.body.genre instanceof Array)){
            if(typeof req.body.genre==='undefined')
            req.body.genre=[];
            else
            req.body.genre=new Array(req.body.genre);
        }
        if(!(req.body.formato instanceof Array)){
            if(typeof req.body.formato==='undefined')
            req.body.formato=[];
            else
            req.body.formato=new Array(req.body.formato);
        }
        if(!(req.body.prize instanceof Array)){
            if(typeof req.body.prize==='undefined')
            req.body.prize=[];
            else
            req.body.prize=new Array(req.body.prize);
        }
        next();
    },

    // Validate fields.
    body('title', 'Title must not be empty.').isLength({ min: 1 }).trim(),
    body('author', 'Author must not be empty.').isLength({ min: 1 }).trim(),
    body('summary', 'Summary must not be empty.').isLength({ min: 1 }).trim(),
    body('isbn', 'ISBN must not be empty').isLength({ min: 1 }).trim(),

    // Sanitize fields.
    sanitizeBody('title').escape(),
    sanitizeBody('author').escape(),
    sanitizeBody('summary').escape(),
    sanitizeBody('isbn').escape(),
    sanitizeBody('genre.*').escape(),
    sanitizeBody('formato.*').escape(),
    sanitizeBody('prize.*').escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a Book object with escaped/trimmed data and old id.
        var book = new Book(
          { title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: (typeof req.body.genre==='undefined') ? [] : req.body.genre,
            formato: (typeof req.body.formato==='undefined') ? [] : req.body.formato,
            prize: (typeof req.body.prize==='undefined') ? [] : req.body.prize,
            _id:req.params.id // This is required, or a new ID will be assigned!
           });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/error messages.

            // Get all authors and genres for form
            async.parallel({
                authors: function(callback) {
                    Author.find(callback);
                },
                genres: function(callback) {
                    Genre.find(callback);
                },
                formatos: function(callback) {
                    Formato.find(callback);
                },
                prizes: function(callback) {
                    Prize.find(callback);
                },
            }, function(err, results) {
                if (err) { return next(err); }

                // Mark our selected genres as checked.
                for (let i = 0; i < results.genres.length; i++) {
                    if (book.genre.indexOf(results.genres[i]._id) > -1) {
                        results.genres[i].checked='true';
                    }
                }
                // Mark our selected formatos as checked.
                for (let i = 0; i < results.formatos.length; i++) {
                    if (book.formato.indexOf(results.formatos[i]._id) > -1) {
                        results.formatos[i].checked='true';
                    }
                }
                // Mark our selected prizes as checked.
                for (let i = 0; i < results.prizes.length; i++) {
                    if (book.prize.indexOf(results.prizes[i]._id) > -1) {
                        results.prizes[i].checked='true';
                    }
                }
                res.render('book_form', { title: 'Update Book',authors:results.authors, genres:results.genres,formatos:results.formatos,prizes:results.prizes, book: book, errors: errors.array() });
            });
            return;
        }
        else {
            // Data from form is valid. Update the record.
            Book.findByIdAndUpdate(req.params.id, book, {}, function (err,thebook) {
                if (err) { return next(err); }
                   // Successful - redirect to book detail page.
                   res.redirect(thebook.url);
                });
        }
    }
];
