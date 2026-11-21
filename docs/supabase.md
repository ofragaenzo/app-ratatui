# API do diário com Supabase

O Supabase cuida da autenticação e do PostgreSQL. A API em Rust recebe o token de acesso da sessão e o encaminha à API de dados com a chave pública do projeto. As políticas do banco limitam cada conta aos seus próprios registros.

## Configurar o projeto

1. Crie ou selecione o projeto do Prato a Prato no painel do Supabase.
2. Na raiz deste repositório, vincule e aplique a migração usando a [CLI do Supabase](https://supabase.com/docs/reference/cli/introduction#supabase-db-push). Informe o identificador do projeto no lugar de `PROJECT_REF` e confira o destino no resultado do `--dry-run`.

```sh
supabase init
supabase login
supabase link --project-ref PROJECT_REF
supabase db push --remote --dry-run
supabase db push --remote
```

3. Copie a URL e a chave `sb_publishable_...` da janela **Connect** do projeto. No PowerShell, na raiz do projeto, execute:

```powershell
$env:SUPABASE_URL = "https://PROJECT_REF.supabase.co"
$env:SUPABASE_PUBLISHABLE_KEY = "sb_publishable_..."
cd services/api
cargo run
```

O servidor escuta em `127.0.0.1:3000` por padrão. Para usar outro endereço ou porta, configure `API_BIND_ADDR`. Para uma prévia web em outra origem, configure `API_WEB_ORIGIN`, que por padrão aceita `http://localhost:8082`.

## Rotas

| Método e rota | Resultado |
|---|---|
| `GET /health` | Verifica se a API está no ar. |
| `GET /v1/me` | Retorna o identificador da conta autenticada. |
| `GET /v1/meals` | Retorna os 50 registros mais recentes do próprio diário. |
| `POST /v1/meals` | Cria um registro privado e retorna os dados gravados. |

Envie `Authorization: Bearer <access_token>` nas rotas `/v1`, usando o token da sessão emitido pelo Supabase Auth. Para criar um registro, envie JSON com `title` e `category`. As categorias aceitas são `breakfast`, `lunch`, `snack` e `dinner`. Os campos `caption` e `ingredients` são opcionais. O banco define o dono e a data de criação.

A prévia Expo ainda usa os dados locais. Depois de configurar o Supabase, a próxima etapa é ligar o login e o diário da interface a essas rotas.
