document.addEventListener('DOMContentLoaded', function() {
    const productsContainer = document.getElementById('products-container');
    const categorySelect = document.getElementById('category-select');
    const API_URL = 'http://localhost:3000/api';
    
    let allProducts = [];
    let categories = new Set();
    
    // Fetch all products
    async function fetchProducts() {
      try {
        const response = await fetch(`${API_URL}/products`);
        const data = await response.json();
        allProducts = data.products;
        
        // Extract all unique categories
        allProducts.forEach(product => {
          product.categories.forEach(category => {
            categories.add(category);
          });
        });
        
        // Populate category filter
        populateCategoryFilter();
        
        // Display all products
        displayProducts(allProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
        productsContainer.innerHTML = '<div class="error">Ошибка загрузки товаров</div>';
      }
    }
    
    // Display products in the container
    function displayProducts(products) {
      if (products.length === 0) {
        productsContainer.innerHTML = '<div class="no-products">Товары не найдены</div>';
        return;
      }
      
      productsContainer.innerHTML = '';
      
      products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        
        // Format price with spaces for thousands
        const formattedPrice = product.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
        
        productCard.innerHTML = `
          <div class="product-info">
            <h2 class="product-name">${product.name}</h2>
            <div class="product-price">${formattedPrice} ₽</div>
            <p class="product-description">${product.description}</p>
            <div class="product-categories">
              ${product.categories.map(category => `<span class="category-tag">${category}</span>`).join('')}
            </div>
          </div>
        `;
        
        productsContainer.appendChild(productCard);
      });
    }
    
    // Populate category filter
    function populateCategoryFilter() {
      categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
      });
      
      // Add event listener for category filter
      categorySelect.addEventListener('change', function() {
        const selectedCategory = this.value;
        
        if (selectedCategory === 'all') {
          displayProducts(allProducts);
        } else {
          const filteredProducts = allProducts.filter(product => 
            product.categories.includes(selectedCategory)
          );
          displayProducts(filteredProducts);
        }
      });
    }
    
    // Initialize
    fetchProducts();
  });