# UTMS Frontend

React + TypeScript + Redux Toolkit frontend for the UTMS workflow demo.

## Current Status

- Student, OIDB, YDYO, YGK, and Intibak flows are wired to the Spring Boot backend.
- Production frontend build passes.
- Backend Docker image builds successfully.
- Full Docker demo stack is configured with Postgres, backend, and frontend.
- Frontend proxies `/api`, `/swagger-ui`, and `/v3/api-docs` through Nginx to the backend container.

## Docker Demo Run

Run these commands from the workspace root:

```powershell
cd C:\Users\BARIS\Desktop\Okul\316\ImplementationPlan
docker compose up -d --build
docker compose ps
```

Open:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8080`
- Swagger via frontend proxy: `http://localhost:5173/swagger-ui/index.html`
- Raw OpenAPI JSON via frontend proxy: `http://localhost:5173/v3/api-docs`

Stop the stack:

```powershell
cd C:\Users\BARIS\Desktop\Okul\316\ImplementationPlan
docker compose down
```

Stop the stack and remove volumes:

```powershell
cd C:\Users\BARIS\Desktop\Okul\316\ImplementationPlan
docker compose down -v
```

Show logs:

```powershell
cd C:\Users\BARIS\Desktop\Okul\316\ImplementationPlan
docker compose logs -f
```

## Local Development Run

Frontend:

```powershell
cd C:\Users\BARIS\Desktop\Okul\316\ImplementationPlan\UTMS_Frontend
npm install
npm run dev
```

Backend:

```powershell
cd C:\Users\BARIS\Desktop\Okul\316\ImplementationPlan\UTMS_Backend
.\mvnw.cmd spring-boot:run
```

## Environment Notes

- Development frontend API base: `http://localhost:8080`
- Production frontend API base: `/api`
- Docker compose starts Postgres on `5432`, backend on `8080`, frontend on `5173`

## Validation Already Completed

- `npm run build` succeeded for the frontend
- `docker build -t utms-backend-demo .` succeeded for the backend
- `docker compose up -d --build` succeeded for the demo stack
- `http://localhost:5173` returned `200`
- `http://localhost:5173/v3/api-docs` returned `200`
