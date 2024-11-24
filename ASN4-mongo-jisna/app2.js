var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var exphbs = require('express-handlebars');
const path = require('path');


// Import the database configuration
var database = require('./config/database');  // Adjust the path if needed

var app = express();

app.engine('handlebars', exphbs.engine({
    extname: '.hbs'  // Specify the file extension as '.hbs'
}));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));


console.log("Views path:", app.get('views')); 

// Setup middleware for parsing
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Connect to MongoDB using the connection string from database.js
mongoose.connect(database.url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

mongoose.connection.once('open', () => {
    console.log('Connected to MongoDB Atlas');
});

// Import Movie model
var Movie = require('./models/movie');

// ROUTES

// Show all movies
app.get('/movies', function (req, res) {
    Movie.find(function (err, movies) {
        if (err) {
            return res.status(500).send({ error: 'Failed to retrieve movies' });
        }
        res.render('movies/index.hbs', { movies: movies });
    });
});

app.get('/movies/new', function (req, res) {
    console.log("Rendering the 'new' page");
    res.render('movies/new.hbs');
});

// Handle the movie insert form submission
app.post('/movies', function (req, res) {
    const { Movie_ID, Title, Released, Genre, Rating } = req.body;

    const newMovie = new Movie({
        Movie_ID: Movie_ID,
        Title: Title,
        Released: Released || '',
        Genre: Genre || '',
        Rating: Rating || 0
    });

    newMovie.save(function (err, movie) {
        if (err) {
            return res.status(500).send({ error: 'Failed to insert new movie' });
        }
        res.redirect(`/movies/${movie.Movie_ID}`);
    });
});


// Show specific movie
app.get('/movies/:identifier', function (req, res) {
    const identifier = req.params.identifier;
    const query = mongoose.Types.ObjectId.isValid(identifier)
        ? { _id: identifier }
        : { Movie_ID: parseInt(identifier) };

    Movie.findOne(query, function (err, movie) {
        if (err || !movie) {
            return res.status(404).send({ error: 'Movie not found' });
        }
        res.render('movies/show.hbs', { movie: movie });
    });
});


// Update movie form
app.get('/movies/edit/:identifier', function (req, res) {
    const identifier = req.params.identifier;
    const query = mongoose.Types.ObjectId.isValid(identifier)
        ? { _id: identifier }
        : { Movie_ID: parseInt(identifier) };

    Movie.findOne(query, function (err, movie) {
        if (err || !movie) {
            return res.status(404).send({ error: 'Movie not found' });
        }
        res.render('movies/edit.hbs', { movie: movie });
    });
});

// Handle the update form submission
app.post('/movies/:identifier', function (req, res) {
    const identifier = req.params.identifier;
    const { movie_title, released } = req.body;

    const updates = {};
    if (movie_title) updates.Title = movie_title;
    if (released) updates.Released = released;

    const query = mongoose.Types.ObjectId.isValid(identifier)
        ? { _id: identifier }
        : { Movie_ID: parseInt(identifier) };

    Movie.findOneAndUpdate(query, updates, { new: true }, function (err, movie) {
        if (err || !movie) {
            return res.status(500).send({ error: 'Failed to update the movie' });
        }
        res.redirect(`/movies/${movie.Movie_ID}`);
    });
});

// Delete movie confirmation
app.get('/movies/delete/:identifier', function (req, res) {
    const identifier = req.params.identifier;
    const query = mongoose.Types.ObjectId.isValid(identifier)
        ? { _id: identifier }
        : { Movie_ID: parseInt(identifier) };

    Movie.findOne(query, function (err, movie) {
        if (err || !movie) {
            return res.status(404).send({ error: 'Movie not found' });
        }
        res.render('movies/delete.hbs', { movie: movie });
    });
});
app.post('/movies/:identifier', function (req, res) {
    const identifier = req.params.identifier;
    // Check if the identifier is a valid ObjectId or Movie_ID (integer)
    const query = mongoose.Types.ObjectId.isValid(identifier)
        ? { _id: mongoose.Types.ObjectId(identifier) }  // match ObjectId if valid
        : { Movie_ID: parseInt(identifier) };            // match Movie_ID if it's a number

    Movie.findOneAndDelete(query, function (err, movie) {
        if (err || !movie) {
            return res.status(500).send({ error: 'Failed to delete the movie' });
        }
        res.redirect('/movies');
        
    });
});

// Start server
const port = process.env.PORT || 8000;
app.listen(port, () => {
    console.log(`App is running on port ${port}`);
});
