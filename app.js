const express = require('express');
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const app = express();
require('dotenv').config()
const session = require('express-session');
const { ObjectId } = require('mongodb');

// Konfigurerer express-session midleware for å lagre session data i MongoDB
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true
}));

// Håndterer statiske filer i public mappen
app.use(express.static('public'));

// Konfigurerer appen til å bruke bodyParser for å tolke URL-encoded data og JSON-data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Setter ejs som view engine
app.set('view engine', 'ejs');

// Konfigurerer MongoDB Atlas connection string
const uri = `mongodb+srv://admin:${process.env.DB_PASSWORD}@cluster0.f0vgbuk.mongodb.net/<dbname>?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true });

let productsCollection;
let usersCollection;

// Koble til MongoDB-databasen og lagre referanser til products og users collections
client.connect(err => {
  if (err) {
    console.log(err);
  } else {
    console.log('Database connection successful');
    productsCollection = client.db('products').collection('products');
    usersCollection = client.db('products').collection('users');
  }
});

// Viser en liste over produkter på index siden
app.get('/', (req, res) => {
  productsCollection.find().sort({ dato: -1 }).limit(10).toArray((err, results) => {
    if (err) {
      console.log(err);
    } else {
      res.render('index', { products: results });
    }
  });
});

// Viser about siden
app.get('/about', (req, res) => {
  res.render('about');
});

// Viser admin siden
app.get('/admin', (req, res) => {
  res.render('admin');
});

// Middleware funksjon som sjekker om brukeren er autentisert
function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    // Hvis brukeren er autentisert, fortsetter requesten til neste middleware funksjon
    return next();
  } else {
    // Hvis brukeren ikke er autentisert, redirect til login siden
    res.redirect('/admin');
  }
}

// Login funksjonalitet
app.post('/admin', (req, res) => {
  const { username, password } = req.body;

  usersCollection.findOne({ username: username, password: password }, (err, user) => {
    if (err) {
      console.log(err);
    } else {
      if (user) {
        // Hvis brukernavn og passord matcher, settes brukeren i session og redirect til add-products siden
        req.session.user = user;
        res.redirect('/add-products');
      } else {
        // Hvis brukernavn og passord ikke matcher, vis en feilmelding
        res.render('admin', { errorMessage: 'Invalid username or password!' });
      }
    }
  });
});


// Render add-products siden når brukeren besøker URL-en /add-products
// Krever at brukeren er logget inn
app.get('/add-products', requireAuth, (req, res) => {
  productsCollection.find().toArray((err, products) => {
    if (err) {
      console.log(err);
    } else {
      res.render('add-products', { products: products });
    }
  });
});

// Render veileder siden når brukeren besøker URL-en /veileder
// Krever at brukeren er logget inn
app.get('/veileder', requireAuth, (req, res) => {
  res.render('veileder');
});

app.get('/veiledning-admin', requireAuth, (req, res) => {
  res.render('veiledning-admin');
});

// Sletter et produkt fra databasen når brukeren sender en POST-forespørsel til URL-en /delete-product med produktets ID
// Krever at brukeren er logget inn
app.post('/delete-product', requireAuth, (req, res) => {
  const productId = req.query.id;
  productsCollection.deleteOne({ _id: ObjectId(productId) }, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      console.log('Produkt slettet fra databasen');
      res.redirect('/add-products');
    }
  });
});

// Oppdaterer et produkt i databasen når brukeren sender en POST-forespørsel til URL-en /update-product/:id med produktets ID
// Krever at brukeren er logget inn
app.post('/update-product/:id', requireAuth, (req, res) => {
  const productId = req.body.productId;
  const { tittel, dato, modell, merke, pris, artikkelnummer } = req.body;
  productsCollection.updateOne(
    { _id: ObjectId(productId) },
    { $set: { tittel: tittel, dato: dato, modell: modell, merke: merke, pris: pris, artikkelnummer: artikkelnummer } },
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        console.log('Produkt oppdatert i databasen');
        res.redirect('/add-products');
      }
    }
  );
});

// Legger til et nytt produkt i databasen når brukeren sender en POST-forespørsel til URL-en /products
app.post('/products', (req, res) => {
  const { tittel, dato, modell, merke, pris, artikkelnummer } = req.body;
  const products = { tittel, dato, modell, merke, pris, artikkelnummer };
  productsCollection.insertOne(products, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      console.log('Produkt lagt til i databasen');
      res.redirect('/');
    }
  });
});

// Starter Express-appen og lytter på port 3000
app.listen(3000, () => console.log('Listening on port 3000'));
