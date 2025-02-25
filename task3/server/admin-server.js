const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 8080;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '..', 'admin')));

// Helper function to read products file
const readProducts = () => {
  return JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'products.json'), 'utf8'));
};

// Helper function to write products file
const writeProducts = (data) => {
  fs.writeFileSync(
    path.join(__dirname, 'data', 'products.json'),
    JSON.stringify(data, null, 2),
    'utf8'
  );
};

// Routes
app.get('/api/products', (req, res) => {
  try {
    const data = readProducts();
    res.json(data);
  } catch (error) {
    console.error('Error reading products:', error);
    res.status(500).json({ error: 'Failed to retrieve products' });
  }
});

// Add one or more products
app.post('/api/products', (req, res) => {
  try {
    const newProducts = Array.isArray(req.body) ? req.body : [req.body];
    const data = readProducts();
    
    // Find the highest existing ID
    const maxId = data.products.reduce((max, product) => Math.max(max, product.id), 0);
    
    // Add new products with incremented IDs
    newProducts.forEach((product, index) => {
      data.products.push({
        ...product,
        id: maxId + index + 1
      });
    });
    
    writeProducts(data);
    res.status(201).json({ message: 'Products added successfully', products: newProducts });
  } catch (error) {
    console.error('Error adding products:', error);
    res.status(500).json({ error: 'Failed to add products' });
  }
});

// Update product by ID
app.put('/api/products/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updatedProductData = req.body;
    const data = readProducts();
    
    const productIndex = data.products.findIndex(product => product.id === id);
    
    if (productIndex === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Update product while preserving the ID
    data.products[productIndex] = {
      ...updatedProductData,
      id
    };
    
    writeProducts(data);
    res.json({ message: 'Product updated successfully', product: data.products[productIndex] });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product by ID
app.delete('/api/products/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const data = readProducts();
    
    const productIndex = data.products.findIndex(product => product.id === id);
    
    if (productIndex === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Remove the product
    const deletedProduct = data.products[productIndex];
    data.products.splice(productIndex, 1);
    
    writeProducts(data);
    res.json({ message: 'Product deleted successfully', product: deletedProduct });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'admin', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Admin server running on http://localhost:${PORT}`);
});