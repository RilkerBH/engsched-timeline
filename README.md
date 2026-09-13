# EngSched Timeline

Aplicativo para criação e visualização de cronogramas de engenharia em formato de timeline (Gantt simplificado). Permite organizar pacotes de serviços, marcos (milestones) e exportar o cronograma como imagem.

## Tech Stack

- **Next.js 14** + **React 18** + **TypeScript**
- **Tailwind CSS** + **shadcn/ui**
- **Recharts** (gráficos)
- **dnd-kit** (drag and drop)
- **date-fns** (manipulação de datas)
- **html-to-image** (exportação como PNG)
- **Electron** (versão desktop)

## Como rodar

```bash
# Instalar dependências
npm install

# Modo web (desenvolvimento)
npm run dev
# Acesse http://localhost:3000

# Modo desktop (Electron)
npm run electron:dev
```

## Como buildar

```bash
# Windows
npm run electron:build

# macOS
npm run electron:build:mac
```

O instalador será gerado na pasta `dist/`.

## Estrutura do projeto

```
src/
├── app/            # Páginas e layout Next.js
├── components/     # Componentes do app + ui/ (shadcn)
├── hooks/          # Custom hooks (localStorage, toast)
├── lib/            # Utilitários, tipos e lógica de arquivos
└── ai/             # Integração AI (Genkit)
electron/           # Processo principal do Electron
public/             # Assets estáticos
```

## Funcionalidades

- Configuração de período do projeto (data início/fim)
- Pacotes de serviço com cores, datas e posicionamento customizável
- Marcos (milestones) na timeline
- Drag and drop para reordenar pacotes
- Zoom na timeline
- Exportação como imagem PNG
- Salvar/carregar projetos (arquivo `.engsched`)
- Funciona no navegador e como app desktop

## Versionamento

O projeto segue o [Versionamento Semântico](https://semver.org/lang/pt-BR/). O histórico fica em `CHANGELOG.md`.

Para publicar uma versão:

1. Atualize `"version"` no `package.json` e adicione a seção `## [X.Y.Z]` no `CHANGELOG.md`.
2. Faça o merge na `main`.
3. No GitHub, vá em **Actions > Release > Run workflow**, informe a versão (ex.: `1.1.0`) e execute.

O workflow cria a tag `vX.Y.Z` e a Release com as notas extraídas do `CHANGELOG.md`.
