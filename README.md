# Task Manager System

This project is now set up to be deployment-ready for container-based hosting.

## Stack

- Frontend: Next.js
- Backend: Express + TypeScript + Prisma
- Database: MySQL

## Production readiness added

- Dockerfile for the frontend
- Dockerfile for the backend
- Root `docker-compose.yml` for local production-style startup
- Backend production scripts: `build`, `start`, `prisma:migrate:deploy`
- Frontend standalone Next.js build config
- Environment variable templates for frontend and backend
- Health endpoint: `GET /health`

## Environment variables

Backend: copy [backend/.env.example](/Users/ishantsingh7388/Desktop/task-manager-system/backend/.env.example) to `backend/.env`

Important values:

- `DATABASE_URL`
- `JWT_SECRET`
- `FRONTEND_URL`
- `PORT`

Frontend: copy [frontend/.env.example](/Users/ishantsingh7388/Desktop/task-manager-system/frontend/.env.example) to `frontend/.env`

Important values:

- `NEXT_PUBLIC_API_URL`

## Local production-style run

From the project root:

```bash
docker compose up --build
```

App URLs:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`
- Backend health check: `http://localhost:3001/health`

## Manual production build

Backend:

```bash
cd backend
npm ci
npm run prisma:generate
npm run build
npm run prisma:migrate:deploy
npm run start
```

Frontend:

```bash
cd frontend
npm ci
npm run build
npm run start
```

## Deployment notes

- The frontend expects `NEXT_PUBLIC_API_URL` at build time.
- The backend expects a reachable MySQL database before startup.
- Set a strong production `JWT_SECRET`.
- Set `FRONTEND_URL` to your deployed frontend domain so cookie-based auth works correctly.

## Suggested hosting split

- Frontend: Vercel or any Node-compatible container host
- Backend: Render, Railway, Fly.io, or any Node-compatible container host
- Database: managed MySQL or a MySQL container
