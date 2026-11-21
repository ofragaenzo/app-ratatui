# Interface iOS — novembro de 2026

## Direção visual

Fundo cinza claro, superfícies brancas, lavanda como cor de ação e tipografia do sistema. Cabeçalhos grandes, cartões arredondados, ícones consistentes, listas agrupadas no perfil e janelas em formato de folha reforçam a familiaridade com o iOS. A interface continua em React Native para iOS e Android.

O menu lateral reúne as áreas gerais do app. Dentro de um grupo, quatro abas inferiores dão acesso a Refeições, Detalhes, Ranking e Chat. A barra acompanha o grupo no celular e no desktop e não aparece nas páginas pessoais. O registro de refeição é uma ação no cabeçalho e no conteúdo do grupo. O feed permanece com largura confortável para leitura. Veja `navigation.md`.

Referências de interação: [Apple — Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars) e [Apple — Layout](https://developer.apple.com/design/human-interface-guidelines/layout). Os ícones são Ionicons; a aparência é inspirada na plataforma e não implementa controles nativos de Liquid Glass.

## Prévia interativa

- Alternar telas e filtrar as próprias refeições.
- Apoiar publicações e salvar refeições, com uma lista acessível pelo perfil.
- Abrir os detalhes do feedback ilustrativo.
- Escolher uma meta individual para explorar a interface.
- Criar um registro local usando uma das três fotos de demonstração.

As refeições de exemplo ficam na memória da sessão. Preferências de aparência, idioma e experiência são salvas localmente e descritas em `settings.md`. Não há upload, convite real ou análise automática. Pontuação e progresso permanecem ilustrativos; uma publicação local sem análise não recebe aprovação nem pontos automaticamente.

## Fotos de demonstração

As imagens foram incluídas em `apps/mobile/assets` para a prévia funcionar sem depender de uma conexão com um servidor de imagens.

- Salada · https://images.unsplash.com/photo-1512621776951-a57141f2eefd
- Salmão · https://images.unsplash.com/photo-1467003909585-2f8a72700288
- Bowl · https://images.unsplash.com/photo-1546069901-ba9599a7e63c
