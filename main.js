const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const http = require('http');
const path = require('path');

function getContentType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  return {
    '.css': 'text/css',
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.svg': 'image/svg+xml'
  }[extension] || 'application/octet-stream';
}

function startLocalServer() {
  const applicationDirectory = __dirname;
  const server = http.createServer((request, response) => {
    const requestPath = request.url === '/' ? '/index.html' : request.url;
    const filePath = path.resolve(applicationDirectory, `.${decodeURIComponent(requestPath)}`);

    if (!filePath.startsWith(applicationDirectory)) {
      response.writeHead(403);
      response.end();
      return;
    }

    fs.readFile(filePath, (error, content) => {
      if (error) {
        response.writeHead(error.code === 'ENOENT' ? 404 : 500);
        response.end();
        return;
      }

      response.writeHead(200, { 'Content-Type': getContentType(filePath) });
      response.end(content);
    });
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(4173, '127.0.0.1', () => resolve(server));
  });
}

function createWindow(server) {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 960,
    minWidth: 1000,
    minHeight: 700,
    backgroundColor: '#f4f7fb',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: false,
      enableRemoteModule: false
    }
  });

  const { port } = server.address();
  mainWindow.loadURL(`http://127.0.0.1:${port}`);
}

app.whenReady().then(() => {
  startLocalServer().then((server) => {
    createWindow(server);

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow(server);
      }
    });

    app.on('window-all-closed', () => {
      server.close();
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });
  });
});
