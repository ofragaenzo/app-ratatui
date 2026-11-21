# Prato a Prato

Aplicativo social de nutrição em que cada pessoa acompanha sua própria meta, compartilha refeições e participa de grupos com amigos. Pontos e sequências celebram consistência; a análise automática da refeição é um apoio informativo, não uma avaliação clínica.

## Estrutura

- `apps/mobile`: cliente React Native com Expo e TypeScript.
- `services/api`: API HTTP em Rust com Axum.
- `docs/product.md`: visão, escopo inicial e decisões de produto.

## Começar

### API

```sh
cd services/api
cargo run
```

A API responde em `http://localhost:3000/health` e `http://localhost:3000/`.

Para conectar a API ao Supabase e habilitar as rotas de sessão e diário, siga [Configurar o Supabase](docs/supabase.md).

### App

```sh
cd apps/mobile
npm install
npx expo start
```

Para abrir a prévia no navegador do notebook:

```sh
npm run web
```

Use o endereço indicado pelo Expo (normalmente `http://localhost:8081`). A prévia funciona com dados locais e ainda não faz chamadas à API.

### Abrir no iPhone com Expo Go

O app usa Expo SDK 58. Atualize o Expo Go na App Store para uma versão compatível com SDK 58.

No PowerShell, dentro de `apps/mobile`, use os executáveis `.cmd` para evitar o bloqueio de scripts `.ps1`:

```powershell
npx.cmd expo start --go --lan --port 8082 --clear
```

Conecte o notebook e o iPhone à mesma rede Wi-Fi e escaneie o QR code com a Câmera do iPhone. Mantenha o terminal aberto. Se o Expo Go pedir login, use a mesma conta no app e no computador (`npx.cmd expo login`).

Se houver bloqueio de conexão pela rede, encerre o servidor com Ctrl+C e tente `npx.cmd expo start --go --tunnel --port 8082`. A confirmação de funcionamento em um iPhone físico depende de abrir o QR code no dispositivo.

O design usa uma interface inspirada no iOS, com folhas modais, listas agrupadas e cartões em lavanda. O menu lateral reúne perfil, diário, metas, grupos e configurações. A barra inferior fica dentro de cada grupo, com **Refeições, Detalhes, Ranking e Chat**. Veja `docs/design.md` e `docs/navigation.md`.

## Estado atual

O app é uma prévia interativa com dados de demonstração. É possível alternar telas, filtrar o feed, apoiar e salvar refeições, criar um grupo de demonstração e publicar um registro com foto de exemplo. Refeições, apoios, itens salvos e grupos de demonstração duram até recarregar a página. A meta pessoal e as preferências são salvas no dispositivo.

As configurações de aparência, idioma e experiência são salvas no dispositivo. Acesse a engrenagem ou **Perfil → Configurações** para escolher tema claro/escuro/sistema, português/inglês/espanhol, texto maior, feed compacto, feed inicial e redução de animações. Veja `docs/settings.md`.

Em **Perfil → Minha meta pessoal**, o formulário detalhado reúne objetivo, prazo, rotina, restrições e metas nutricionais opcionais. A meta é salva localmente. O menu lateral reúne perfil, atalhos, grupos e configurações; a criação de grupos funciona como demonstração da sessão. Veja `docs/personal-goal.md`.

Autenticação, persistência de refeições, upload de imagens, convites reais e análise nutricional ainda não estão ligados. Pontos e progresso são ilustrativos. A avaliação de refeições precisa mostrar explicações e incerteza sem fazer recomendações médicas indevidas.
