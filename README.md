# Riftly

Riftly is a modern platform for following competitive League of Legends.
Explore upcoming and live matches, discover teams and players, and make
better-informed predictions through clear, data-driven insights.

The project is designed for an international audience, with a focus on a
fast, accessible and engaging experience for esports fans.

## Highlights

- Browse upcoming, live and completed matches
- Discover teams, rosters and players
- Compare recent form and match history
- Get statistical match predictions with transparent reasoning
- Create an account and save favorite teams
- Share your own match predictions
- Follow live match updates in real time
- Switch between light and dark themes

## Technology

- **Frontend:** Nuxt 4, Vue, TypeScript and Pinia
- **Backend:** Node.js, Express, TypeScript and Prisma
- **Database:** PostgreSQL
- **Real-time updates:** WebSockets
- **Local development:** Docker Compose

## Project Layout

```text
Riftly/
├── backend/       # API, authentication, data access and real-time events
├── frontend/      # Nuxt application and user interface
├── docker-compose.yml
└── .env.example
```

## Getting Started

### Requirements

- Node.js 20 or later
- npm
- A PostgreSQL database configured for the project

### Run locally

1. Create a local environment file from `.env.example` and fill in the
  required values.

  ```bash
  cp .env.example .env
  ```

2. Install and start the backend:

  ```bash
  cd backend
  npm install
  npm run prisma:generate
  npm run prisma:migrate:deploy
  npm run dev
  ```

3. In a second terminal, install and start the frontend:

  ```bash
  cd frontend
  npm install
  npm run dev
  ```

The frontend runs on `http://localhost:3000` and the API runs on
`http://localhost:4000` by default.

### Security migration deployment

Before applying the session migration in production, create a PostgreSQL backup:

```bash
pg_dump -Fc -d "$DATABASE_URL" -f riftdata-before-sessions.dump
```

Then deploy the additive migration and restart the application through the
normal release process (these commands are not run automatically):

```bash
cd backend
npm run prisma:migrate:deploy
npm run prisma:generate
```

All existing users and data are preserved. Existing JWTs without a `sid` are
rejected after deployment and users must sign in again. To roll back the
application, redeploy the previous application version; keep the new
`web_sessions` table in place unless a database rollback has been reviewed.

### Run with Docker

```bash
docker compose up --build
```

The Docker setup exposes the frontend on `http://localhost:5173` and the API
on `http://localhost:4000`.

## Development Commands

From `backend/`:

```bash
npm run dev       # Start the development server
npm run build     # Build the API
npm start         # Run the production build
```

From `frontend/`:

```bash
npm run dev       # Start the Nuxt development server
npm run build     # Build the production application
npm run preview   # Preview the production build
```

## Status

Riftly is actively being developed. The current focus is building a polished
core experience for discovering matches, teams and players, while expanding
prediction features and international coverage.

## Contributing

Contributions, ideas and feedback are welcome. Please keep changes focused,
use clear commit messages and make sure the affected application builds before
opening a pull request.
