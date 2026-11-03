# Clinic Booking Web (Angular)

Angular 22 app (standalone components, signals, `rxResource`, reactive forms). See the [root README](../README.md).

```bash
npm install
npm start          # http://localhost:4200, proxies /api to http://localhost:3000
npm test           # unit tests (Vitest)
npm run build      # production build in dist/
```

- `src/app/core`: API service, models, date/price helpers, calendar grid (pure functions, unit tested)
- `src/app/shared`: icon, treatment card, image fallback
- `src/app/pages`: one folder per route
- Design tokens live in `src/styles.css` and match the "Hana" variables in Figma.
- For a deployed API, set `apiBaseUrl` in `src/environments/environment.production.ts`.
"# hana-clinic-booking" 
