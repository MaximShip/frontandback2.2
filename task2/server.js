const http = require('http');
const fs = require('fs');
const path = require('path');

// Указываем путь к папке с нашими статическими файлами
const publicDirectory = path.join(__dirname, 'public');

const server = http.createServer((req, res) => {
  // Формируем полный путь к запрашиваемому файлу
  let filePath = path.join(publicDirectory, req.url === '/' ? 'index.html' : req.url);

  // Определяем Content-Type по расширению
  const extname = String(path.extname(filePath)).toLowerCase();
  let contentType = 'text/html';

  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.svg': 'application/image/svg+xml'
  };

  if (mimeTypes[extname]) {
    contentType = mimeTypes[extname];
  }

  // Читаем файл и отправляем в ответ
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        // Если файл не найден, отправляем 404.html
        fs.readFile(path.join(publicDirectory, '404.html'), (err404, content404) => {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end(content404, 'utf-8');
        });
      } else {
        // Прочие ошибки
        res.writeHead(500);
        res.end(`Ошибка сервера: ${error.code}`);
      }
    } else {
      // Успешно найден файл
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
