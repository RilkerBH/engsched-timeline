---
name: web-to-exe
description: |
  Transforma projetos web (Next.js, React, Vue, HTML estático) em executáveis Windows (.exe) usando Electron. Use esta skill sempre que o usuário quiser: empacotar um app web como programa desktop, criar um .exe a partir de um projeto web, rodar um site como aplicativo Windows standalone, distribuir um app web sem precisar de Node.js/navegador no destino. Também se aplica quando o usuário menciona "executável", "desktop app", "empacotar para Windows", ou quer levar um projeto web para um PC sem ambiente de desenvolvimento.
---

# Web to Windows Executable

Converte projetos web em aplicativos Windows executáveis usando Electron + electron-builder. O resultado é uma pasta com um `.exe` que roda standalone — sem precisar de Node.js, npm ou navegador no PC de destino.

## Visão Geral do Processo

```
Projeto Web → Build Estático (HTML/CSS/JS) → Electron Wrapper → electron-builder → .exe Windows
```

O fluxo tem 4 etapas:
1. Preparar o projeto para export estático
2. Criar o wrapper Electron com servidor HTTP local
3. Configurar electron-builder
4. Gerar o build para Windows

---

## Etapa 1: Preparar o Projeto para Export Estático

O Electron vai servir arquivos HTML estáticos. O projeto precisa gerar uma pasta `out/` com todo o HTML/CSS/JS.

### Next.js

Configurar `next.config.mjs`:

```js
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
};
export default nextConfig;
```

Depois: `npx next build` gera a pasta `out/`.

### React (Create React App / Vite)

Já gera estático por padrão com `npm run build` (pasta `build/` ou `dist/`). Ajuste o caminho na Etapa 2 conforme necessário.

### Vue

`npm run build` gera `dist/`. Mesmo princípio.

### HTML puro

Já está pronto — basta apontar o Electron para a pasta com o `index.html`.

---

## Etapa 2: Criar o Wrapper Electron

Criar `electron/main.js`. Este é o ponto crítico — usar **servidor HTTP local**, não `file://` nem protocolo customizado.

### Por que servidor HTTP local?

Três abordagens foram testadas e falharam:

- **`win.loadFile('out/index.html')`** — O protocolo `file://` não resolve caminhos relativos como `/_next/static/...`. Resultado: tela branca.
- **Protocolo customizado (`app://`)** — Não é considerado "contexto seguro" pelo Chromium. APIs como `crypto.randomUUID()`, `navigator.clipboard`, e Geolocation quebram. Resultado: "Application error: client-side exception".
- **Servidor HTTP local (`http://127.0.0.1`)** — Funciona corretamente. Resolve todos os caminhos, é contexto seguro, e `fs.readFileSync` do Electron lê arquivos dentro de `.asar` automaticamente.

### Código do main.js

```js
const { app, BrowserWindow } = require('electron');
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
        const content = fs.readFileSync(filePath);
        const ext = path.extname(filePath).toLowerCase();
        const mime = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': mime });
        res.end(content);
      } catch (err) {
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

async function createWindow() {
  // IMPORTANTE: Ajuste 'out' para o nome da pasta de build do seu framework
  const outDir = path.join(__dirname, '..', 'out');
  const port = await startServer(outDir);

  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    title: 'App Name',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
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
```

A porta `0` faz o OS escolher uma porta disponível — evita conflitos.

---

## Etapa 3: Configurar electron-builder

### package.json — campos obrigatórios

Adicionar ao `package.json` existente:

```json
{
  "main": "electron/main.js",
  "scripts": {
    "electron:build": "npm run build && npx electron-builder --win --x64"
  },
  "build": {
    "appId": "com.app.name",
    "productName": "App Name",
    "directories": { "output": "dist" },
    "files": [
      "electron/**/*",
      "out/**/*"
    ],
    "win": {
      "target": "dir",
      "icon": "public/icon.png"
    }
  }
}
```

### devDependencies

```json
{
  "devDependencies": {
    "electron": "^33.0.0",
    "electron-builder": "^25.1.8"
  }
}
```

### Decisões críticas sobre o target

| Target | Requer Wine no Mac? | Resultado |
|--------|---------------------|-----------|
| `dir` | Não | Pasta com .exe + DLLs (zipar para distribuir) |
| `portable` | Sim | .exe único portável |
| `nsis` | Sim | Instalador .exe |

**Usar `dir`** quando o build é feito no Mac. O usuário zipa a pasta `win-unpacked/` e leva para o PC Windows.

Para o zip sair pronto e com a versão no nome, adicione o target `zip` (não exige Wine) e um `artifactName`:

```json
"win": {
  "target": ["dir", "zip"],
  "artifactName": "${productName}-v${version}-win-x64.${ext}",
  "icon": "public/icon.png"
}
```

Gera `dist/App-Name-v1.2.3-win-x64.zip` ao lado de `win-unpacked/`.

Se o build for feito no próprio Windows, `nsis` ou `portable` funcionam normalmente.

### Flag de arquitetura

