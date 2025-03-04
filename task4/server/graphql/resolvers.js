const fs = require('fs');
const path = require('path');

const readProducts = () => {
  return JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'products.json'), 'utf8'));
};

const resolvers = {
  Query: {
    products: () => {
      try {
        const data = readProducts();
        return data.products;
      } catch (error) {
        console.error('Error reading products:', error);
        throw new Error('Failed to retrieve products');
      }
    },
    productsByCategory: (_, { category }) => {
      try {
        const data = readProducts();
        return data.products.filter(product => 
          product.categories.includes(category)
        );
      } catch (error) {
        console.error('Error reading products by category:', error);
        throw new Error('Failed to retrieve products by category');
      }
    },
    product: (_, { id }) => {
      try {
        const data = readProducts();
        return data.products.find(product => product.id === parseInt(id));
      } catch (error) {
        console.error('Error reading product:', error);
        throw new Error('Failed to retrieve product');
      }
    }
  }
};

module.exports = resolvers;