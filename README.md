InvestoPaper monorepo

Overview
This repo contains a minimal backend and frontend for an AI-assisted paper trading and news copilot app.

File tree
.
├── backend
│   ├── Dockerfile
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend
│   ├── Dockerfile
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── src
│   │   ├── App.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── vite.config.js
├── docker-compose.yml
└── .gitignore

Local run instructions
Backend
1) cd backend
2) cp .env.example .env
   - Keep DATABASE_URL empty unless you have a running PostgreSQL instance.
3) npm install
4) npm run dev

Frontend
1) cd frontend
2) cp .env.example .env
   - Default backend URL is http://localhost:4000.
3) npm install
4) npm run dev

Docker compose
1) docker compose up --build
2) open http://localhost:5173

Troubleshooting
- If you see "Failed to fetch" in the frontend, verify backend is running on port 4000 and frontend .env points to http://localhost:4000.
- If your browser console shows requests like `:4000/health`, your frontend backend URL is malformed. Set `VITE_BACKEND_URL` or `REACT_APP_API_BASE_URL` to `http://localhost:4000` (or just `localhost:4000`).
- The Docker frontend now serves the built app with `vite preview`, so you should no longer see hot-reload ping errors to `http://localhost:5173/` from Vite's dev client.
- If you see `getaddrinfo ENOTFOUND host` in backend logs, your DATABASE_URL is still using a placeholder host.
