const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');

const app = express();
const PORT = 3000;
const SECRET_KEY = 'secretkey';

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const users = [];

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Необходим токен' });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Токен не правильный' });
    }
    req.user = user;
    next();
  });
};

app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (users.find(u => u.username === username)) {
      return res.status(400).json({ message: 'Имя пользователя занято' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = {
      id: users.length + 1,
      username,
      password: hashedPassword
    };
    users.push(user);

    res.status(201).json({ message: 'Успешно зарегистрировано' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при регистрации' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = users.find(u => u.username === username);
    if (!user) {
      return res.status(400).json({ message: 'Имя пользователя не найдено' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Неправильный пароль' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY);
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при авторизации' });
  }
});

app.get('/api/protected', authenticateToken, (req, res) => {
  res.json({ message: 'Защищенная информация', user: req.user });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});