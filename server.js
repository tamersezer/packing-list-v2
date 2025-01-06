const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

// CORS ayarlarını güncelleyin
const allowedOrigins = [
  'http://localhost:3000',
  'https://packing-lists.netlify.app' // Netlify'dan aldığınız domain
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy violation'));
    }
  },
  credentials: true
}));

app.use(express.json());

// Static dosyaları serve et
app.use(express.static(path.join(__dirname, 'build')));

// DB'yi oku
let db = {};
try {
  db = JSON.parse(fs.readFileSync('./db.json', 'utf8'));
} catch (error) {
  console.error('Error reading db.json:', error);
  db = { products: [], hsCodes: [], packingLists: [] };
}

// API routes
app.get('/products', (req, res) => {
  res.json(db.products);
});

app.post('/products', (req, res) => {
  const product = { ...req.body, id: Date.now().toString() };
  db.products.push(product);
  fs.writeFileSync('./db.json', JSON.stringify(db, null, 2));
  res.json(product);
});

app.get('/hsCodes', (req, res) => {
  res.json(db.hsCodes);
});

app.post('/hsCodes', (req, res) => {
  const hsCode = { ...req.body, id: Date.now().toString() };
  db.hsCodes.push(hsCode);
  fs.writeFileSync('./db.json', JSON.stringify(db, null, 2));
  res.json(hsCode);
});

app.get('/packingLists', (req, res) => {
  res.json(db.packingLists);
});

app.post('/packingLists', (req, res) => {
  const packingList = { ...req.body, id: Date.now().toString() };
  db.packingLists.push(packingList);
  fs.writeFileSync('./db.json', JSON.stringify(db, null, 2));
  res.json(packingList);
});

// Diğer CRUD operasyonları...

// React router için catch-all route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 