document.addEventListener('DOMContentLoaded', function() {
    const productsContainer = document.getElementById('products-container');
    const addProductForm = document.getElementById('add-product-form');
    const editProductForm = document.getElementById('edit-product-form');
    const deleteProductForm = document.getElementById('delete-product-form');
    const loadProductBtn = document.getElementById('load-product-btn');
    const refreshProductsBtn = document.getElementById('refresh-products');
    
    const API_URL = 'http://localhost:8080/api';
    
    // Fetch all products
    async function fetchProducts() {
      try {
        productsContainer.innerHTML = '<div class="loading">Загрузка товаров...</div>';
        
        const response = await fetch(`${API_URL}/products`);
        const data = await response.json();
        
        displayProducts(data.products);
      } catch (error) {
        console.error('Error fetching products:', error);
        productsContainer.innerHTML = '<div class="error">Ошибка загрузки товаров</div>';
      }
    }
    
    // Display products in the container
    function displayProducts(products) {
      if (!products || products.length === 0) {
        productsContainer.innerHTML = '<div class="no-products">Товары не найдены</div>';
        return;
      }
      
      productsContainer.innerHTML = '';
      
      products.forEach(product => {
        const productElement = document.createElement('div');
        productElement.className = 'product-item';
        
        // Format price with spaces for thousands
        const formattedPrice = product.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
        
        productElement.innerHTML = `
          <div class="product-header">
            <div class="product-id">ID: ${product.id}</div>
            <div class="product-price">${formattedPrice} ₽</div>
          </div>
          <h3>${product.name}</h3>
          <p>${product.description}</p>
          <div class="product-categories">
            ${product.categories.map(category => `<span class="category-tag">${category}</span>`).join('')}
          </div>
        `;
        
        productsContainer.appendChild(productElement);
      });
    }
    
    // Add product form submission
    addProductForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const newProduct = {
        name: document.getElementById('product-name').value,
        price: parseInt(document.getElementById('product-price').value),
        description: document.getElementById('product-description').value,
        categories: document.getElementById('product-categories').value.split(',').map(cat => cat.trim())
      };
      
      try {
        const response = await fetch(`${API_URL}/products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(newProduct)
        });
        
        if (!response.ok) {
          throw new Error('Failed to add product');
        }
        
        const result = await response.json();
        alert('Товар успешно добавлен!');
        
        // Reset form
        addProductForm.reset();
        
        // Refresh products list
        fetchProducts();
      } catch (error) {
        console.error('Error adding product:', error);
        alert('Ошибка при добавлении товара');
      }
    });
    
    // Load product data for editing
    loadProductBtn.addEventListener('click', async function() {
      const productId = document.getElementById('edit-product-id').value;
      
      if (!productId) {
        alert('Введите ID товара');
        return;
      }
      
      try {
        const response = await fetch(`${API_URL}/products`);
        const data = await response.json();
        
        const product = data.products.find(p => p.id === parseInt(productId));
        
        if (!product) {
          alert('Товар с указанным ID не найден');
          return;
        }
        
        // Fill form with product data
        document.getElementById('edit-product-name').value = product.name;
        document.getElementById('edit-product-price').value = product.price;
        document.getElementById('edit-product-description').value = product.description;
        document.getElementById('edit-product-categories').value = product.categories.join(', ');
      } catch (error) {
        console.error('Error loading product:', error);
        alert('Ошибка при загрузке данных товара');
      }
    });
    
    // Edit product form submission
    editProductForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const productId = document.getElementById('edit-product-id').value;
      
      if (!productId) {
        alert('Введите ID товара');
        return;
      }
      
      const updatedProduct = {
        name: document.getElementById('edit-product-name').value,
        price: parseInt(document.getElementById('edit-product-price').value),
        description: document.getElementById('edit-product-description').value,
        categories: document.getElementById('edit-product-categories').value.split(',').map(cat => cat.trim())
      };
      
      try {
        const response = await fetch(`${API_URL}/products/${productId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updatedProduct)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update product');
        }
        
        const result = await response.json();
        alert('Товар успешно обновлен!');
        
        // Refresh products list
        fetchProducts();
      } catch (error) {
        console.error('Error updating product:', error);
        alert('Ошибка при обновлении товара');
      }
    });
    
    // Delete product form submission
    deleteProductForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const productId = document.getElementById('delete-product-id').value;
      
      if (!productId) {
        alert('Введите ID товара');
        return;
      }
      
      if (!confirm('Вы уверены, что хотите удалить этот товар?')) {
        return;
      }
      
      try {
        const response = await fetch(`${API_URL}/products/${productId}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete product');
        }
        
        const result = await response.json();
        alert('Товар успешно удален!');
        
        // Reset form
        deleteProductForm.reset();
        
        // Refresh products list
        fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Ошибка при удалении товара');
      }
    });
    
    // Refresh products button
    refreshProductsBtn.addEventListener('click', function() {
      fetchProducts();
    });
    
    // Initialize
    fetchProducts();
  });