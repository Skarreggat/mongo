var BookInstance = require('../models/bookinstance')
var Book = require('../models/book')
var async = require('async')

const {
    body,
    validationResult
} = require('express-validator/check');
const {
    sanitizeBody
} = require('express-validator/filter');

// Display list of all BookInstances.
exports.bookinstance_list = function (req, res, next) {
    //Coger por GET los params de paginación / ordenación
    var url = require('url'),
        qs = require('querystring'),
        params = qs.parse(url.parse(req.url).query),
        str = ''

    //Variables de paginación
    var perPage = 5;
    var page = params.page > 0 ? params.page : 0;
    var count = 0;

    //Variables de ordenación
    var sortParams = params.sort;
    var sortProperty = {
        sortParams: 'asc'
    };

    //Crea enlaces paginación
    res.locals.createPagination = function (pages, page) {
        str = ''
        params.page = 0;
        //Crea enlaces con páginas y | entre ellos
        for (var i = 0; i < pages; i++) {
            params.page = i;
            str += '<a href="?' + qs.stringify(params) + '">' + (i + 1) + '</a>'
            if (i < pages - 1) {
                str += ' | ';
            }
        }
        return str
    }

    //Crea THs con ordenación
    res.locals.createOrdering = function () {
        str = ''
        //Valores de sorteo y nombre de los campos
        var sortValue = ['book.title', 'imprint', 'status', 'due_back_formatted']
        var sortName = ['Title', 'Imprint', 'Status', 'Due']

        //Crear THs
        for (var z = 0; z < sortValue.length; z++) {
            str += '<th><a class="sortLink" href="?sort=' + sortValue[z] + '&page=0">' + sortName[z] + '</a></th>'
        }
        return str
    }
    BookInstance.find()
        .populate('book')
        .sort(sortParams)
        .limit(perPage)
        .skip(perPage * page)
        .exec(function (err, list_bookinstances) {
            if (err) {
                return next(err);
            }
            BookInstance.countDocuments().exec(function (err, count) {
                res.render('bookinstance_list', {
                    title: 'Book Instance List',
                    bookinstance_list: list_bookinstances,
                    page: page,
                    pages: count / perPage,
                    count: count
                });
            })
        })

};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = function (req, res, next) {

    BookInstance.findById(req.params.id)
        .populate('book')
        .exec(function (err, bookinstance) {
            if (err) {
                return next(err);
            }
            if (bookinstance == null) { // No results.
                var err = new Error('Book copy not found');
                err.status = 404;
                return next(err);
            }
            // Successful, so render.
            res.render('bookinstance_detail', {
                title: 'Book:',
                bookinstance: bookinstance
            });
        })

};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = function (req, res, next) {

    Book.find({}, 'title')
        .exec(function (err, books) {
            if (err) {
                return next(err);
            }
            // Successful, so render.
            res.render('bookinstance_form', {
                title: 'Create BookInstance',
                book_list: books
            });
        });

};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [

    // Validate fields.
    body('book', 'Book must be specified').isLength({
        min: 1
    }).trim(),
    body('imprint', 'Imprint must be specified').isLength({
        min: 1
    }).trim(),
    body('due_back', 'Invalid date').optional({
        checkFalsy: true
    }).isISO8601(),

    // Sanitize fields.
    sanitizeBody('book').escape(),
    sanitizeBody('imprint').escape(),
    sanitizeBody('status').escape(),
    sanitizeBody('due_back').toDate(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a BookInstance object with escaped and trimmed data.
        var bookinstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back
        });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values and error messages.
            Book.find({}, 'title')
                .exec(function (err, books) {
                    if (err) {
                        return next(err);
                    }
                    // Successful, so render.
                    res.render('bookinstance_form', {
                        title: 'Create BookInstance',
                        book_list: books,
                        selected_book: bookinstance.book._id,
                        errors: errors.array(),
                        bookinstance: bookinstance
                    });
                });
            return;
        } else {
            // Data from form is valid
            bookinstance.save(function (err) {
                if (err) {
                    return next(err);
                }
                // Successful - redirect to new record.
                res.redirect(bookinstance.url);
            });
        }
    }
];



// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = function (req, res, next) {

    BookInstance.findById(req.params.id)
        .populate('book')
        .exec(function (err, bookinstance) {
            if (err) {
                return next(err);
            }
            if (bookinstance == null) { // No results.
                res.redirect('/catalog/bookinstances');
            }
            // Successful, so render.
            res.render('bookinstance_delete', {
                title: 'Delete BookInstance',
                bookinstance: bookinstance
            });
        })

};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = function (req, res, next) {

    // Assume valid BookInstance id in field.
    BookInstance.findByIdAndRemove(req.body.id, function deleteBookInstance(err) {
        if (err) {
            return next(err);
        }
        // Success, so redirect to list of BookInstance items.
        res.redirect('/catalog/bookinstances');
    });

};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = function (req, res, next) {

    // Get book, authors and genres for form.
    async.parallel({
        bookinstance: function (callback) {
            BookInstance.findById(req.params.id).populate('book').exec(callback)
        },
        books: function (callback) {
            Book.find(callback)
        },

    }, function (err, results) {
        if (err) {
            return next(err);
        }
        if (results.bookinstance == null) { // No results.
            var err = new Error('Book copy not found');
            err.status = 404;
            return next(err);
        }
        // Success.
        res.render('bookinstance_form', {
            title: 'Update  BookInstance',
            book_list: results.books,
            selected_book: results.bookinstance.book._id,
            bookinstance: results.bookinstance
        });
    });

};

// Handle BookInstance update on POST.
exports.bookinstance_update_post = [

    // Validate fields.
    body('book', 'Book must be specified').isLength({
        min: 1
    }).trim(),
    body('imprint', 'Imprint must be specified').isLength({
        min: 1
    }).trim(),
    body('due_back', 'Invalid date').optional({
        checkFalsy: true
    }).isISO8601(),

    // Sanitize fields.
    sanitizeBody('book').escape(),
    sanitizeBody('imprint').escape(),
    sanitizeBody('status').escape(),
    sanitizeBody('due_back').toDate(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a BookInstance object with escaped/trimmed data and current id.
        var bookinstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back,
            _id: req.params.id
        });

        if (!errors.isEmpty()) {
            // There are errors so render the form again, passing sanitized values and errors.
            Book.find({}, 'title')
                .exec(function (err, books) {
                    if (err) {
                        return next(err);
                    }
                    // Successful, so render.
                    res.render('bookinstance_form', {
                        title: 'Update BookInstance',
                        book_list: books,
                        selected_book: bookinstance.book._id,
                        errors: errors.array(),
                        bookinstance: bookinstance
                    });
                });
            return;
        } else {
            // Data from form is valid.
            BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {}, function (err, thebookinstance) {
                if (err) {
                    return next(err);
                }
                // Successful - redirect to detail page.
                res.redirect(thebookinstance.url);
            });
        }
    }
];