# Changelog

Todas as mudanças relevantes deste projeto são documentadas aqui.

O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/)
e o projeto adota o [Versionamento Semântico](https://semver.org/lang/pt-BR/):

- **MAJOR** (2.0.0): mudanças incompatíveis (ex.: formato do arquivo `.engsched` que não abre mais em versões antigas).
- **MINOR** (1.1.0): novas funcionalidades compatíveis.
- **PATCH** (1.0.1): correções de bugs.

## [2.4.0] - 2026-09-19

### Adicionado

- **Legenda do período**: o nome de um período de destaque agora aparece numa
  legenda separada, com o mesmo visual da própria faixa (cor, transparência e
  borda), numa posição padrão dentro dela — pode ser arrastada com o mouse
  para qualquer lugar, igual aos textos de tarefas e marcos.
- **Borda personalizável do período**: estilo (nenhuma, sólida, tracejada ou
  pontilhada) e cor da borda configuráveis por período.
- Faixa do período com bordas mais arredondadas.
- Formato do arquivo `.engsched` sobe para 1.6: períodos agora guardam o
  deslocamento da legenda e o estilo/cor da borda. Períodos de arquivos 1.5
  (sem esses campos) abrem sem borda e com a legenda na posição padrão.

## [2.3.0] - 2026-09-19

### Adicionado

- **Nome e data independentes por intervalo**: quando uma tarefa é dividida
  em intervalos, cada barra agora mostra seu próprio nome e sua própria data
  (em vez de um nome único centralizado e uma lista combinada de datas).
  Cada intervalo tem seu próprio campo de nome no formulário e as posições
  de nome/data de cada barra podem ser arrastadas independentemente.
- Formato do arquivo `.engsched` sobe para 1.5: cada intervalo agora guarda
  seu próprio nome e deslocamentos de rótulo. Intervalos de arquivos 1.4
  (sem esses campos) usam o nome da tarefa e deslocamento zero.

## [2.2.0] - 2026-09-18

### Adicionado

- **Intervalos**: uma tarefa pode ser dividida em 2 ou mais intervalos de
  datas, desenhados como barras separadas na mesma linha (mesmo nome, cor,
  altura e ordem), com um espaço vazio entre elas — útil para tarefas que
  pausam e retomam (ex.: mobilização interrompida pelo período chuvoso).
  Botão *Adicionar intervalo* no formulário da tarefa.
- Formato do arquivo `.engsched` sobe para 1.4 com a chave `intervals` nas
  tarefas. Arquivos de versões anteriores continuam abrindo normalmente.

## [2.1.0] - 2026-09-15

### Adicionado

- **Períodos de destaque**: faixas verticais semitransparentes entre duas
  datas, desenhadas sobre as tarefas e os marcos, para marcar intervalos
  como período chuvoso ou férias coletivas. Cada período tem nome (opcional),
  datas, cor e transparência ajustável. Botão *Novo Período* na barra de
  controles; duplo clique em qualquer ponto vazio da faixa para editar ou
  excluir (tarefas e marcos sob a faixa continuam clicáveis).
- Formato do arquivo `.engsched` sobe para 1.3 com a chave `periods`.
  Arquivos das versões anteriores continuam abrindo normalmente.

## [2.0.2] - 2026-09-14

### Removido

- 18 componentes shadcn/ui que nenhuma parte do app importava (accordion,
  alert, avatar, badge, calendar, carousel, chart, checkbox, collapsible,
  menubar, progress, radio-group, scroll-area, separator, sheet, sidebar,
  table, tabs), o hook `use-mobile` que só o sidebar usava, e as 13
  dependências npm que existiam apenas para esses arquivos (entre elas
  `recharts`, `react-day-picker` e `embla-carousel-react`).
- Tokens de tema `chart-*` e `sidebar-*` do CSS e do Tailwind, que só os
  componentes removidos consumiam.

## [2.0.1] - 2026-09-13

### Corrigido

- O script `electron:build` passa a forçar `--x64`. Em Macs Apple Silicon o
  electron-builder gerava um executável ARM64 que não abre em PCs Windows
  comuns ("Este aplicativo não pode ser executado em seu PC").

- O pacote Windows deixa de embutir o `node_modules` (o app roda a partir do
  export estático e não precisa dele): a pasta gerada cai de 699 MB para
  270 MB, que é o tamanho do próprio Electron.

### Adicionado

- Workflow *Build Windows*: gera o `.zip` e o `.exe` portátil num runner
  Windows, manualmente ou ao publicar uma Release (anexa os arquivos a ela).
- `npm run electron:build` passa a gerar também o zip versionado
  (`EngSched-Timeline-vX.Y.Z-win-x64.zip`) ao lado da pasta `win-unpacked/`.
- Script `electron:build:portable` (para builds feitos no próprio Windows).
- Skill `web-to-exe` versionada em `.claude/skills/`.

## [2.0.0] - 2026-09-13

### Alterado (incompatível)

- O arquivo `.engsched` passa para o formato `1.2`: a chave `servicePackages`
  foi renomeada para `tasks`. Arquivos dos formatos `1.0` e `1.1` continuam
  abrindo normalmente (são convertidos ao carregar), mas **arquivos salvos
  pela 2.0.0 não abrem em versões anteriores do app**. É por isso que a
  versão maior sobe.

### Interno

- Linguagem ubíqua alinhada: o código passa a falar `Task` em vez de
  `ServicePackage` (tipos, funções de domínio, ações do reducer, hooks e
  componentes `task-form.tsx` / `task-row.tsx`).
- O autosave do navegador passa ao esquema 3 (`tasks`); os esquemas 1 e 2
  são convertidos na primeira abertura.
- 66 testes unitários.

## [1.7.0] - 2026-09-13

### Alterado

- "Pacote de serviço" passa a se chamar "Tarefa" em toda a interface
  (botão "Nova Tarefa", formulário, mensagens e barra de seleção). O
  formato do arquivo `.engsched` não muda.

### Corrigido

- Cabeçalho de meses e barras agora usam o mesmo modelo de datas, com o
  dia final incluído. Antes, os meses somavam um dia a mais que as barras e
  o cabeçalho passava ligeiramente de 100% da largura. Efeitos visíveis:
  os meses somam exatamente 100%, cada barra fica um dia mais larga (uma
  tarefa de um único dia, que antes tinha largura zero, agora aparece), e
  barras de tarefas consecutivas se encostam sem sobrepor.

## [1.6.1] - 2026-09-13

### Interno

Refatoração para arquitetura em camadas (ver `docs/ARQUITETURA.md`), sem
mudança de comportamento:

- `src/domain`: tipos e funções puras (layout, cores, operações em bloco,
  rótulos, validação, formato `.engsched`).
- `src/application`: estado único do projeto com reducer, autosave e o hook
  `useProject`.
- `src/infrastructure`: salvar/abrir arquivo atrás de uma interface, com
  adapters para navegador e Electron.
- 61 testes unitários com Vitest (`npm test`).
- Os dados salvos no navegador passam a ficar em uma única chave; os dados
  das versões anteriores são convertidos automaticamente na primeira abertura.
- Removidos o placeholder `src/ai` (não usado) e o hook `use-local-storage`.

## [1.6.0] - 2026-09-13

### Adicionado

- Número da versão do app no canto inferior esquerdo da interface (lido do
  `package.json` em tempo de build).

### Alterado

- Interface 100% em português: formulários de projeto, pacote e marco,
  mensagens de validação e botões "Novo Pacote" / "Novo Marco".
- Código-fonte e comentários padronizados em inglês (sem mudança de comportamento).

## [1.5.0] - 2026-09-13

### Removido

- Controle de zoom da linha do tempo (botões, slider e "Reset Zoom"). A linha
  do tempo passa a ocupar sempre 100% da largura disponível. O campo `zoom`
  deixa de ser gravado no arquivo `.engsched`; arquivos antigos que ainda o
  contêm continuam abrindo normalmente (o campo é ignorado).

## [1.4.0] - 2026-09-13

### Alterado

- Nome e data de pacotes e marcos passam a nascer em posições padrão alinhadas,
  sem precisar de ajuste com o mouse:
  - Pacote com nome fora: nome e data à direita da barra, alinhados na mesma
    coluna (8px da barra), empilhados no centro vertical da barra.
  - Pacote com nome dentro: nome centralizado na barra e data centralizada
    2px abaixo da barra.
  - Marco: data 2px acima do triângulo e nome logo acima da data (antes a
    data ficava sobreposta ao triângulo).
- Os deslocamentos dos rótulos (`labelOffset*`) agora representam apenas o
  ajuste manual sobre a posição padrão, e valem 0 por padrão. Arrastar com o
  mouse continua funcionando.

### Adicionado

- Botão "Redefinir textos" no formulário de edição de pacote e de marco (aparece
  quando há ajuste manual) e ação "Redefinir posição dos textos" no menu "Mais"
  da barra de seleção múltipla.

### Corrigido

- Um rótulo arrastado para exatamente a posição 0 voltava ao padrão antigo ao
  editar o item.
- Nome dentro da barra nascia 10px fora do centro.

### Migração

- O formato do arquivo `.engsched` passa para a versão `1.1`. Arquivos `1.0`
  são convertidos ao abrir: rótulos que estavam no padrão antigo vão para o
  novo padrão; rótulos ajustados manualmente mantêm a mesma posição na tela.
  O mesmo vale para os dados salvos no navegador (migração única).

## [1.3.0] - 2026-09-13

### Adicionado

- Botão "Abrir projeto existente (.engsched)" na tela inicial, permitindo
  carregar um projeto salvo sem precisar criar um projeto novo antes.

## [1.2.0] - 2026-09-13

### Adicionado

- Seleção múltipla de pacotes e marcos direto na linha do tempo:
  clique seleciona, Ctrl/Cmd+clique adiciona ou remove da seleção,
  Shift+clique seleciona um intervalo de pacotes, Esc limpa a seleção.
- Barra de ações em bloco para os itens selecionados:
  alterar cor, alterar formato da data, mover pacotes como bloco (cima/baixo),
  deslocar datas em N dias (adiantar/atrasar, respeitando o período do projeto),
  nome dentro da barra, quebra de linha do nome, selecionar todos e excluir
  (tecla Delete abre a confirmação).
- Destaque visual dos itens selecionados (removido automaticamente na exportação PNG).

## [1.1.0] - 2026-09-13

### Adicionado

- Seletor de cores no estilo do Excel para pacotes de serviço e marcos:
  60 cores do tema (10 cores-base com 5 variações), 10 cores padrão,
  campo para digitar o código hexadecimal (`#RRGGBB`) e acesso ao seletor
  de cores nativo do sistema ("Mais cores").

### Alterado

- A cor padrão de novos pacotes e marcos passou a ser o azul do tema (`#4472C4`).
- O campo de cor agora valida o formato hexadecimal ao salvar.

## [1.0.0] - 2026-09-13

Versão base do EngSched Timeline.

### Funcionalidades

- Configuração de período do projeto (título, data início/fim).
- Pacotes de serviço com cor, datas, altura e posicionamento de rótulos.
- Marcos (milestones) na linha do tempo.
- Reordenação de pacotes (setas para cima/baixo).
- Rótulos de nome e data arrastáveis.
- Zoom da linha do tempo.
- Exportação como imagem PNG.
- Salvar e abrir projetos (arquivo `.engsched`) no navegador e no Electron.
- Persistência automática no `localStorage`.

[2.0.1]: https://github.com/RilkerBH/engsched-timeline/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/RilkerBH/engsched-timeline/compare/v1.7.0...v2.0.0
[1.7.0]: https://github.com/RilkerBH/engsched-timeline/compare/v1.6.1...v1.7.0
[1.6.1]: https://github.com/RilkerBH/engsched-timeline/compare/v1.6.0...v1.6.1
[1.6.0]: https://github.com/RilkerBH/engsched-timeline/compare/v1.5.0...v1.6.0
[1.5.0]: https://github.com/RilkerBH/engsched-timeline/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/RilkerBH/engsched-timeline/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/RilkerBH/engsched-timeline/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/RilkerBH/engsched-timeline/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/RilkerBH/engsched-timeline/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/RilkerBH/engsched-timeline/releases/tag/v1.0.0
