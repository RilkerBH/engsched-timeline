# Changelog

Todas as mudanças relevantes deste projeto são documentadas aqui.

O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/)
e o projeto adota o [Versionamento Semântico](https://semver.org/lang/pt-BR/):

- **MAJOR** (2.0.0): mudanças incompatíveis (ex.: formato do arquivo `.engsched` que não abre mais em versões antigas).
- **MINOR** (1.1.0): novas funcionalidades compatíveis.
- **PATCH** (1.0.1): correções de bugs.

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

[1.0.0]: https://github.com/RilkerBH/engsched-timeline/releases/tag/v1.0.0
