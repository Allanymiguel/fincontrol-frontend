# FinControl — front-end

@AGENTS.md

Interface do FinControl (Tópicos II, UNITINS): controle financeiro pessoal/MEI (área do usuário) e área
administrativa (painel, usuários, cobranças, pagamentos, cupons, planos, auditoria, base de CEPs).
Angular 22 com componentes standalone, Angular Material, `keycloak-js` e testes com Vitest.

A API é **outro repositório** (`fincontrol-backend`, normalmente clonado ao lado deste, em
`../fincontrol-backend`), que também sobe o Keycloak (`docker compose up -d`). Os `models/*.model.ts` espelham os
DTOs do back: quando um DTO, endpoint ou código de enum muda lá, ajuste aqui num commit próprio deste repositório.

Documentação para humanos: `README.md` (como subir, login, telas da área administrativa).

## Comandos

```bash
npm ci
npx ng serve                       # http://localhost:4200 (precisa do back em :8080 e do Keycloak em :8180)
npx ng test --watch=false          # Vitest + jsdom
npx ng test --watch=false --include src/app/services/auth.service.spec.ts   # um arquivo
npx ng build                       # build de produção (falha se passar dos budgets do angular.json)
```

Node 22.22.3 ou mais novo (exigência do Angular CLI 22). Prettier: `printWidth` 100 e aspas simples.

## Estrutura (`src/app`)

| Pasta | Conteúdo |
|---|---|
| `components/<area>/<area>-list`, `-form`, `-dialog` | Uma pasta por tela, com `.ts`, `.html` e `.css` separados. Classes sem sufixo (`CupomForm`, `CupomList`) |
| `services` | Um service por recurso da API (`findAll`, `findById`, `create`, `update`, `delete`) |
| `models` | Interfaces da resposta (`Cupom`) e do corpo enviado (`CupomRequest`), mais funções puras do domínio |
| `resolvers` | `ResolveFn` que carrega a entidade nas rotas `edit/:id` |
| `auth` | `auth-config.ts` (Keycloak e `AUTH_HABILITADA`), guards e interceptor do token |
| `utils` | `form-errors.ts`, `data.ts` (datas ISO), `documento.ts` (CPF/CNPJ), `data-br-adapter.ts` |
| `testing` | `keycloak-falso.ts`: Keycloak e JWT falsos para os testes |

Rotas em `app.routes.ts`, num único arquivo: as telas do usuário ficam sob `userGuard` e as do admin sob
`adminGuard`, com `title` em pt-BR e `resolve` nas rotas de edição. O menu lateral fica em `app.html`.

## Convenções do projeto

O `AGENTS.md` traz as boas práticas gerais de Angular. O código atual diverge delas em alguns pontos.
Em código **novo**, siga o `AGENTS.md`. Em código existente, siga o padrão do arquivo e **não** refatore em
massa sem pedirem:

- **Injeção:** use `inject()`. Metade dos arquivos ainda usa injeção pelo construtor; não converta arquivos
  inteiros de passagem.
- **Rotas:** os componentes são importados diretamente, sem lazy loading. Mantenha assim, a menos que a tarefa
  seja justamente essa.
- **Formulários:** use **Reactive Forms** (`FormBuilder`), não Signal Forms, porque os utilitários de erro
  dependem de `FormGroup`. Padrão: um mapa `fieldMessages` por campo, `mensagemDeErro()` no template e
  `limparErrosDaApi()` + `aplicarErrosDaApi()` ao salvar. O back devolve erros no formato `ApiProblem`
  (RFC 9457) com `errors[].field`, que precisa ter o mesmo nome do controle do formulário para o erro aparecer
  no campo certo.
- **URL da API:** cada service tem `private readonly apiUrl = 'http://localhost:8080/...'` (não existe
  `environments/`). Service novo segue o mesmo padrão.
- **Paginação:** listagens usam `PagedResponse<T>` (exportado de `services/categoria.service.ts`) com parâmetros
  `page` e `pageSize`, exibidas com `MatTable` + `MatPaginator` (já traduzido para pt-BR no `app.config.ts`).
- **Datas:** a API usa `yyyy-MM-dd`; converta com `paraDataIso()` e `deDataIso()` de `utils/data.ts`. Locale
  `pt-BR` global: o pipe `| date` já mostra `dd/MM/yyyy` e `| number` usa vírgula.
- **Enums do back:** viram uma classe com `id` e `nome` e uma lista constante (ex.: `models/papel.ts`). Os ids
  são os mesmos do `EnumComId` do back e é o `id` que vai nos campos `idXxx` do request.
- **Feedback:** `MatSnackBar` para mensagens e `ConfirmacaoService.confirmar(...)` (Promise) antes de ações
  destrutivas.
- **Idioma:** nomes de componentes, métodos e campos em português. Comentários sem acentos; textos da interface em
  pt-BR com acentos. Ícones: `<mat-icon>` usa a fonte Material Symbols Outlined.
- **Privacidade (regra do produto):** telas do admin nunca mostram o conteúdo das finanças pessoais dos usuários
  (transações, categorias, contatos), só quantidades.

## Autenticação

O login acontece na tela do Keycloak (Authorization Code com PKCE); o app só recebe os tokens, mantidos em
memória pelo `AuthService`. O `authInterceptor` envia o token em toda chamada, exceto nas rotas listadas em
`ROTAS_PUBLICAS`; endpoint público novo no back (sem login) precisa entrar nessa regex. Para trabalhar sem
Keycloak, use `AUTH_HABILITADA = false` em `auth/auth-config.ts` junto com `FINCONTROL_AUTH=false` no back.
**Não commite `AUTH_HABILITADA = false`.**

## Git

Commits no padrão Conventional Commits, em inglês: `feat(cupons): ...`, `fix(usuarios): ...`,
`docs(readme): ...`, `refactor(auth): ...`.
