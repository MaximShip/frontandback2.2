document.addEventListener('DOMContentLoaded', function() {
  const API_URL = 'http://localhost:8080/api/products';
  const SOCKET_URL = 'http://localhost:4000';
  
  const socket = io(SOCKET_URL);

  const productsTableBody = document.getElementById('products-table-body');
  const saveProductBtn = document.getElementById('save-product-btn');
  const updateProductBtn = document.getElementById('update-product-btn');
  const addProductForm = document.getElementById('add-product-form');
  const editProductForm = document.getElementById('edit-product-form');
  const chatBody = document.querySelector('.chat-body');
  const chatInput = document.getElementById('chat-input-field');
  const chatSendBtn = document.getElementById('chat-send-btn');
  const minimizeBtn = document.querySelector('.minimize-btn');
  const chatContainer = document.querySelector('.chat-container');
  const typingIndicator = document.querySelector('.typing-indicator');
  
  const userId = 'admin_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
  const userName = 'Администратор';
  
  let typingTimeout;

  async function fetchProducts() {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      return data.products;
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  }

  async function displayProducts() {
    const products = await fetchProducts();
    productsTableBody.innerHTML = '';
    
    products.forEach(product => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${product.id}</td>
        <td>${product.name}</td>
        <td>${product.price} ₽</td>
        <td>${product.description}</td>
        <td>${product.categories.join(', ')}</td>
        <td>
          <button class="btn btn-sm btn-primary edit-btn" data-id="${product.id}">
            Редактировать
          </button>
          <button class="btn btn-sm btn-danger delete-btn" data-id="${product.id}">
            Удалить
          </button>
        </td>
      `;
      productsTableBody.appendChild(row);
    });
    
    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', e => openEditModal(parseInt(e.target.dataset.id)));
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', e => deleteProduct(parseInt(e.target.dataset.id)));
    });
  }

  async function addProduct() {
    const name = document.getElementById('product-name').value.trim();
    const price = parseFloat(document.getElementById('product-price').value);
    const description = document.getElementById('product-description').value.trim();
    const categoriesStr = document.getElementById('product-categories').value.trim();
    const categories = categoriesStr.split(',').map(cat => cat.trim()).filter(cat => cat);
    
    if (!name || isNaN(price) || !description || categories.length === 0) {
      alert('Пожалуйста, заполните все поля корректно');
      return;
    }
    
    const newProduct = {
      name,
      price,
      description,
      categories
    };
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProduct),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        const modal = bootstrap.Modal.getInstance(document.getElementById('addProductModal'));
        modal.hide();
        
        addProductForm.reset();
        
        displayProducts();
      } else {
        alert(`Ошибка: ${data.error || 'Не удалось добавить товар'}`);
      }
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Произошла ошибка при добавлении товара');
    }
  }

  async function openEditModal(productId) {
    try {
      const products = await fetchProducts();
      const product = products.find(p => p.id === productId);
      
      if (!product) {
        alert('Товар не найден');
        return;
      }
      
      document.getElementById('edit-product-id').value = product.id;
      document.getElementById('edit-product-name').value = product.name;
      document.getElementById('edit-product-price').value = product.price;
      document.getElementById('edit-product-description').value = product.description;
      document.getElementById('edit-product-categories').value = product.categories.join(', ');
      
      const modal = new bootstrap.Modal(document.getElementById('editProductModal'));
      modal.show();
    } catch (error) {
      console.error('Error opening edit modal:', error);
      alert('Произошла ошибка при загрузке информации о товаре');
    }
  }

  async function updateProduct() {
    const id = parseInt(document.getElementById('edit-product-id').value);
    const name = document.getElementById('edit-product-name').value.trim();
    const price = parseFloat(document.getElementById('edit-product-price').value);
    const description = document.getElementById('edit-product-description').value.trim();
    const categoriesStr = document.getElementById('edit-product-categories').value.trim();
    const categories = categoriesStr.split(',').map(cat => cat.trim()).filter(cat => cat);
    
    if (!name || isNaN(price) || !description || categories.length === 0) {
      alert('Пожалуйста, заполните все поля корректно');
      return;
    }
    
    const updatedProduct = {
      name,
      price,
      description,
      categories
    };
    
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedProduct),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        const modal = bootstrap.Modal.getInstance(document.getElementById('editProductModal'));
        modal.hide();
        
        displayProducts();
      } else {
        alert(`Ошибка: ${data.error || 'Не удалось обновить товар'}`);
      }
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Произошла ошибка при обновлении товара');
    }
  }

  async function deleteProduct(productId) {
    if (!confirm('Вы уверены, что хотите удалить этот товар?')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/${productId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        displayProducts();
      } else {
        alert(`Ошибка: ${data.error || 'Не удалось удалить товар'}`);
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Произошла ошибка при удалении товара');
    }
  }

  saveProductBtn.addEventListener('click', addProduct);
  updateProductBtn.addEventListener('click', updateProduct);

  function addMessageToChat(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.sender === 'admin' ? 'admin-message' : 'user-message'}`;
    messageDiv.innerHTML = `
      <div><strong>${message.sender === 'admin' ? 'Администратор' : message.userName}</strong></div>
      <div>${message.text}</div>
      <div><small class="text-muted">${new Date(message.timestamp).toLocaleString()}</small></div>
    `;
    chatBody.appendChild(messageDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function sendMessage() {
    const messageText = chatInput.value.trim();
    if (messageText) {
      const message = {
        userId,
        userName,
        sender: 'admin',
        text: messageText
      };
      socket.emit('message', message);
      chatInput.value = '';
    }
  }

  chatSendBtn.addEventListener('click', sendMessage);
  
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    } else {
      socket.emit('typing', { userId, userName });
      
      clearTimeout(typingTimeout);
      
      typingTimeout = setTimeout(() => {
        socket.emit('typing', { userId, userName, isTyping: false });
      }, 3000);
    }
  });

  minimizeBtn.addEventListener('click', () => {
    chatContainer.classList.toggle('chat-minimized');
    chatBody.classList.toggle('chat-body-minimized');
    document.querySelector('.chat-input').classList.toggle('chat-input-minimized');
    document.querySelector('.typing-indicator').classList.toggle('chat-input-minimized');
    
    if (chatContainer.classList.contains('chat-minimized')) {
      minimizeBtn.textContent = '+';
    } else {
      minimizeBtn.textContent = '−';
    }
  });

  socket.on('connect', () => {
    console.log('Connected to WebSocket server');
  });

  socket.on('message', (message) => {
    addMessageToChat(message);
  });

  socket.on('chat-history', (messages) => {
    chatBody.innerHTML = '';
    messages.forEach(message => {
      addMessageToChat(message);
    });
  });

  socket.on('typing', (data) => {
    if (data.userId !== userId && data.isTyping !== false) {
      typingIndicator.textContent = `${data.userName} печатает...`;
    } else {
      typingIndicator.textContent = '';
    }
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from WebSocket server');
  });

  displayProducts();
});