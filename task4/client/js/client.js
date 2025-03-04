document.addEventListener('DOMContentLoaded', function() {
  const GRAPHQL_URL = 'http://localhost:3000/graphql';
  const SOCKET_URL = 'http://localhost:4000';
  
  const socket = io(SOCKET_URL);

  const productsContainer = document.getElementById('products-container');
  const categoriesFilter = document.getElementById('categories-filter');
  const viewSelector = document.getElementById('product-view-selector');
  const chatBody = document.querySelector('.chat-body');
  const chatInput = document.getElementById('chat-input-field');
  const chatSendBtn = document.getElementById('chat-send-btn');
  const minimizeBtn = document.querySelector('.minimize-btn');
  const chatContainer = document.querySelector('.chat-container');
  const typingIndicator = document.querySelector('.typing-indicator');
  
  const userId = 'user_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
  const userName = 'Пользователь ' + Math.floor(Math.random() * 1000);
  
  let allProducts = [];
  let activeCategory = 'all';
  let typingTimeout;

  viewSelector.addEventListener('change', () => renderProducts());
  
  const FULL_QUERY = `
    query GetProducts {
      products {
        id
        name
        price
        description
        categories
      }
    }
  `;

  const NAME_PRICE_QUERY = `
    query GetProductsNamePrice {
      products {
        id
        name
        price
      }
    }
  `;

  const NAME_DESCRIPTION_QUERY = `
    query GetProductsNameDescription {
      products {
        id
        name
        description
      }
    }
  `;

  const CATEGORY_QUERY = `
    query GetProductsByCategory($category: String!) {
      productsByCategory(category: $category) {
        id
        name
        price
        description
        categories
      }
    }
  `;

  async function executeGraphQLQuery(query, variables = {}) {
    try {
      const response = await fetch(GRAPHQL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables
        }),
      });

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error executing GraphQL query:', error);
      return null;
    }
  }

  async function fetchCategoriesAndProducts() {
    try {
      const data = await executeGraphQLQuery(FULL_QUERY);
      
      if (data && data.products) {
        allProducts = data.products;
        
        const categories = new Set();
        allProducts.forEach(product => {
          product.categories.forEach(category => categories.add(category));
        });
        
        categories.forEach(category => {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'btn btn-outline-primary';
          button.setAttribute('data-category', category);
          button.textContent = category;
          button.addEventListener('click', (e) => filterByCategory(e, category));
          categoriesFilter.appendChild(button);
        });
        
        renderProducts();
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }

  async function filterByCategory(e, category) {
    document.querySelectorAll('#categories-filter button').forEach(btn => {
      btn.classList.remove('active');
    });
    e.target.classList.add('active');
    
    activeCategory = category;
    
    if (category !== 'all') {
      const data = await executeGraphQLQuery(CATEGORY_QUERY, { category });
      if (data && data.productsByCategory) {
        allProducts = data.productsByCategory;
      }
    } else {
      const data = await executeGraphQLQuery(FULL_QUERY);
      if (data && data.products) {
        allProducts = data.products;
      }
    }
    
    renderProducts();
  }

  function renderProducts() {
    productsContainer.innerHTML = '';
    
    const viewMode = viewSelector.value;
    
    allProducts.forEach(product => {
      const col = document.createElement('div');
      col.className = 'col-md-4 mb-4';
      
      let cardContent = `
        <div class="card product-card">
          <div class="card-body">
            <h5 class="card-title">${product.name}</h5>
      `;
      
      if (viewMode === 'full' || viewMode === 'name-price') {
        if (product.price !== undefined) {
          cardContent += `<p class="card-text"><strong>Цена:</strong> ${product.price} ₽</p>`;
        }
      }
      
      if (viewMode === 'full' || viewMode === 'name-description') {
        if (product.description !== undefined) {
          cardContent += `<p class="card-text">${product.description}</p>`;
        }
      }
      
      if (viewMode === 'full') {
        if (product.categories !== undefined) {
          cardContent += `
            <p class="card-text">
              <small class="text-muted">Категории: ${product.categories.join(', ')}</small>
            </p>
          `;
        }
      }
      
      cardContent += `
          </div>
        </div>
      `;
      
      col.innerHTML = cardContent;
      productsContainer.appendChild(col);
    });
  }

  fetchCategoriesAndProducts();

  function addMessageToChat(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.sender === 'admin' ? 'admin-message' : 'user-message'}`;
    messageDiv.innerHTML = `
      <div><strong>${message.sender === 'admin' ? 'Поддержка' : message.userName}</strong></div>
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
        sender: 'user',
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
      socket.emit('typing', { userId, userName, isTyping: true });
      
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
});