# Navegação por grupo

O menu lateral reúne as áreas gerais do app: diário pessoal, lista de grupos, perfil, meta pessoal, configurações e criação de grupo. A lista lateral de grupos abre o grupo escolhido.

A barra inferior pertence apenas ao grupo aberto e tem quatro seções:

| Seção | Conteúdo |
| --- | --- |
| Refeições | Feed e publicação de refeições daquele grupo; filtro das próprias refeições. |
| Detalhes | Descrição, integrantes, metas individuais, regras e acesso a convites. |
| Ranking | Pontuação dos integrantes daquele grupo, identificada como ilustrativa na prévia. |
| Chat | Conversa do grupo, com envio manual de mensagens de demonstração. |

Perfil, diário, configurações, meta e diretório de grupos não exibem a barra inferior do grupo. O nome do grupo permanece no cabeçalho de todas as suas seções.

## Escopo dos dados na prévia

Refeições e mensagens são associadas ao ID do grupo. Um grupo recém-criado começa sem refeições, sem mensagens e com um integrante sem pontos. O Grupo Raiz usa os exemplos já existentes.

O chat e seu rascunho continuam na memória ao alternar seções, abrir áreas pessoais e voltar ao grupo. Grupos diferentes têm conversas separadas. Mensagens, publicações e grupos de demonstração reiniciam ao recarregar; não há transmissão de mensagens ou sincronização com outras pessoas.

`GroupWorkspace.tsx` mantém o contexto do grupo e a navegação inferior. `App.tsx` mantém as rotas gerais, a seleção do grupo e o escopo das refeições. `NavigationDrawer.tsx` oferece os acessos gerais no celular; o desktop apresenta esses acessos na coluna lateral.
