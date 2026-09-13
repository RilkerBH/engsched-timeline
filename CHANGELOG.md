# Changelog

Todas as mudanças relevantes deste projeto são documentadas aqui.

O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/)
e o projeto adota o [Versionamento Semântico](https://semver.org/lang/pt-BR/):

- **MAJOR** (2.0.0): mudanças incompatíveis (ex.: formato do arquivo `.engsched` que não abre mais em versões antigas).
- **MINOR** (1.1.0): novas funcionalidades compatíveis.
- **PATCH** (1.0.1): correções de bugs.

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

[1.3.0]: https://github.com/RilkerBH/engsched-timeline/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/RilkerBH/engsched-timeline/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/RilkerBH/engsched-timeline/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/RilkerBH/engsched-timeline/releases/tag/v1.0.0
