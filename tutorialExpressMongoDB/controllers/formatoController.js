var Formato = require('../models/formato');
var Book = require('../models/book');
var async = require('async');

const {
    body,
    validationResult
} = require('express-validator/check');
const {
    sanitizeBody
} = require('express-validator/filter');

// Display list of all Genre.
exports.formato_list = function (req, res, next) {
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
    Formato.find()
        .sort(sortParams)
        .exec(function (err, list_formatos, count) { //formatos o formato en el list==?
            if (err) {
                return next(err);
            }
            Formato.countDocuments().exec(function (err, count) {
                res.render('formato_list', {
                    title: 'Formato List',
                    formato_list: list_formatos,
                    page: page,
                    pages: count / perPage,
                    count: count
                }); //genres==formatos y fenre a formato?
            });
        })

};

// Display detail page for a specific Genre.
exports.formato_detail = function (req, res, next) {

    async.parallel({
        formato: function (callback) {

            Formato.findById(req.params.id)
                .exec(callback);
        },

        formato_books: function (callback) {
            Book.find({
                    'formato': req.params.id
                })
                .exec(callback);
        },

    }, function (err, results) {
        if (err) {
            return next(err);
        }
        if (results.formato == null) { // No results.
            var err = new Error('Formato not found');
            err.status = 404;
            return next(err);
        }
        // Successful, so render.
        res.render('formato_detail', {
            title: 'Formato Detail',
            formato: results.formato,
            formato_books: results.formato_books
        });
    });

};

// Display Genre create form on GET.
exports.formato_create_get = function (req, res, next) {
    res.render('formato_form', {
        title: 'Create Formato'
    });
};

// Handle Genre create on POST.
exports.formato_create_post = [

    // Validate that the name field is not empty.
    body('name', 'Formato name required').isLength({
        min: 1
    }).trim(),

    // Sanitize (trim) the name field.
    sanitizeBody('name').escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a genre object with escaped and trimmed data.
        var formato = new Formato({
            name: req.body.name
        });


        if (!errors.isEmpty()) {
            // There are errors. Render the form again with sanitized values/error messages.
            res.render('formato_form', {
                title: 'Create Formato',
                formato: formato,
                errors: errors.array()
            });
            return;
        } else {
            // Data from form is valid.
            // Check if Genre with same name already exists.
            Formato.findOne({
                    'name': req.body.name
                })
                .exec(function (err, found_formato) {
                    if (err) {
                        return next(err);
                    }

                    if (found_formato) {
                        // Genre exists, redirect to its detail page.
                        res.redirect(found_formato.url);
                    } else {

                        formato.save(function (err) {
                            if (err) {
                                return next(err);
                            }
                            // Genre saved. Redirect to genre detail page.
                            res.redirect(formato.url);
                        });

                    }

                });
        }
    }
];

// Display Genre delete form on GET.
exports.formato_delete_get = function (req, res, next) {

    async.parallel({
        formato: function (callback) {
            Formato.findById(req.params.id).exec(callback);
        },
        formato_books: function (callback) {
            Book.find({
                'formato': req.params.id
            }).exec(callback);
        },
    }, function (err, results) {
        if (err) {
            return next(err);
        }
        if (results.formato == null) { // No results.
            res.redirect('/catalog/formatos'); //genres== formatos??
        }
        // Successful, so render.
        res.render('formato_delete', {
            title: 'Delete Formato',
            formato: results.formato,
            formato_books: results.formato_books
        });
    });

};

// Handle Genre delete on POST.
exports.formato_delete_post = function (req, res, next) {

    async.parallel({
        formato: function (callback) {
            Formato.findById(req.params.id).exec(callback);
        },
        formato_books: function (callback) {
            Book.find({
                'formato': req.params.id
            }).exec(callback);
        },
    }, function (err, results) {
        if (err) {
            return next(err);
        }
        // Success
        if (results.formato_books.length > 0) {
            // Genre has books. Render in same way as for GET route.
            res.render('formato_delete', {
                title: 'Delete Formato',
                formato: results.formato,
                formato_books: results.formato_books
            });
            return;
        } else {
            // Genre has no books. Delete object and redirect to the list of genres.
            Formato.findByIdAndRemove(req.body.id, function deleteFormato(err) {
                if (err) {
                    return next(err);
                }
                // Success - go to genres list.
                res.redirect('/catalog/formatos'); //genres== formatos?
            });

        }
    });

};

// Display Genre update form on GET.
exports.formato_update_get = function (req, res, next) {

    Formato.findById(req.params.id, function (err, formato) {
        if (err) {
            return next(err);
        }
        if (formato == null) { // No results.
            var err = new Error('Formato not found');
            err.status = 404;
            return next(err);
        }
        // Success.
        res.render('formato_form', {
            title: 'Update Formato',
            formato: formato
        });
    });

};

// Handle Genre update on POST.
exports.formato_update_post = [

    // Validate that the name field is not empty.
    body('name', 'Formato name required').isLength({
        min: 1
    }).trim(),

    // Sanitize (escape) the name field.
    sanitizeBody('name').escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request .
        const errors = validationResult(req);

        // Create a genre object with escaped and trimmed data (and the old id!)
        var formato = new Formato({
            name: req.body.name,
            _id: req.params.id
        });


        if (!errors.isEmpty()) {
            // There are errors. Render the form again with sanitized values and error messages.
            res.render('formato_form', {
                title: 'Update Formato',
                formato: formato,
                errors: errors.array()
            });
            return;
        } else {
            // Data from form is valid. Update the record.
            Formato.findByIdAndUpdate(req.params.id, formato, {}, function (err, theformato) {
                if (err) {
                    return next(err);
                }
                // Successful - redirect to genre detail page.
                res.redirect(theformato.url);
            });
        }
    }
];