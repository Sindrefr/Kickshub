const express = require('express');
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const app = express();

// Serve static files
app.use(express.static('public'));

// Set up the Express app
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set('view engine', 'ejs');

// Configure the MongoDB Atlas connection
const uri = 'mongodb+srv://admin:eUOYaRaihHV7MwQA@cluster0.f0vgbuk.mongodb.net/<dbname>?retryWrites=true&w=majority';
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
  productsCollection.find().sort({ date: -1 }).limit(10).toArray((err, results) => {
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

app.post('/admin', (req, res) => {
  const { username, password } = req.body;

  usersCollection.findOne({ username: username, password: password }, (err, user) => {
    if (err) {
      console.log(err);
    } else {
      if (user) {
        // If the username and password match, redirect to the add-products page
        res.redirect('/add-products');
      } else {
        // If the username and password don't match, display an error message
        res.render('admin', { message: 'Invalid username or password' });
      }
    }
  });
});

// Render the add-products page
app.get('/add-products', (req, res) => {
  res.render('add-products');
});

// Add a new product to the database
app.post('/products', (req, res) => {
  const { tittel, dato, modell, merke, pris, artikkelnummer } = req.body;
  const product = { tittel, dato, modell, merke, pris, artikkelnummer };
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
