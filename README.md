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

## Testes

```bash
npm test
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
├── domain/          # Tipos e funções puras (layout, cores, operações em bloco, validação, formato .engsched)
├── application/     # Estado do projeto (reducer), autosave e hook useProject
├── infrastructure/  # Adapters de I/O (salvar/abrir arquivo no navegador e no Electron)
├── components/      # Componentes React do app + ui/ (shadcn)
├── hooks/           # Hooks de UI (seleção múltipla, toast)
├── lib/             # Utilitário `cn` do shadcn
└── app/             # Páginas e layout Next.js
electron/            # Processo principal do Electron
public/              # Assets estáticos
```

## Funcionalidades

- Configuração de período do projeto (data início/fim)
- Tarefas (pacotes de serviço) com cores, datas e posicionamento customizável
- Marcos (milestones) na timeline
- Seletor de cores estilo Excel (cores do tema, cores padrão e código hexadecimal)
- Seleção múltipla de tarefas e marcos (clique, Ctrl+clique, Shift+clique) com edição em bloco: cor, formato de data, mover como bloco, deslocar datas, excluir
- Rótulos de nome e data em posição padrão alinhada, com ajuste fino por arrastar e opção de redefinir
- Drag and drop para reordenar tarefas
- Exportação como imagem PNG
- Salvar/carregar projetos (arquivo `.engsched`), inclusive a partir da tela inicial
- Funciona no navegador e como app desktop

## Convenções

- Interface do usuário em português (pt-BR).
- Código, identificadores e comentários em inglês.
- A versão exibida no canto inferior esquerdo do app vem do `package.json`.

## Arquitetura

Camadas, regra de dependência e como adicionar funcionalidades: [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md).

## Versionamento

O projeto segue o [Versionamento Semântico](https://semver.org/lang/pt-BR/). O histórico fica em `CHANGELOG.md`.

Para publicar uma versão:

1. Atualize `"version"` no `package.json` e adicione a seção `## [X.Y.Z]` no `CHANGELOG.md`.
2. Faça o merge na `main`.
3. No GitHub, vá em **Actions > Release > Run workflow**, informe a versão (ex.: `1.1.0`) e execute.

O workflow cria a tag `vX.Y.Z` e a Release com as notas extraídas do `CHANGELOG.md`.
