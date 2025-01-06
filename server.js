const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const logger = require('./logger');
const { createBackup } = require('./backup');
const { apiLimiter } = require('./rate-limiter');
const helmet = require('helmet');

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  logger.error('Error occurred:', { 
    error: err.message, 
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  
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

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.REACT_APP_API_URL],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Diğer güvenlik önlemleri
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

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
      logger.warn('Blocked CORS request:', { origin });
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
  logger.error('Error reading db.json:', { error: error.message });
  db = { products: [], hsCodes: [], packingLists: [] };
}

// DB'yi kaydetme fonksiyonu
async function saveDB() {
  try {
    await fs.promises.writeFile('./db.json', JSON.stringify(db, null, 2));
    await createBackup(); // Her değişiklikte yedek al
  } catch (error) {
    logger.error('Error saving database:', { error: error.message });
    throw error;
  }
}

// API routes
app.get('/api/products', async (req, res, next) => {
  try {
    const products = db.products;
    res.json(products);
  } catch (error) {
    next(error);
  }
});

app.post('/api/products', async (req, res, next) => {
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
    await saveDB();
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
});

app.get('/api/hsCodes', async (req, res, next) => {
  try {
    res.json(db.hsCodes);
  } catch (error) {
    next(error);
  }
});

app.post('/api/hsCodes', async (req, res, next) => {
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
    await saveDB();
    res.status(201).json(hsCode);
  } catch (error) {
    next(error);
  }
});

app.get('/api/packingLists', async (req, res, next) => {
  try {
    res.json(db.packingLists);
  } catch (error) {
    next(error);
  }
});

app.post('/api/packingLists', async (req, res, next) => {
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
    await saveDB();
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

// Request logging middleware
app.use((req, res, next) => {
  logger.info('Incoming request:', {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip
  });
  next();
});

// Error handler middleware'i en sonda kullan
app.use(errorHandler);

// Rate limiter'ı tüm API route'larına uygula
app.use('/api', apiLimiter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  app.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
}); 