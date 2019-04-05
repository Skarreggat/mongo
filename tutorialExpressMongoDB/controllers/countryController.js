var Country = require('../models/countries')
var async = require('async')
var Author = require('../models/author')

const { body, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

// Display list of all Countries.
exports.country_list = function (req, res, next) {

    Country.find()
        .sort([['name', 'ascending']])
        .exec(function (err, list_countries) {
            if (err) { return next(err); }
            // Successful, so render.
            res.render('country_list', { title: 'Country List', country_list: list_countries });
        })

};

// Display detail page for a specific Country.
exports.country_detail = function (req, res, next) {

    async.parallel({
        country: function (callback) {
            Country.findById(req.params.id)
                .exec(callback)
        },
        countries_authors: function (callback) {
            Author.find({ 'country': req.params.id })
                .exec(callback)
        },
    }, function (err, results) {
        if (err) { return next(err); } // Error in API usage.
        if (results.country == null) { // No results.
            var err = new Error('Country not found');
            err.status = 404;
            return next(err);
        }
        // Successful, so render.
        res.render('country_detail', { title: 'Country Detail', country: results.country, country_authors: results.countries_authors });
    });

};

// Display Author create form on GET.
exports.country_create_get = function (req, res, next) {
    res.render('country_form', { title: 'Create Country' });
};

// Handle Author create on POST.
exports.country_create_post = [

    // Validate fields.
    body('name').isLength({ min: 1 }).trim().withMessage('Name must be specified.')
        .isAlphanumeric().withMessage('Name has non-alphanumeric characters.'),
    body('continent').isLength({ min: 1 }).trim().withMessage('Continent must be specified.')
        .isAlphanumeric().withMessage('Continent has non-alphanumeric characters.'),

    // Sanitize fields.
    sanitizeBody('name').escape(),
    sanitizeBody('continent').escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create country object with escaped and trimmed data
        var country = new Country(
            {
                name: req.body.name,
                continent: req.body.continent,
            }
        );

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/errors messages.
            res.render('country_form', { title: 'Create Country', country: country, errors: errors.array() });
            return;
        }
        else {
            // Data from form is valid.

            // Save country.
            country.save(function (err) {
                if (err) { return next(err); }
                // Successful - redirect to new country record.
                res.redirect(country.url);
            });
        }
    }
];



// Display country delete form on GET.
exports.country_delete_get = function (req, res, next) {

    async.parallel({
        country: function (callback) {
            Country.findById(req.params.id).exec(callback)
        },
        countries_authors: function (callback) {
            Author.find({ 'first_name': req.params.id }).exec(callback)
        },
    }, function (err, results) {
        if (err) { return next(err); }
        if (results.country == null) { // No results.
            res.redirect('/catalog/country');
        }
        // Successful, so render.
        res.render('country_delete', { title: 'Delete Country', country: results.country, country_authors: results.countries_authors });
    });

};

// Handle country delete on POST.
exports.country_delete_post = function (req, res, next) {

    async.parallel({
        country: function (callback) {
            Country.findById(req.body.countryid).exec(callback)
        },
        countries_authors: function (callback) {
            Author.find({ 'first_name': req.body.countryid }).exec(callback)//nosee*******************************
        },
    }, function (err, results) {
        if (err) { return next(err); }
        // Success.
        if (results.countries_authors.length > 0) {
            res.render('country_delete', { title: 'Delete Country', country: results.country, country_authors: results.countries_authors });
            return;
        }
        else {
            // Author has no books. Delete object and redirect to the list of authors.
            Country.findByIdAndRemove(req.body.countryid, function deleteCountry(err) {
                if (err) { return next(err); }
                // Success - go to author list.
                res.redirect('/catalog/countries')//*******************************************************
            })

        }
    });

};

// Display Author update form on GET.
exports.country_update_get = function (req, res, next) {

    Country.findById(req.params.id, function (err, country) {
        if (err) { return next(err); }
        if (country == null) { // No results.
            var err = new Error('Country not found');
            err.status = 404;
            return next(err);
        }
        // Success.
        res.render('country_form', { title: 'Update Country', country: country });

    });
};

// Handle Author update on POST.
exports.country_update_post = [

    // Validate fields.
    body('name').isLength({ min: 1 }).trim().withMessage('Name must be specified.')
        .isAlphanumeric().withMessage('Name has non-alphanumeric characters.'),
    body('continent').isLength({ min: 1 }).trim().withMessage('Continent must be specified.')
        .isAlphanumeric().withMessage('Continent has non-alphanumeric characters.'),

    // Sanitize fields.
    sanitizeBody('name').escape(),
    sanitizeBody('continent').escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create Author object with escaped and trimmed data (and the old id!)
        var country = new Country(
            {
                name: req.body.name,
                continent: req.body.continent,
                _id: req.params.id
            }
        );

        if (!errors.isEmpty()) {
            // There are errors. Render the form again with sanitized values and error messages.
            res.render('country_form', { title: 'Update Country', country: country, errors: errors.array() });
            return;
        }
        else {
            // Data from form is valid. Update the record.
            Country.findByIdAndUpdate(req.params.id, country, {}, function (err, thecountry) {
                if (err) { return next(err); }
                // Successful - redirect to genre detail page.
                res.redirect(thecountry.url);
            });
        }
    }
];
