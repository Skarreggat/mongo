var Prize = require('../models/prize');
var Book = require('../models/book');
var async = require('async');

const {
    body,
    validationResult
} = require('express-validator/check');
const {
    sanitizeBody
} = require('express-validator/filter');

// Display list of all Prize.
exports.prize_list = function (req, res, next) {
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
        var sortValue = ['name']
        var sortName = ['Name']

        //Crear THs
        for (var z = 0; z < sortValue.length; z++) {
            str += '<th><a class="sortLink" href="?sort=' + sortValue[z] + '&page=0">' + sortName[z] + '</a></th>'
        }
        return str
    }
    Prize.find()
        .sort(sortParams)
        .limit(perPage)
        .skip(perPage * page)
        .exec(function (err, list_prizes, count) {
            if (err) {
                return next(err);
            }
            Prize.countDocuments().exec(function (err, count) {
                res.render('prize_list', {
                    title: 'Prize List',
                    prize_list: list_prizes,
                    page: page,
                    pages: count / perPage,
                    count: count
                });
            });
        })

};

// Display detail page for a specific Prize.
exports.prize_detail = function (req, res, next) {

    async.parallel({
        prize: function (callback) {

            Prize.findById(req.params.id)
                .exec(callback);
        },

        prize_books: function (callback) {
            Book.find({
                    'prize': req.params.id
                })
                .exec(callback);
        },

    }, function (err, results) {
        if (err) {
            return next(err);
        }
        if (results.prize == null) { // No results.
            var err = new Error('Prize not found');
            err.status = 404;
            return next(err);
        }
        // Successful, so render.
        res.render('prize_detail', {
            title: 'Prize Detail',
            prize: results.prize,
            prize_books: results.prize_books
        });
    });

};

// Display Prize create form on GET.
exports.prize_create_get = function (req, res, next) {
    res.render('prize_form', {
        title: 'Create Prize'
    });
};

// Handle Genre create on POST.
exports.prize_create_post = [

    // Validate that the name field is not empty.
    body('name', 'Prize name required').isLength({
        min: 1
    }).trim(),

    // Sanitize (trim) the name field.
    sanitizeBody('name').escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a genre object with escaped and trimmed data.
        var prize = new Prize({
            name: req.body.name
        });


        if (!errors.isEmpty()) {
            // There are errors. Render the form again with sanitized values/error messages.
            res.render('prize_form', {
                title: 'Create Prize',
                prize: prize,
                errors: errors.array()
            });
            return;
        } else {
            // Data from form is valid.
            // Check if Prize with same name already exists.
            Prize.findOne({
                    'name': req.body.name
                })
                .exec(function (err, found_prize) {
                    if (err) {
                        return next(err);
                    }

                    if (found_prize) {
                        // Prize exists, redirect to its detail page.
                        res.redirect(found_prize.url);
                    } else {

                        prize.save(function (err) {
                            if (err) {
                                return next(err);
                            }
                            // Prize saved. Redirect to prize detail page.
                            res.redirect(prize.url);
                        });

                    }

                });
        }
    }
];

// Display Prize delete form on GET.
exports.prize_delete_get = function (req, res, next) {

    async.parallel({
        prize: function (callback) {
            Prize.findById(req.params.id).exec(callback);
        },
        prize_books: function (callback) {
            Book.find({
                'prize': req.params.id
            }).exec(callback);
        },
    }, function (err, results) {
        if (err) {
            return next(err);
        }
        if (results.prize == null) { // No results.
            res.redirect('/catalog/prizes');
        }
        // Successful, so render.
        res.render('prize_delete', {
            title: 'Delete Prize',
            prize: results.prize,
            prize_books: results.prize_books
        });
    });

};

// Handle Prize delete on POST.
exports.prize_delete_post = function (req, res, next) {

    async.parallel({
        prize: function (callback) {
            Prize.findById(req.params.id).exec(callback);
        },
        prize_books: function (callback) {
            Book.find({
                'prize': req.params.id
            }).exec(callback);
        },
    }, function (err, results) {
        if (err) {
            return next(err);
        }
        // Success
        if (results.prize_books.length > 0) {
            // Prize has books. Render in same way as for GET route.
            res.render('prize_delete', {
                title: 'Delete Prize',
                prize: results.prize,
                prize_books: results.prize_books
            });
            return;
        } else {
            // Prize has no books. Delete object and redirect to the list of prizes.
            Prize.findByIdAndRemove(req.body.id, function deleteGenre(err) {
                if (err) {
                    return next(err);
                }
                // Success - go to prizes list.
                res.redirect('/catalog/prizes');
            });

        }
    });

};

// Display Prize update form on GET.
exports.prize_update_get = function (req, res, next) {

    Prize.findById(req.params.id, function (err, prize) {
        if (err) {
            return next(err);
        }
        if (prize == null) { // No results.
            var err = new Error('Prize not found');
            err.status = 404;
            return next(err);
        }
        // Success.
        res.render('prize_form', {
            title: 'Update Prize',
            prize: prize
        });
    });

};

// Handle Prize update on POST.
exports.prize_update_post = [

    // Validate that the name field is not empty.
    body('name', 'Prize name required').isLength({
        min: 1
    }).trim(),

    // Sanitize (escape) the name field.
    sanitizeBody('name').escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request .
        const errors = validationResult(req);

        // Create a prize object with escaped and trimmed data (and the old id!)
        var prize = new Prize({
            name: req.body.name,
            _id: req.params.id
        });


        if (!errors.isEmpty()) {
            // There are errors. Render the form again with sanitized values and error messages.
            res.render('prize_form', {
                title: 'Update Prize',
                prize: prize,
                errors: errors.array()
            });
            return;
        } else {
            // Data from form is valid. Update the record.
            Prize.findByIdAndUpdate(req.params.id, prize, {}, function (err, theprize) {
                if (err) {
                    return next(err);
                }
                // Successful - redirect to prize detail page.
                res.redirect(theprize.url);
            });
        }
    }
];