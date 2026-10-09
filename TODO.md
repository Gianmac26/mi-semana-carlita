# TODO — Deudas técnicas y mejoras pendientes

## UX

- **Pantalla de bienvenida (`no-profile-first`):** El botón "Tengo un código de invitación" debería ser más prominente que "Entrar como papá/mamá" cuando ya existen otras familias. Actualmente el botón rosa grande aparece primero; la mayoría de usuarios nuevos (Andrea, Carlita) necesitarán el código, no la creación de familia.

- **Nombre de familia en onboarding:** El nombre está hardcodeado como `'Mi familia'` en `/api/onboard`. Permitir que el padre lo personalice durante el onboarding (campo de texto adicional en la pantalla de bienvenida).

- **GoldenRulesEditor — truncado de texto:** Los botones ▲▼🗑 ocupan espacio y el texto de la regla se trunca en pantallas pequeñas. Opciones: (a) botones en una fila aparte debajo del texto, (b) iconos más pequeños, (c) menú contextual ⋮ en vez de 3 botones.
