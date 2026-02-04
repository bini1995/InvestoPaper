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
3) npm install
4) npm run dev

Frontend
1) cd frontend
2) cp .env.example .env
3) npm install
4) npm run dev

Docker compose
1) docker compose up --build
2) open http://localhost:5173
