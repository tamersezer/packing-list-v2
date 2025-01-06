const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  
  // CORS hatası
  if (err.message.includes('CORS')) {
    return res.status(403).json({
      error: 'CORS policy violation',
      message: 'Origin not allowed'
    });
  }

  // Dosya işlemleri hatası
  if (err.code === 'ENOENT') {
    return res.status(500).json({
      error: 'File operation failed',
      message: 'Database file not found'
    });
  }

  // JSON parse hatası
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'Invalid JSON',
      message: 'Request body is not valid JSON'
    });
  }

  // Genel hata
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong' 
      : err.message
  });
};

const app = express();

// CORS ayarlarını güncelleyin
const allowedOrigins = [
  'http://localhost:3000',
  'https://packing-lists.netlify.app',
  'https://packing-list-production.up.railway.app'
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('Blocked origin:', origin); // Debug için
      callback(new Error('CORS policy violation'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
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
app.get('/products', async (req, res, next) => {
  try {
    const products = db.products;
    res.json(products);
  } catch (error) {
    next(error);
  }
});

app.post('/products', async (req, res, next) => {
  try {
    const product = { ...req.body, id: Date.now().toString() };
    
    // Validation
    if (!product.name || !product.hsCode) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Name and HS Code are required'
      });
    }

    db.products.push(product);
    await fs.promises.writeFile('./db.json', JSON.stringify(db, null, 2));
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
});

app.get('/hsCodes', async (req, res, next) => {
  try {
    res.json(db.hsCodes);
  } catch (error) {
    next(error);
  }
});

app.post('/hsCodes', async (req, res, next) => {
  try {
    const hsCode = { ...req.body, id: Date.now().toString() };
    
    // Validation
    if (!hsCode.code) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'HS Code is required'
      });
    }

    // Duplicate check
    if (db.hsCodes.some(code => code.code === hsCode.code)) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'HS Code already exists'
      });
    }

    db.hsCodes.push(hsCode);
    await fs.promises.writeFile('./db.json', JSON.stringify(db, null, 2));
    res.status(201).json(hsCode);
  } catch (error) {
    next(error);
  }
});

app.get('/packingLists', async (req, res, next) => {
  try {
    res.json(db.packingLists);
  } catch (error) {
    next(error);
  }
});

app.post('/packingLists', async (req, res, next) => {
  try {
    const packingList = { 
      ...req.body, 
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Validation
    if (!packingList.name) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Packing list name is required'
      });
    }

    if (!Array.isArray(packingList.items)) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Items must be an array'
      });
    }

    db.packingLists.push(packingList);
    await fs.promises.writeFile('./db.json', JSON.stringify(db, null, 2));
    res.status(201).json(packingList);
  } catch (error) {
    next(error);
  }
});

// Diğer CRUD operasyonları...

// React router için catch-all route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Error handler middleware'i en sonda kullan
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  app.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
}); 