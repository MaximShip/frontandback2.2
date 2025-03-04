const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { ApolloServer } = require('apollo-server-express');
const typeDefs = require('./graphql/schema');
const resolvers = require('./graphql/resolvers');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.static(path.join(__dirname, '..', 'client')));

// REST API Routes (сохраняем для совместимости)
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

// Настройка Apollo Server (GraphQL)
async function startApolloServer() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  await server.start();
  server.applyMiddleware({ app, path: '/graphql' });
  
  // Start server
  app.listen(PORT, () => {
    console.log(`Catalog server running on http://localhost:${PORT}`);
    console.log(`GraphQL server available at http://localhost:${PORT}${server.graphqlPath}`);
  });
}

startApolloServer().catch(err => {
  console.error('Failed to start Apollo Server:', err);
});