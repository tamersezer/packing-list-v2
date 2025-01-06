const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const logger = require('./logger');
const { createBackup } = require('./backup');
const { apiLimiter } = require('./rate-limiter');
const helmet = require('helmet');
const compression = require('compression');
const { paginate } = require('./utils/pagination');

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

// Compression middleware
app.use(compression());

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

app.use(express.json({ limit: '10kb' }));

// Static dosyaları serve et
app.use(express.static(path.join(__dirname, 'build')));

// Response caching
app.use((req, res, next) => {
  // Static dosyalar için cache
  if (req.url.startsWith('/static/')) {
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 yıl
  } 
  // API responses için cache
  else if (req.url.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'private, max-age=300'); // 5 dakika
  }
  next();
});

// Request timeout
app.use((req, res, next) => {
  req.setTimeout(5000, () => {
    res.status(408).json({ 
      error: 'Request Timeout',
      message: 'Request took too long to process'
    });
  });
  next();
});

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
    await createBackup();
    // İlgili cache'leri temizle
    cache.delete('products');
    cache.delete('hsCodes');
    cache.delete('packingLists');
  } catch (error) {
    logger.error('Error saving database:', { error: error.message });
    throw error;
  }
}

// API routes için memory cache
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 dakika

function withCache(key, getData) {
  return async (req, res, next) => {
    try {
      const cacheKey = `${key}-${JSON.stringify(req.query)}`;
      const cached = cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return res.json(cached.data);
      }
      
      const data = await getData(req);
      cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      res.json(data);
    } catch (error) {
      next(error);
    }
  };
}

// Cache'li route'lar
app.get('/api/products', withCache('products', async (req) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  return paginate(db.products, page, limit);
}));

app.get('/api/hsCodes', withCache('hsCodes', async () => {
  return db.hsCodes;
}));

app.get('/api/packingLists', withCache('packingLists', async (req) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  return paginate(db.packingLists, page, limit);
}));

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

// Batch işlemleri için yeni endpoint'ler
app.post('/api/products/batch', async (req, res, next) => {
  try {
    const { products } = req.body;
    
    if (!Array.isArray(products)) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Products must be an array'
      });
    }
    
    // Validation
    const invalidProducts = products.filter(p => !p.name || !p.hsCode);
    if (invalidProducts.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'All products must have name and HS Code',
        invalidProducts
      });
    }
    
    // Add IDs and save
    const newProducts = products.map(product => ({
      ...product,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    }));
    
    db.products.push(...newProducts);
    await saveDB();
    
    // Clear cache
    cache.delete('products');
    
    res.status(201).json(newProducts);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/products/batch', async (req, res, next) => {
  try {
    const { ids } = req.body;
    
    if (!Array.isArray(ids)) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'IDs must be an array'
      });
    }
    
    const initialLength = db.products.length;
    db.products = db.products.filter(p => !ids.includes(p.id));
    
    if (db.products.length === initialLength) {
      return res.status(404).json({
        error: 'Not found',
        message: 'No products found with the provided IDs'
      });
    }
    
    await saveDB();
    
    // Clear cache
    cache.delete('products');
    
    res.json({ 
      message: 'Products deleted successfully',
      deletedCount: initialLength - db.products.length
    });
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