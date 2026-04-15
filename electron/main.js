const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');

let server;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
};

function startServer(staticDir) {
  return new Promise((resolve) => {
    server = http.createServer((req, res) => {
      let urlPath = req.url.split('?')[0];
      if (urlPath === '/') urlPath = '/index.html';

      const filePath = path.join(staticDir, urlPath);

      try {
        // fs.readFileSync works with asar archives in Electron
        const content = fs.readFileSync(filePath);
        const ext = path.extname(filePath).toLowerCase();
        const mime = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': mime });
        res.end(content);
      } catch (err) {
        // Try with .html extension
        try {
          const htmlPath = filePath + '.html';
          const content = fs.readFileSync(htmlPath);
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(content);
        } catch (err2) {
          res.writeHead(404);
          res.end('Not found');
        }
      }
    });

    server.listen(0, '127.0.0.1', () => {
      resolve(server.address().port);
    });
  });
}

// ----- IPC Handlers para Salvar/Abrir Projeto -----

ipcMain.handle('save-project', async (event, jsonData, defaultFileName) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const result = await dialog.showSaveDialog(win, {
    title: 'Salvar Projeto',
    defaultPath: defaultFileName || 'projeto.engsched',
    filters: [
      { name: 'Projeto EngSched', extensions: ['engsched'] },
      { name: 'Todos os Arquivos', extensions: ['*'] },
    ],
  });

  if (result.canceled || !result.filePath) return false;

  try {
    fs.writeFileSync(result.filePath, jsonData, 'utf-8');
    return true;
  } catch {
    return false;
  }
});

ipcMain.handle('load-project', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const result = await dialog.showOpenDialog(win, {
    title: 'Abrir Projeto',
    filters: [
      { name: 'Projeto EngSched', extensions: ['engsched', 'json'] },
      { name: 'Todos os Arquivos', extensions: ['*'] },
    ],
    properties: ['openFile'],
  });

  if (result.canceled || result.filePaths.length === 0) return null;

  try {
    const content = fs.readFileSync(result.filePaths[0], 'utf-8');
    return content;
  } catch {
    return null;
  }
});

// ----- Criação da Janela -----

async function createWindow() {
  const outDir = path.join(__dirname, '..', 'out');
  const port = await startServer(outDir);

  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    title: 'EngSched Timeline',
    icon: path.join(__dirname, '..', 'public', 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  win.setMenuBarVisibility(false);
  win.loadURL(`http://127.0.0.1:${port}`);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (server) server.close();
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
