# SUGAM — Sustainable Resource Exchange

React + Vite prototype built around the supplied `App.jsx`.

## Requirements
- Node.js 18+ (Node.js 20+ recommended)
- npm

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, normally:

`http://localhost:5173`

## Production build

```bash
npm run build
npm run preview
```

## Project structure

- `index.html` — browser entry point
- `src/main.jsx` — React bootstrap
- `src/App.jsx` — supplied SUGAM application
- `vite.config.js` — Vite + React configuration
- `package.json` — dependencies and scripts

The application stores prototype state in browser `localStorage`, as implemented by the supplied JSX. External QR-code generation and Google Maps links are also used by the existing prototype.
