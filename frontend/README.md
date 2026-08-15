# OpenMatch frontend

React/Vite client for the OpenMatch applicant and recruiter workflows.

## Development

```bash
npm install
npm run dev
```

The app runs at `http://127.0.0.1:5173` by default.

For API-backed analysis, run the FastAPI backend on `http://127.0.0.1:8000`. The sample applicant flow can be opened without the backend.

## Checks

```bash
npm run lint
npm run build
```

Most application code lives under `src/`:

- `components/` — UI components
- `data/` — local/sample data
- `hooks/` — reusable React hooks
- `services/` — API/client services
