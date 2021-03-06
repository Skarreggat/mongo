var async = require('async')
var Author = require('../models/author')
var Book = require('../models/book')
var Country = require('../models/countries')

const {
    body,
    validationResult
} = require('express-validator/check');
const {
    sanitizeBody
} = require('express-validator/filter');

// Display list of all Authors.
exports.author_list = function (req, res, next) {
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
        var sortValue = ['first_name', 'date_of_birth']
        var sortName = ['First Name', 'Birthdate']

        //Crear THs
        for (var z = 0; z < sortValue.length; z++) {
            str += '<th><a class="sortLink" href="?sort=' + sortValue[z] + '&page=0">' + sortName[z] + '</a></th>'
        }
        return str
    }
    Author.find()
        .sort(sortParams)
        .limit(perPage)
        .skip(perPage * page)
        .exec(function (err, list_authors) {
            if (err) {
                return next(err);
            }
            Author.countDocuments().exec(function (err, count) {
                res.render('author_list', {
                    title: 'Author List',
                    author_list: list_authors,
                    page: page,
                    pages: count / perPage,
                    count: count
                });
            })
        })

};

// Display detail page for a specific Author.
exports.author_detail = function (req, res, next) {
    async.parallel({
        author: function (callback) {
            Author.findById(req.params.id)
                .exec(callback)
        },
        authors_books: function (callback) {
            Book.find({
                    'author': req.params.id
                }, 'title summary')
                .exec(callback)
        },
        author_country: function (callback) {
            Author.findById(req.params.id)
                .populate('country')
                .exec(callback)
        }
    }, function (err, results) {
        if (err) {
            return next(err);
        } // Error in API usage.
        if (results.author == null) { // No results.
            var err = new Error('Author not found');
            err.status = 404;
            return next(err);
        }
        // Successful, so render.
        res.render('author_detail', {
            title: 'Author Detail',
            author: results.author,
            author_books: results.authors_books,
            author_country: results.author_country
        });
    });

};

// Display Author create form on GET.
exports.author_create_get = function (req, res, next) {
    async.parallel({
        countries: function (callback) {
            Country.find(callback);
        }
    }, function (err, results) {
        if (err) {
            return next(err);
        } // Error in API usage.

        // Successful, so render.
        res.render('author_form', {
            title: 'Create Author',
            countries: results.countries
        });
    });
};

// Handle Author create on POST.
// Handle Author create on POST.
exports.author_create_post = [

    // Convert the country to an array.
    (req, res, next) => {
        if (!(req.body.country instanceof Array)) {
            if (typeof req.body.country === 'undefined')
                req.body.country = [];
            else
                req.body.country = new Array(req.body.country);
        }
        next();
    },
    // Validate fields.
    body('first_name').isLength({
        min: 1
    }).trim().withMessage('First name must be specified.')
    .isAlphanumeric().withMessage('First name has non-alphanumeric characters.'),
    body('family_name').isLength({
        min: 1
    }).trim().withMessage('Family name must be specified.')
    .isAlphanumeric().withMessage('Family name has non-alphanumeric characters.'),
    body('date_of_birth', 'Invalid date of birth').optional({
        checkFalsy: true
    }).isISO8601(),
    body('date_of_death', 'Invalid date of death').optional({
        checkFalsy: true
    }).isISO8601(),

    // Sanitize fields.
    sanitizeBody('first_name').escape(),
    sanitizeBody('family_name').escape(),
    sanitizeBody('date_of_birth').toDate(),
    sanitizeBody('date_of_death').toDate(),
    sanitizeBody('*').escape(),
    sanitizeBody('genre.*').escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create Author object with escaped and trimmed data
        var author = new Author({
            first_name: req.body.first_name,
            family_name: req.body.family_name,
            date_of_birth: req.body.date_of_birth,
            date_of_death: req.body.date_of_death,
            country: req.body.country
        });

        if (!errors.isEmpty()) {

            // Get all authors and genres for form.
            async.parallel({

                countries: function (callback) {
                    Country.find(callback);
                },
            }, function (err, results) {
                if (err) {
                    return next(err);
                }

                // Mark our selected genres as checked.
                for (let i = 0; i < results.countries.length; i++) {
                    if (author.country.indexOf(results.countries[i]._id) > -1) {
                        results.countries[i].checked = 'true';
                    }
                }
                // There are errors. Render form again with sanitized values/errors messages.
                res.render('author_form', {
                    title: 'Create Author',
                    author: author,
                    errors: errors.array()
                });
            });
            return;
        } else {
            // Data from form is valid.

            // Save author.
            author.save(function (err) {
                if (err) {
                    return next(err);
                }
                // Successful - redirect to new author record.
                res.redirect(author.url);
            });
        }
    }
];


