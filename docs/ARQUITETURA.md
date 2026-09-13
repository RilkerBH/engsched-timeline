# Avaliação: vale a pena refatorar com DDD / Arquitetura Limpa?

**Resposta curta:** DDD completo, não. Uma "Arquitetura Limpa enxuta" em três camadas, sim — de forma incremental, sem big-bang.

## Situação atual (v1.2.0)

| Área | Linhas (aprox.) | O que contém |
|---|---|---|
| `src/components/timeline-app.tsx` | ~550 | Todo o estado, todos os handlers, orquestração de diálogos e renderização |
| `src/lib/*.ts` | ~400 | Tipos, cálculo de layout, paleta, operações em bloco, persistência (arquivo) |
| Demais componentes de feature | ~1.100 | Formulários, linha de pacote, marcador, cabeçalho, barra de seleção |
| `src/components/ui/*` | ~3.800 | shadcn/ui (gerado, não conta como código do domínio) |

Características que pesam na decisão:

- **Um único contexto delimitado** (cronograma), sem backend, sem integrações, um desenvolvedor.
- **Invariantes simples**: datas dentro do período do projeto, `order` único, cor em hex.
- **Zero testes automatizados.**
- **Estado espalhado**: `projectSettings`, `servicePackages` e `milestones` são três `useLocalStorage` independentes. Carregar um arquivo faz três `set`s separados, sem garantia de atomicidade.
- **Componente-deus**: cada funcionalidade nova cresce o `timeline-app.tsx` (a seleção múltipla adicionou ~150 linhas nele).
- **Formato de arquivo sem migração**: `version: "1.0"` é gravado, mas nada o interpreta. Na primeira mudança incompatível do `.engsched` não há onde colocar a migração.

## Por que DDD completo não compensa

DDD (agregados, repositórios, eventos de domínio, serviços de aplicação, injeção de dependência, bounded contexts) resolve **complexidade de domínio e de equipe**. Aqui não existe nenhuma das duas. O custo seria:

- 3 a 4 arquivos por conceito (entidade, repositório, caso de uso, DTO) para regras que hoje cabem em uma função de 10 linhas.
- Indireção que atrasa cada funcionalidade nova sem ganho de segurança correspondente.
- Vocabulário que só faz sentido para um domínio rico; o de um Gantt simplificado é pequeno e estável.

## O que compensa: três camadas, regra de dependência para dentro

```
src/
├── domain/          # TypeScript puro. Sem React, sem window, sem date-fns de UI.
│   ├── types.ts             (entidades: Project, ServicePackage, Milestone)
│   ├── layout.ts            (getPositionAndWidth, getMonthHeaders...)
│   ├── bulk.ts              (movePackagesBlock, shiftDates, applyPatch)
│   ├── colors.ts            (paleta, normalizeHex)
│   ├── validation.ts        (regras de datas hoje duplicadas nos schemas zod)
│   └── project-file.ts      (serialize / deserialize / migrate — SEM I/O)
├── application/     # Orquestra o domínio. Depende só de domain/.
│   ├── project-reducer.ts   (um reducer: estado único + ações nomeadas)
│   ├── use-project.ts       (hook que expõe estado + dispatch + persistência)
│   └── ports.ts             (interface ProjectStorage { save, load })
├── infrastructure/  # Implementações concretas dos ports.
│   ├── storage-web.ts       (download / input file)
│   ├── storage-electron.ts  (IPC)
│   └── local-storage.ts     (autosave)
└── components/      # Apresentação. Recebe dados + callbacks, não decide regra.
```

Ganhos concretos, em ordem de valor:

1. **Testes baratos.** Tudo em `domain/` é função pura: `vitest` roda em milissegundos, sem DOM. Hoje as regras mais delicadas (mover bloco, deslocar datas, migração de arquivo) não têm nenhum teste.
2. **Undo/Redo de graça.** Com um reducer e estado único, desfazer é guardar uma pilha de estados anteriores. Com quatro `useState` independentes, é inviável.
3. **Um único ponto para carregar/salvar/resetar.** `dispatch({ type: "project/loaded", file })` substitui os quatro `set`s e elimina estados intermediários inconsistentes.
4. **Migração de formato.** `migrateProjectFile(raw): ProjectFile` no domínio é o lugar natural para evoluir o `.engsched` sem quebrar arquivos antigos (isso é o que justificaria um MAJOR no SemVer, e a migração evita precisar dele).
5. **Electron vs. web sem `if (isElectron())` espalhado.** O `ProjectStorage` é escolhido uma vez na composição da aplicação.

## Como fazer sem parar as entregas

Cada passo é uma refatoração sem mudança de comportamento (versão PATCH ou junto de uma MINOR), com o app funcionando ao final de cada um:

| Passo | Esforço | O que muda |
|---|---|---|
| 1. Adicionar `vitest` e testar `bulk.ts`, `utils.ts`, `colors.ts`, `deserializeProject` | ~2 h | Nada no app. Cria a rede de segurança para os passos seguintes. |
| 2. Criar `domain/` e mover os arquivos puros de `lib/` para lá (só `git mv` + imports) | ~1 h | Nada no app. |
| 3. Extrair `projectReducer` + `useProject()` do `timeline-app.tsx` | ~4 h | `timeline-app.tsx` cai para ~200 linhas. Undo/Redo vira uma tarefa de 1 h depois disso. |
| 4. Separar `project-file.ts` em serialização (domínio) e `ProjectStorage` (port + 2 adapters) | ~2 h | Some o `isElectron()` do componente. |
| 5. Consolidar validação de datas em `domain/validation.ts` e usá-la nos schemas zod | ~1 h | Regras deixam de estar duplicadas em 3 formulários. |

Total: 1 a 2 dias de trabalho, entregável em pedaços.

## O que não fazer

- Não criar classes `Entity`, `ValueObject`, `Repository` genéricas. Tipos + funções puras bastam.
- Não introduzir container de injeção de dependência. Um `const storage = isElectron() ? electronStorage : webStorage` na raiz resolve.
- Não reescrever os componentes shadcn nem "abstrair" o React.
- Não fazer tudo num único PR. Cada passo acima é um commit revisável.

## Recomendação

Executar os passos 1 a 3 já na próxima janela de trabalho (são os de maior retorno: testes + reducer). Os passos 4 e 5 podem esperar a próxima funcionalidade que toque persistência ou validação, e ser feitos junto com ela.
