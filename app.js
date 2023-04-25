const express = require('express');
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const app = express();
require('dotenv').config()
const session = require('express-session');
const { ObjectId } = require('mongodb');



app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true
}));


// Serve static files
app.use(express.static('public'));

// Set up the Express app
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set('view engine', 'ejs');

// Configure the MongoDB Atlas connection
const uri = `mongodb+srv://admin:${process.env.DB_PASSWORD}@cluster0.f0vgbuk.mongodb.net/<dbname>?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true });

let productsCollection;
let usersCollection;

client.connect(err => {
  if (err) {
    console.log(err);
  } else {
    console.log('Database connection successful');
    productsCollection = client.db('products').collection('products');
    usersCollection = client.db('products').collection('users');
  }
});

// Render a list of products on the index page
app.get('/', (req, res) => {
  productsCollection.find().sort({ dato: -1 }).limit(10).toArray((err, results) => {
    if (err) {
      console.log(err);
    } else {
      res.render('index', { products: results });
    }
  });
});

app.get('/about', (req, res) => {
  res.render('about');
});

app.get('/admin', (req, res) => {
  res.render('admin');
});

function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    // If the user is authenticated, call the next middleware function
    return next();
  } else {
    // If the user is not authenticated, redirect to the login page
    res.redirect('/admin');
  }
}

app.post('/admin', (req, res) => {
  const { username, password } = req.body;

  usersCollection.findOne({ username: username, password: password }, (err, user) => {
    if (err) {
      console.log(err);
    } else {
      if (user) {
        // If the username and password match, set the user in the session and redirect to the add-products page
        req.session.user = user;
        res.redirect('/add-products');
      } else {
        // If the username and password don't match, display an error message
        res.render('admin', { errorMessage: 'Invalid username or password!' });
      }
    }
  });
});


// Render the add-products page
app.get('/add-products', requireAuth, (req, res) => {
  productsCollection.find().toArray((err, products) => {
    if (err) {
      console.log(err);
    } else {
      res.render('add-products', { products: products });
    }
  });
});




app.get('/veileder', requireAuth, (req, res) => {
  res.render('veileder');
});


app.post('/delete-product', requireAuth, (req, res) => {
  const productId = req.query.id;
  productsCollection.deleteOne({ _id: ObjectId(productId) }, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      console.log('Product deleted from database');
      res.redirect('/add-products');
    }
  });
});


// Add a new product to the database
app.post('/products', (req, res) => {
  const { tittel, dato, modell, merke, pris, artikkelnummer } = req.body;
  const products = { tittel, dato, modell, merke, pris, artikkelnummer };
  productsCollection.insertOne(products, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      console.log('Product added to database');
      res.redirect('/');
    }
  });
});

// Start the Express app
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}`));
