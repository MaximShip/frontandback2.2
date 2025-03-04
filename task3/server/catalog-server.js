const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.static(path.join(__dirname, '..', 'client')));

// Routes
app.get('/api/products', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'products.json'), 'utf8'));
    res.json(data);
  } catch (error) {
    console.error('Error reading products:', error);
    res.status(500).json({ error: 'Failed to retrieve products' });
  }
});

app.get('/api/products/category/:category', (req, res) => {
  try {
    const category = req.params.category;
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'products.json'), 'utf8'));
    
    const filteredProducts = data.products.filter(product => 
      product.categories.includes(category)
    );
    
    res.json({ products: filteredProducts });
  } catch (error) {
    console.error('Error reading products by category:', error);
    res.status(500).json({ error: 'Failed to retrieve products' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Catalog server running on http://localhost:${PORT}`);
});