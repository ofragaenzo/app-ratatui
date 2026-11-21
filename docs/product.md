# Visão do produto — Prato a Prato

## A ideia

Um app social de hábitos alimentares inspirado na dinâmica de grupos e sequências de apps fitness. Cada integrante escolhe uma meta pessoal (por exemplo, comer mais vegetais, manter uma rotina ou ganhar massa com orientação profissional). O grupo apoia a consistência de cada pessoa; não impõe uma meta corporal igual para todos.

## Ciclo principal

1. A pessoa define um objetivo de hábito e, se quiser, contexto alimentar relevante.
2. Entra ou cria um grupo de amigos com duração e regras claras.
3. Publica a foto de uma refeição e uma legenda opcional.
4. O app oferece uma leitura assistida sobre como a refeição se relaciona com o objetivo declarado, mostrando justificativa e limites da análise.
5. A pessoa decide publicar; o grupo reage e acompanha pontos de consistência e sequência.

## Princípios de produto

- Pontuar hábitos e participação, nunca peso, calorias consumidas ou velocidade de emagrecimento.
- Não comparar objetivos pessoais diferentes como se fossem equivalentes.
- Análise automática é estimativa, pode errar e não substitui nutricionista ou orientação médica.
- Evitar linguagem moralizante sobre alimentos ("bom", "ruim", "falha"). Preferir feedback contextual, gentil e acionável.
- Dar controle sobre privacidade, conteúdo compartilhado, notificações e saída/pausa do grupo.
- Considerar alergias e restrições sem inferi-las pela imagem; deixar claro o que não é possível identificar numa foto.

## MVP sugerido

- Perfil com objetivo de hábito escolhido em linguagem simples.
- Criar/entrar em grupo por convite, feed de refeições e reações.
- Pontos por publicação consistente, com limite diário e sequência sem punição por pausa.
- Feedback assistido explicável, inicialmente opcional e confirmado pela pessoa antes de aparecer no grupo.
- Denúncia, bloqueio e controles de privacidade desde a primeira versão pública.

## Questões para validar

- As pessoas preferem escolher uma meta livre, uma categoria de hábito ou um plano sugerido?
- Pontuação deveria premiar frequência, variedade, ou apenas participação?
- O feedback deve ser privado por padrão ou visível junto da publicação?
- Qual nível de apoio nutricional é seguro e útil sem transformar o produto em ferramenta de diagnóstico?

## Arquitetura inicial

- Mobile: React Native + Expo + TypeScript, visando iOS e Android.
- API: Rust + Axum, endpoints JSON versionados.
- Próximas decisões: banco (provável PostgreSQL), armazenamento privado de imagens, autenticação, moderação e fornecedor/modelo de análise. Não fixar esses serviços antes de validar privacidade, custo e qualidade.
