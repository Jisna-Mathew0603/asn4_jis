var express = require('express');
var mongoose = require('mongoose');
var app = express();
var database = require('./config/database');
var bodyParser = require('body-parser');

// Setup middleware for parsing
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Connect to MongoDB Atlas
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

// 1. Show all movie-info
app.get('/api/movies', function (req, res) {
    Movie.find(function (err, movies) {
        if (err) {
            return res.status(500).send({ error: 'Failed to retrieve movies' });
        }
        res.json(movies);
    });
});


// 2. Show movie-info based on _id or movie_id
app.get('/api/movies/:identifier', async (req, res) => {
    const identifier = req.params.identifier;

    try {
        // Create query to search by Movie_ID as number, Title as string
        const query = mongoose.Types.ObjectId.isValid(identifier)
            ? { _id: identifier }
            : !isNaN(Number(identifier))
            ? { Movie_ID: parseInt(identifier) }  // Handle Movie_ID as a number
            : { Title: new RegExp(`^${identifier}$`, 'i') };  // Case-insensitive search for title

        const movie = await Movie.findOne(query);

        if (!movie) {
            return res.status(404).send({ error: 'Movie not found' });
        }

        res.json(movie);
    } catch (err) {
        console.error('Error retrieving movie:', err);
        res.status(500).send({ error: 'Failed to retrieve the movie' });
    }
});


// 3. Insert a new movie
app.post('/api/movies', function (req, res) {
    const { Movie_ID, Title, Released, Genre, Rating } = req.body;

    // Validate input
    if (!Movie_ID || !Title) {
        return res.status(400).send({ error: 'Movie_ID and Title are required' });
    }

    // Create a new movie instance
    const newMovie = new Movie({
        Movie_ID: Movie_ID,
        Title: Title,
        Released: Released || '',   // Optional fields
        Genre: Genre || '',
        Rating: Rating || 0         // Default value if not provided
    });

    // Save the movie to the database
    newMovie.save(function (err, movie) {
        if (err) {
            return res.status(500).send({ error: 'Failed to insert new movie' });
        }
        res.status(201).json({ success: 'Movie added successfully', movie });
    });
});

// 5 Update movie_title & "Released" of an existing movie (based on _id or movie_id)
app.put('/api/movies/:identifier', function (req, res) {
    const identifier = req.params.identifier;
    const { movie_title, released } = req.body;

    // Validate input
    if (!movie_title && !released) {
        return res.status(400).send({ error: 'Provide at least one field to update' });
    }

    // Create the update object
    const updates = {};
    if (movie_title) updates.Title = movie_title;
    if (released) updates.Released = released;

    // Check if the identifier is a valid ObjectId (for MongoDB _id) or if it's a Movie_ID or Title
    const query = mongoose.Types.ObjectId.isValid(identifier)
        ? { _id: identifier }
        : isNaN(Number(identifier))
        ? { Title: new RegExp(`^${identifier}$`, 'i') } // Case-insensitive search for Title
        : { Movie_ID: parseInt(identifier) };

    // Find and update the movie
    Movie.findOneAndUpdate(query, updates, { new: true }, function (err, movie) {
        if (err) {
            return res.status(500).send({ error: 'Failed to update the movie' });
        }
        if (!movie) {
            return res.status(404).send({ error: 'Movie not found' });
        }
        res.json({ success: 'Movie updated successfully', movie });
    });
});

// 5. Delete an existing movie (based on _id or movie_id)
app.delete('/api/movies/:identifier', function (req, res) {
    const identifier = req.params.identifier;

    // Check if the identifier is a valid ObjectId (for MongoDB _id) or if it's a Movie_ID or Title
    const query = mongoose.Types.ObjectId.isValid(identifier)
        ? { _id: identifier }
        : isNaN(Number(identifier))
        ? { Title: new RegExp(`^${identifier}$`, 'i') } // Case-insensitive search for Title
        : { Movie_ID: parseInt(identifier) };

    // Find and delete the movie
    Movie.findOneAndDelete(query, function (err, movie) {
        if (err) {
            return res.status(500).send({ error: 'Failed to delete the movie' });
        }
        if (!movie) {
            return res.status(404).send({ error: 'Movie not found' });
        }
        res.json({ success: 'Movie deleted successfully', movie });
    });
});

// Start server
const port = process.env.PORT || 8000;
app.listen(port, () => {
    console.log(`App is running on port ${port}`);
});
