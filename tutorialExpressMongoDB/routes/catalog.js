var express = require('express');
var router = express.Router();

// Require controller modules.
var book_controller = require('../controllers/bookController');
var author_controller = require('../controllers/authorController');
var genre_controller = require('../controllers/genreController');
var book_instance_controller = require('../controllers/bookinstanceController');
var country_controller = require('../controllers/countryController');

/// BOOK ROUTES ///

// GET catalog home page.
router.get('/', book_controller.index);

// GET request for creating a Book. NOTE This must come before routes that display Book (uses id).
router.get('/book/create', book_controller.book_create_get);

// POST request for creating Book.
router.post('/book/create', book_controller.book_create_post);

// GET request to delete Book.
router.get('/book/:id/delete', book_controller.book_delete_get);

// POST request to delete Book.
router.post('/book/:id/delete', book_controller.book_delete_post);

// GET request to update Book.
router.get('/book/:id/update', book_controller.book_update_get);

// POST request to update Book.
router.post('/book/:id/update', book_controller.book_update_post);

// GET request for one Book.
router.get('/book/:id', book_controller.book_detail);

// GET request for list of all Book items.
router.get('/books', book_controller.book_list);

/// AUTHOR ROUTES ///

// GET request for creating Author. NOTE This must come before route for id (i.e. display author).
router.get('/author/create', author_controller.author_create_get);

// POST request for creating Author.
router.post('/author/create', author_controller.author_create_post);

// GET request to delete Author.
router.get('/author/:id/delete', author_controller.author_delete_get);

// POST request to delete Author.
router.post('/author/:id/delete', author_controller.author_delete_post);

// GET request to update Author.
router.get('/author/:id/update', author_controller.author_update_get);

// POST request to update Author.
router.post('/author/:id/update', author_controller.author_update_post);

// GET request for one Author.
router.get('/author/:id', author_controller.author_detail);

// GET request for list of all Authors.
router.get('/authors', author_controller.author_list);

/// GENRE ROUTES ///

// GET request for creating a Genre. NOTE This must come before route that displays Genre (uses id).
router.get('/genre/create', genre_controller.genre_create_get);

//POST request for creating Genre.
router.post('/genre/create', genre_controller.genre_create_post);

// GET request to delete Genre.
router.get('/genre/:id/delete', genre_controller.genre_delete_get);

// POST request to delete Genre.
router.post('/genre/:id/delete', genre_controller.genre_delete_post);

// GET request to update Genre.
router.get('/genre/:id/update', genre_controller.genre_update_get);

// POST request to update Genre.
router.post('/genre/:id/update', genre_controller.genre_update_post);

// GET request for one Genre.
router.get('/genre/:id', genre_controller.genre_detail);

// GET request for list of all Genre.
router.get('/genres', genre_controller.genre_list);

/// BOOKINSTANCE ROUTES ///

// GET request for creating a BookInstance. NOTE This must come before route that displays BookInstance (uses id).
router.get('/bookinstance/create', book_instance_controller.bookinstance_create_get);

// POST request for creating BookInstance.
router.post('/bookinstance/create', book_instance_controller.bookinstance_create_post);

// GET request to delete BookInstance.
router.get('/bookinstance/:id/delete', book_instance_controller.bookinstance_delete_get);

// POST request to delete BookInstance.
router.post('/bookinstance/:id/delete', book_instance_controller.bookinstance_delete_post);

// GET request to update BookInstance.
router.get('/bookinstance/:id/update', book_instance_controller.bookinstance_update_get);

// POST request to update BookInstance.
router.post('/bookinstance/:id/update', book_instance_controller.bookinstance_update_post);

// GET request for one BookInstance.
router.get('/bookinstance/:id', book_instance_controller.bookinstance_detail);

// GET request for list of all BookInstance.
router.get('/bookinstances', book_instance_controller.bookinstance_list);


/// COUNTRY ROUTES ///

// GET request for creating Country. NOTE This must come before route for id (i.e. display country).
router.get('/country/create', country_controller.country_create_get);

// POST request for creating Country.
router.post('/country/create', country_controller.country_create_post);

// GET request to delete Country.
router.get('/country/:id/delete', country_controller.country_delete_get);

// POST request to delete Country.
router.post('/country/:id/delete', country_controller.country_delete_post);

// GET request to update Country.
router.get('/country/:id/update', country_controller.country_update_get);

// POST request to update Country.
router.post('/country/:id/update', country_controller.country_update_post);

// GET request for one Country.
router.get('/country/:id', country_controller.country_detail);

// GET request for list of all Country.
router.get('/countries', country_controller.country_list);


/// PRIZE ROUTES ///

// GET request for creating  a Prize. NOTE This must come before route that displays Prize (uses id).
router.get('/prize/create', prize_controller.prize_create_get);

//POST request for creating Prize.
router.post('/prize/create', prize_controller.prize_create_post);

// GET request to delete Prize.
router.get('/prize/:id/delete', prize_controller.prize_delete_get);

// POST request to delete Prize.
router.post('/prize/:id/delete', prize_controller.prize_delete_post);

// GET request to update Prize.
router.get('/prize/:id/update', prize_controller.prize_update_get);

// POST request to update Prize.
router.post('/prize/:id/update', prize_controller.prize_update_post);

// GET request for one Prize.
router.get('/prize/:id', prize_controller.prize_detail);

// GET request for list of all Prize.
router.get('/prizes', prize_controller.prize_list);



/// FORMATOS ROUTES ///

// GET request for creating a Formato. NOTE This must come before route that displays Formato (uses id).
router.get('/formato/create', formato_controller.formato_create_get);

//POST request for creating Formato.
router.post('/formato/create', formato_controller.formato_create_post);

// GET request to delete Formato.
router.get('/formato/:id/delete', formato_controller.formato_delete_get);

// POST request to delete Formato.
router.post('/formato/:id/delete', formato_controller.formato_delete_post);

// GET request to update Formato.
router.get('/formato/:id/update', formato_controller.formato_update_get);

// POST request to update Formato.
router.post('/formato/:id/update', formato_controller.formato_update_post);

// GET request for one Formato.
router.get('/formato/:id', formato_controller.formato_detail);

// GET request for list of all Formato.
router.get('/formato', formato_controller.formato_list);



module.exports = router;
