# Perfil e meta pessoal

O perfil abre um formulário próprio de meta pessoal. O mesmo formulário pode ser acessado pelo cartão da meta na tela Hoje ou pelo menu lateral.

## Informações da meta

- Objetivo principal: hábitos, perda de peso, ganho de massa, manutenção ou bem-estar.
- Título e descrição pessoais.
- Data de início, duração em semanas e frequência semanal.
- Dados corporais opcionais: peso atual, peso desejado e altura.
- Padrão alimentar, alimentos preferidos e alimentos que a pessoa evita.
- Alergias e restrições informadas pela pessoa.
- Número de refeições, foco de consistência e rotina de atividade.
- Metas diárias opcionais de calorias, proteína, carboidratos, gorduras, fibras e água.
- Indicação de plano profissional e observações.

O app não calcula nem recomenda metas de calorias, nutrientes ou peso. Esses campos são manuais e opcionais. O grupo e as publicações recebem apenas o título da meta; medidas, restrições e outros detalhes permanecem no perfil local.

## Persistência e validação

`src/personalGoal.ts` guarda uma versão validada do perfil com AsyncStorage. O salvamento é explícito, mantém a data de criação e atualiza a data de alteração. O título é restaurado na tela Hoje ao abrir o app.

A validação aceita ponto ou vírgula decimal, rejeita números inválidos, datas inexistentes, frequência fora de 1–7 dias e duração fora de 1–104 semanas. Campos opcionais vazios são gravados como `null`. As gravações são serializadas e as falhas são informadas na interface.

Os pontos e o progresso do grupo continuam ilustrativos. Salvar uma meta não cria uma avaliação de refeição nem soma pontos.

## Navegação e grupos

No celular, o menu abre pela lateral esquerda e reúne perfil, resumo, atalhos, meta, grupos e configurações. A barra inferior pertence ao grupo aberto: Refeições, Detalhes, Ranking e Chat. No desktop, os acessos gerais ficam em uma coluna lateral rolável. Veja `navigation.md`.

Criar grupo funciona como demonstração local: nome e descrição são validados, o grupo aparece na sessão e a pessoa é identificada como administradora. Membros, convites, sincronização e persistência dos grupos ainda dependem do backend.
