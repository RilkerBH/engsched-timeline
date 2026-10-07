# EngSched Timeline — instruções para o Claude Code

App Next.js + Electron (cronograma de engenharia). Testes com Vitest (`npm test`).
O dono do projeto fala português; responda em português. Mensagens de commit
seguem Conventional Commits em inglês (`feat:`, `fix:`, `chore:` …).

## Fluxo de release

Quando o usuário pedir "faça o release", "fluxo completo de release" ou
similar, execute TODOS os passos abaixo, nesta ordem:

1. `git pull` no `main` e confirme que a árvore está limpa (ou que as mudanças
   pendentes são as que vão entrar na release).
2. `npm test` — tudo precisa passar. Se falhar, pare e mostre a saída.
3. Escolha a versão pelo SemVer descrito no topo do `CHANGELOG.md`
   (PATCH = só correções; MINOR = funcionalidade compatível; MAJOR = arquivo
   `.engsched` deixa de abrir em versões antigas). Se o usuário não disse,
   proponha e explique a escolha.
4. Suba a versão no `package.json` **e** no `package-lock.json` juntos:
   `npm version X.Y.Z --no-git-tag-version` (nunca deixe o lockfile para trás).
5. `CHANGELOG.md`:
   - nova seção `## [X.Y.Z] - AAAA-MM-DD` acima da anterior, com
     *Adicionado* / *Alterado* / *Corrigido*, escrita para o usuário final;
   - se o formato do `.engsched` mudou, diga isso (como nas versões anteriores);
   - adicione o link `[X.Y.Z]: https://github.com/RilkerBH/engsched-timeline/compare/vANTERIOR...vX.Y.Z`
     no topo da lista de links no fim do arquivo.
6. Commit (`chore: release X.Y.Z` ou junto da mudança) e push para `main`.
7. Rode o workflow **Release** — ele cria a tag e a Release com as notas do
   CHANGELOG:
   `gh workflow run release.yml -f version=X.Y.Z -f target=<SHA do commit>`
   e aguarde (`gh run watch <id> --exit-status`).
   **Nunca crie a tag manualmente antes**: o workflow falha se a tag já existir.
8. Rode o workflow **Build Windows** a partir da tag, anexando à Release:
   `gh workflow run build-windows.yml --ref vX.Y.Z -f tag=vX.Y.Z`
   e aguarde (leva ~6 min).
9. Verifique: `gh release view vX.Y.Z` tem `EngSched-Timeline-vX.Y.Z-win-x64.exe`
   e `.zip`; `gh release list` mostra a versão como *Latest*; `git status` limpo.
10. Liste branches além de `main` (locais e remotas). Se todas já estiverem
    contidas no `main` (`git rev-list --count main..<branch>` = 0), ofereça
    apagá-las; não apague branch com commits fora do `main` sem perguntar.

Ao final, resuma em tópicos curtos o que foi feito, com o link da Release.

## Adaptar ao ambiente

Antes do passo 1, identifique onde a sessão está rodando — verifique, não
suponha:

- `uname -s` / shell → macOS, Linux (nuvem) ou Windows.
- `git branch --show-current` → se for `claude/...`, é sessão na nuvem.
- `gh auth status` → se o `gh` existe e está logado.

### Mac local (terminal ou app desktop em modo local)
- Pasta do projeto fica no OneDrive, com espaços e acento no caminho
  ("Escritório") — sempre use aspas nos caminhos.
- Commits vão direto no `main`. Fluxo completo funciona como descrito.

### Windows local (app desktop ou terminal no PC)
- Confirme que existem Node, `git` e `gh` logado; se faltar algo, diga ao
  usuário o que instalar (`gh auth login` ele deve rodar com `! gh auth login`).
- O shell pode ser PowerShell: adapte comandos (sem `awk`/`sed`/`sleep`; use
  equivalentes ou `gh run watch`).
- Atenção a fim de linha: não converta arquivos inteiros para CRLF.
- Opcional: oferecer `npm run electron:build:portable` para testar o `.exe`
  localmente antes da release — mas a Release oficial sempre usa o workflow
  Build Windows.

### Nuvem (app do iPhone, claude.ai/code, ou sessão remota)
- O trabalho fica numa branch `claude/...`; não há acesso aos arquivos locais
  do usuário.
- Faça a mudança, os testes e (se pedido) a subida de versão + CHANGELOG
  nessa branch, faça push e abra um Pull Request para `main`.
- Se `gh` estiver disponível e autenticado, tente seguir com merge (só se o
  usuário pedir) e os passos 7–9. Se não estiver, NÃO improvise tags: explique
  ao usuário os passos restantes em linguagem simples:
  1. Fazer merge do PR no GitHub.
  2. Actions → *Release* → Run workflow → versão `X.Y.Z`.
  3. Actions → *Build Windows* → Run workflow → no seletor "Use workflow from"
     escolher a tag `vX.Y.Z` e preencher `tag` com `vX.Y.Z`.
  Ou, numa sessão local depois: "puxe o main e termine o release X.Y.Z".
- Depois do merge, a branch `claude/...` pode ser apagada.

## Convenções úteis

- Formato do arquivo de projeto: `src/domain/project-file.ts`. A versão do
  formato `.engsched` (`PROJECT_FILE_VERSION`) é independente da do app; ao
  mudar o formato, suba-a, registre no comentário histórico do arquivo qual
  versão do app introduziu a mudança, mantenha a leitura de arquivos antigos e
  cite no CHANGELOG.
- Builds geram `out/` e `dist/` (ignorados pelo git).

## Autoria dos commits

O autor de todo commit é sempre o dono do projeto, em qualquer ambiente
(Mac, Windows, nuvem/iPhone) — nunca o Claude:

- Antes do primeiro commit da sessão, configure o autor no repositório:
  `git config user.name "Rilker Franca Rocha" && git config user.email "rilker.franca@gmail.com"`
- Não use `Claude <noreply@anthropic.com>` como autor nem como committer.
- A participação do Claude fica só na linha `Co-Authored-By:` no fim da
  mensagem do commit.
