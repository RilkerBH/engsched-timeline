# Arquitetura

## Decisão

Avaliamos aplicar DDD e Arquitetura Limpa ao projeto. A conclusão foi:

- **DDD completo não compensa.** É um único contexto (cronograma), sem backend, com invariantes simples (datas dentro do período, `order` único, cor em hex) e um desenvolvedor. Agregados, repositórios, eventos de domínio e injeção de dependência trariam indireção sem ganho.
- **Arquitetura Limpa enxuta compensa.** Três camadas com a regra de dependência apontando para dentro. Foi implementada em cinco passos incrementais, todos sem mudança de comportamento e cobertos por testes.

## Estrutura

```
src/
├── domain/            # TypeScript puro. Sem React, sem window. Testável em ms.
│   ├── types.ts             Entidades: ProjectSettings, TaskData, MilestoneData, ProjectFile
│   ├── layout.ts            Geometria da linha do tempo (datas -> %), empilhamento das linhas
│   ├── bulk.ts              Seleção por intervalo, mover bloco, deslocar datas, patch em lote
│   ├── colors.ts            Paleta estilo Excel, normalização de hex, contraste
│   ├── label-layout.ts      Distâncias padrão dos rótulos e migração do esquema 1 -> 2
│   ├── validation.ts        Schemas zod compartilhados pelos formulários (mensagens pt-BR)
│   └── project-file.ts      Formato .engsched: criar, serializar, validar, migrar (SEM I/O)
├── application/       # Orquestra o domínio. Depende só de domain/.
│   ├── project-reducer.ts   Estado único (ProjectState) + ações nomeadas por intenção
│   ├── project-persistence.ts  Autosave no localStorage (esquema 3) e conversão dos esquemas antigos
│   └── use-project.ts       Hook: expõe estado + comandos (configureProject, saveTask, shiftDates...)
├── infrastructure/    # Adapters concretos.
│   └── project-storage.ts   Port ProjectStorage + adapters web (download/input) e Electron (IPC)
├── hooks/             # Hooks de UI (seleção múltipla, toast, mobile)
├── components/        # Apresentação. Recebe dados + callbacks; não decide regra de negócio.
│   └── ui/                  shadcn/ui (gerado)
├── lib/utils.ts       # Só o `cn` do shadcn
└── app/               # Next.js (layout, página)
```

## Regra de dependência

```
components  ->  application  ->  domain
     |                              ^
     +------->  infrastructure -----+
```

- `domain/` não importa nada de fora dela (além de `date-fns` e `zod`, que são bibliotecas puras).
- `application/` importa `domain/`. Nunca importa componentes.
- `infrastructure/` importa `domain/` para serializar. É escolhida uma vez, em `getProjectStorage()`.
- `components/` importam `application/` (via `useProject`) e `domain/` (tipos e funções de apresentação como cores). Não fazem I/O direto.

## Fluxo de uma mudança

1. O usuário clica em algo num componente.
2. O componente chama um comando do `useProject()` (ex.: `project.shiftDates(selection, 7)`).
3. O comando despacha uma ação para o `projectReducer`, que usa funções puras de `domain/` para calcular o novo estado.
4. O `useProject` persiste o novo estado no `localStorage` automaticamente.
5. O componente re-renderiza com o novo estado.

Salvar/abrir arquivo é a exceção: o componente chama `projectStorage.save(project.toProjectFile())` ou `projectStorage.load()` e, no segundo caso, entrega o resultado a `project.loadProject(file)`.

## Como adicionar uma funcionalidade

- **Nova regra de negócio** (ex.: "duração mínima de uma tarefa"): função pura em `domain/`, teste em `domain/__tests__/`, uso no schema de `validation.ts` ou no reducer.
- **Nova operação sobre o projeto** (ex.: "duplicar tarefa"): ação no `project-reducer.ts`, comando no `use-project.ts`, teste do reducer, botão no componente.
- **Nova forma de persistir** (ex.: salvar na nuvem): novo adapter implementando `ProjectStorage` em `infrastructure/`. Nada mais muda.
- **Mudança no formato .engsched**: subir `PROJECT_FILE_VERSION` e tratar o caso em `migrateProjectFile()`. Nunca quebrar arquivos antigos.

## Testes

```bash
npm test          # unitários (Vitest), ~1 s
npm run test:watch
```

Cobrem `domain/` e `application/` por completo. A interface é validada manualmente e por scripts Playwright mantidos fora do repositório.

## Linguagem ubíqua

O termo de negócio é **Tarefa** (antes "Pacote de serviço"). Interface, código (`Task*`), ações do reducer (`task/saved`), arquivos (`task-form.tsx`) e a chave `tasks` do `.engsched` usam o mesmo termo. `deserializeProject` ainda lê a chave antiga `servicePackages` dos formatos 1.0 e 1.1.

## Próximos passos possíveis

- **Undo/Redo**: com estado único e reducer, basta guardar uma pilha de estados anteriores no `useProject` (cerca de 1 h de trabalho).
- **ESLint**: o projeto não tem configuração de lint. `next lint` com a base recomendada seria suficiente.