Sempre especificar `--x64` ao buildar no Mac (especialmente Apple Silicon), caso contrário o electron-builder gera ARM64 que não roda em PCs Windows x86/x64 comuns.

```bash
npx electron-builder --win --x64
```

O erro "Este aplicativo não pode ser executado em seu PC" geralmente indica arquitetura errada (ARM64 em PC x64).

---

## Etapa 4: Gerar o Build

```bash
# 1. Instalar dependências
npm install

# 2. Build estático + empacotamento
npm run build
npx electron-builder --win --x64

# 3. Resultado estará em dist/win-unpacked/
# Zipar essa pasta e transferir para o PC Windows
```

No PC de destino: descompactar e executar `App Name.exe`. Não precisa instalar nada.

---

## Problemas Comuns e Soluções

### Tela branca ao abrir o .exe

**Causa**: Electron não encontra os arquivos HTML ou está usando `file://`.
**Solução**: Verificar que `main.js` usa servidor HTTP local e que a pasta `out/` está listada em `"files"` no package.json.

### "Application error: client-side exception"

**Causa**: Código usa APIs que requerem contexto seguro (`crypto.randomUUID()`, `navigator.clipboard`).
**Solução**: Usar `http://127.0.0.1` (é contexto seguro) em vez de protocolo `file://` ou customizado.

### "Este aplicativo não pode ser executado em seu PC"

**Causa**: Build gerado para arquitetura errada (ARM64 para PC x64 ou vice-versa).
**Solução**: Usar flag `--x64` explicitamente: `npx electron-builder --win --x64`.

### Exportação de imagem (html2canvas) sai quebrada

**Causa**: `html2canvas` não renderiza corretamente CSS moderno (flexbox, gradientes, posições absolutas, transforms).
**Solução**: Substituir por `html-to-image`:

```bash
npm install html-to-image
npm uninstall html2canvas
```

```js
// Antes (html2canvas)
import html2canvas from "html2canvas"
html2canvas(element, { scale: 2, backgroundColor: '#FFFFFF' }).then((canvas) => {
  link.href = canvas.toDataURL("image/png");
});

// Depois (html-to-image)
import { toPng } from "html-to-image"
toPng(element, { pixelRatio: 2, backgroundColor: '#FFFFFF' }).then((dataUrl) => {
  link.href = dataUrl;
});
```

### Pacote enorme (centenas de MB) e build lento

**Causa**: o electron-builder inclui automaticamente todas as `dependencies` do `package.json` dentro do `app.asar`. Num projeto Next.js isso arrasta `next`, `react`, e tudo mais — quase 20 mil arquivos que o Electron nunca usa, porque o app roda a partir do export estático em `out/`.
**Solução**: excluir `node_modules` explicitamente em `build.files`. O `main.js` só usa módulos nativos do Node (`http`, `fs`, `path`) e o `electron`.

```json
"files": [
  "electron/**/*",
  "out/**/*",
  "package.json",
  "!node_modules/**/*"
]
```

Resultado medido no EngSched Timeline: `win-unpacked/` caiu de 699 MB para 270 MB, e o `app.asar` de 156 MB para 1,2 MB (35 arquivos). Os ~270 MB restantes são o próprio Electron (Chromium), que não dá para reduzir. Zipado, fica em torno de 110 MB.

### "wine is required" ao buildar no Linux (CI, containers)

**Causa**: no Linux o electron-builder precisa do Wine para editar o ícone e os metadados do `.exe` (`rcedit`), mesmo com target `dir`.
**Solução**: buildar num runner Windows (GitHub Actions `windows-latest`), que gera `dir` e `portable` sem Wine e sem Mac. Para apenas validar o empacotamento no Linux, desligue a edição do executável (o `.exe` fica com o ícone padrão do Electron):

```bash
npx electron-builder --win --x64 --config.win.signAndEditExecutable=false
```

### Build NSIS falha no Mac

**Causa**: NSIS requer Wine para gerar instaladores .exe no Mac.
**Solução**: Usar target `dir` em vez de `nsis` ou `portable`.

### Dependências faltantes em projetos shadcn/ui

Projetos gerados com shadcn/ui frequentemente dependem de pacotes não explícitos no package.json. Verificar se estão presentes:

```bash
npm install tailwindcss-animate react-day-picker@8 embla-carousel-react
```

Atenção: `react-day-picker` v9 tem API diferente da v8. Componentes shadcn/ui usam v8.

---

## Checklist Rápido

- [ ] `next.config.mjs` tem `output: 'export'`
- [ ] `electron/main.js` usa servidor HTTP local (porta 0, 127.0.0.1)
- [ ] `package.json` tem `"main": "electron/main.js"`
- [ ] `package.json` > `build.files` inclui `"out/**/*"`, `"electron/**/*"` e exclui `"!node_modules/**/*"`
- [ ] `package.json` > `build.win.target` é `"dir"` (se buildando no Mac)
- [ ] `electron` e `electron-builder` estão em devDependencies
- [ ] Build usa flag `--x64` explicitamente
- [ ] Todas as dependências do projeto estão no package.json
- [ ] TypeScript compila sem erros (`npx tsc --noEmit`)
