const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:8080"],
    methods: ["GET", "POST"]
  }
});

const PORT = 4000;

// Middleware
app.use(cors());

// Проверка и создание файла истории чата
const CHAT_HISTORY_FILE = path.join(__dirname, 'data', 'chat-history.json');

// Инициализация истории сообщений
if (!fs.existsSync(CHAT_HISTORY_FILE)) {
  fs.writeFileSync(CHAT_HISTORY_FILE, JSON.stringify({ messages: [] }), 'utf8');
}

// Чтение и запись истории сообщений
const readChatHistory = () => {
  try {
    return JSON.parse(fs.readFileSync(CHAT_HISTORY_FILE, 'utf8')).messages;
  } catch (error) {
    console.error('Error reading chat history:', error);
    return [];
  }
};

const writeChatHistory = (messages) => {
  try {
    fs.writeFileSync(CHAT_HISTORY_FILE, JSON.stringify({ messages }, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing chat history:', error);
  }
};

// Обработка подключений WebSocket
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // Отправляем историю сообщений при подключении
  const chatHistory = readChatHistory();
  socket.emit('chat-history', chatHistory);

  // Обработчик нового сообщения
  socket.on('message', (data) => {
    console.log('Message received:', data);
    
    const messageWithTimestamp = {
      ...data,
      timestamp: new Date().toISOString()
    };
    
    // Сохраняем сообщение в истории
    const chatHistory = readChatHistory();
    chatHistory.push(messageWithTimestamp);
    
    // Ограничиваем историю последними 100 сообщениями
    if (chatHistory.length > 100) {
      chatHistory.shift();
    }
    
    writeChatHistory(chatHistory);
    
    // Отправляем сообщение всем клиентам
    io.emit('message', messageWithTimestamp);
  });

  // Уведомление о печатании
  socket.on('typing', (data) => {
    socket.broadcast.emit('typing', data);
  });

  // Обработка отключения
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Запуск сервера
server.listen(PORT, () => {
  console.log(`WebSocket server running on http://localhost:${PORT}`);
});