// Display Author delete form on GET.
exports.author_delete_get = function (req, res, next) {

    async.parallel({
        author: function (callback) {
            Author.findById(req.params.id).exec(callback)
        },
        authors_books: function (callback) {
            Book.find({
                'author': req.params.id
            }).exec(callback)
        },
    }, function (err, results) {
        if (err) {
            return next(err);
        }
        if (results.author == null) { // No results.
            res.redirect('/catalog/authors');
        }
        // Successful, so render.
        res.render('author_delete', {
            title: 'Delete Author',
            author: results.author,
            author_books: results.authors_books
        });
    });

};

// Handle Author delete on POST.
exports.author_delete_post = function (req, res, next) {

    async.parallel({
        author: function (callback) {
            Author.findById(req.body.authorid).exec(callback)
        },
        authors_books: function (callback) {
            Book.find({
                'author': req.body.authorid
            }).exec(callback)
        },
    }, function (err, results) {
        if (err) {
            return next(err);
        }
        // Success.
        if (results.authors_books.length > 0) {
            // Author has books. Render in same way as for GET route.
            res.render('author_delete', {
                title: 'Delete Author',
                author: results.author,
                author_books: results.authors_books
            });
            return;
        } else {
            // Author has no books. Delete object and redirect to the list of authors.
            Author.findByIdAndRemove(req.body.authorid, function deleteAuthor(err) {
                if (err) {
                    return next(err);
                }
                // Success - go to author list.
                res.redirect('/catalog/authors')
            })

        }
    });

};

// Display Author update form on GET.
exports.author_update_get = function (req, res, next) {

    Author.findById(req.params.id, function (err, author) {
        if (err) {
            return next(err);
        }
        if (author == null) { // No results.
            var err = new Error('Author not found');
            err.status = 404;
            return next(err);
        }
        // Success.
        res.render('author_form', {
            title: 'Update Author',
            author: author
        });

    });
};

// Handle Author update on POST.
exports.author_update_post = [

    // Validate fields.
    body('first_name').isLength({
        min: 1
    }).trim().withMessage('First name must be specified.')
    .isAlphanumeric().withMessage('First name has non-alphanumeric characters.'),
    body('family_name').isLength({
        min: 1
    }).trim().withMessage('Family name must be specified.')
    .isAlphanumeric().withMessage('Family name has non-alphanumeric characters.'),
    body('date_of_birth', 'Invalid date of birth').optional({
        checkFalsy: true
    }).isISO8601(),
    body('date_of_death', 'Invalid date of death').optional({
        checkFalsy: true
    }).isISO8601(),

    // Sanitize fields.
    sanitizeBody('first_name').escape(),
    sanitizeBody('family_name').escape(),
    sanitizeBody('date_of_birth').toDate(),
    sanitizeBody('date_of_death').toDate(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create Author object with escaped and trimmed data (and the old id!)
        var author = new Author({
            first_name: req.body.first_name,
            family_name: req.body.family_name,
            date_of_birth: req.body.date_of_birth,
            date_of_death: req.body.date_of_death,
            _id: req.params.id
        });

        if (!errors.isEmpty()) {
            // There are errors. Render the form again with sanitized values and error messages.
            res.render('author_form', {
                title: 'Update Author',
                author: author,
                errors: errors.array()
            });
            return;
        } else {
            // Data from form is valid. Update the record.
            Author.findByIdAndUpdate(req.params.id, author, {}, function (err, theauthor) {
                if (err) {
                    return next(err);
                }
                // Successful - redirect to genre detail page.
                res.redirect(theauthor.url);
            });
        }
    }
];