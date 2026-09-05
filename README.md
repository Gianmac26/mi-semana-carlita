# Mi Semana — Carlita

Tracker semanal de responsabilidades para Carlita. Visible por toda la familia sin login.

## Correr localmente

```bash
npm install
npm run dev
```

Abre http://localhost:3000

## Variables de entorno

Crea `.env.local` con:

```
JSONBIN_API_KEY=tu_master_key_de_jsonbin
JSONBIN_BIN_ID=tu_bin_id
```

En Vercel estas variables se configuran en **Settings → Environment Variables**.

## Stack

- Next.js 14 (App Router) · TypeScript · React
- JSONBin.io como base de datos en la nube
- Sin autenticación — cualquiera con el link puede ver y marcar
