const API_URL = 'http://localhost:3000/api';

async function register() {
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        if (response.ok) {
            showMessage(data.message, 'success');
        } else {
            showMessage(data.message, 'error');
        }
    } catch (error) {
        showMessage('Произошла ошибка при регистрации', 'error');
    }
}

async function login() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('token', data.token);
            showMessage('Успешный вход', 'success');
            showProtectedContent();
            getProtectedData();
        } else {
            showMessage(data.message, 'error');
        }
    } catch (error) {
        showMessage('Ошибка при авторизации', 'error');
    }
}

async function getProtectedData() {
    const token = localStorage.getItem('token');
    if (!token) {
        showMessage('Токен не найден', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/protected`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        if (response.ok) {
            document.getElementById('protectedData').textContent = 
                `Привет, ${data.user.username}! ${data.message}`;
        } else {
            showMessage(data.message, 'error');
            hideProtectedContent();
        }
    } catch (error) {
        showMessage('Ошибка при получении защищенной информации', 'error');
        hideProtectedContent();
    }
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    hideProtectedContent();
    showMessage('Успешный выход', 'success');
}

// UI helper functions
function showMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
    document.querySelector('.container').appendChild(messageDiv);
    setTimeout(() => messageDiv.remove(), 3000);
}

function showProtectedContent() {
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('protectedContent').style.display = 'block';
}

function hideProtectedContent() {
    document.getElementById('registerForm').style.display = 'block';
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('protectedContent').style.display = 'none';
}

if (localStorage.getItem('token')) {
    showProtectedContent();
    getProtectedData();
}