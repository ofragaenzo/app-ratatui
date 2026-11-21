# Configurações do aplicativo

Acesso pelo ícone de engrenagem no cabeçalho, pela navegação lateral no desktop ou por **Perfil → Configurações**.

| Opção | Efeito |
| --- | --- |
| Tema | Claro, escuro ou seguindo o sistema; afeta telas, janelas e navegação. |
| Idioma | Português, inglês ou espanhol; muda a interface, datas e textos dos exemplos. Legendas digitadas pela pessoa são preservadas. |
| Feed inicial | Grupo ou refeições pessoais ao abrir o app. |
| Feed compacto | Reduz a altura das fotos no feed. |
| Feedback nas refeições | Mostra ou oculta o bloco de feedback em cada publicação. |
| Tamanho do texto | Padrão ou ampliado em 18%. |
| Reduzir animações | Remove o deslizamento das folhas modais. |
| Restaurar preferências | Retorna às opções iniciais depois de confirmação na interface, sem afetar refeições. |

As escolhas são aplicadas imediatamente e gravadas de forma local com AsyncStorage. No navegador, valem para aquele navegador e endereço; no aplicativo nativo, para a instalação no dispositivo. Não há sincronização de preferências entre contas ou dispositivos.

## Implementação

- `preferences.tsx`: valida campos conhecidos, mantém o estado compartilhado, serializa gravações e informa falhas de armazenamento.
- `theme.ts` e `styles.ts`: paletas claras/escuras e estilos derivados das preferências.
- `i18n.tsx`: traduções da interface existente e interpolação de variáveis.
- `SettingsScreen.tsx`: controles agrupados, nomes acessíveis, estado de gravação e restauração.

A interface aguarda a primeira leitura antes de habilitar as telas. Se uma gravação falhar, as escolhas ainda funcionam na sessão e o app oferece uma nova tentativa. Restaurar modifica apenas a chave de preferências do app.

Referências técnicas: [React Native — useColorScheme](https://reactnative.dev/docs/usecolorscheme), [AsyncStorage — uso](https://react-native-async-storage.github.io/2.0/Usage/).
