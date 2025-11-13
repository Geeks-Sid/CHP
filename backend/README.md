# Hospital Management System - Backend

NestJS backend with Fastify adapter, PostgreSQL, and comprehensive RBAC.

## Tech Stack

- **Framework**: NestJS with Fastify adapter
- **Database**: PostgreSQL (raw SQL via `pg`, no ORM)
- **Auth**: JWT (access + refresh tokens)
- **Validation**: Zod + class-validator
- **Logging**: Pino
- **Testing**: Jest + Testcontainers

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Docker & Docker Compose (for local development)

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
```

### Database Setup

```bash
# Start PostgreSQL, Redis, and MinIO
cd ../database
docker-compose up -d

# Run migrations (manual for now)
# Connect to PostgreSQL and run files in database/migrations/ in order
```

### Development

```bash
# Start in development mode
npm run start:dev

# The API will be available at http://localhost:3000
# Health check: http://localhost:3000/api/v1/health
# Readiness: http://localhost:3000/api/v1/ready
```

## Project Structure

```
src/
├── main.ts                 # Application entry point
├── app.module.ts          # Root module
├── config/                # Configuration
│   └── configuration.ts   # Zod-validated config
├── common/                # Shared utilities
│   ├── filters/           # Exception filters
│   ├── middleware/         # Request middleware
│   └── logger/            # Pino logger config
├── database/              # Database module
│   ├── database.module.ts
│   └── database.service.ts
├── health/                # Health check endpoints
└── utils/                 # Utility functions
```

## API Endpoints

### Health
- `GET /api/v1/health` - Liveness probe
- `GET /api/v1/ready` - Readiness probe (checks DB)

## Environment Variables

See `.env.example` for all available configuration options.

Key variables:
- `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD` - Database connection
- `JWT_SECRET` - Must be at least 32 characters
- `JWT_ACCESS_TTL` - Access token TTL in seconds (default: 900)
- `JWT_REFRESH_TTL` - Refresh token TTL in seconds (default: 604800)
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production/test)

## Scripts

- `npm run start` - Start production server
- `npm run start:dev` - Start development server with watch
- `npm run start:debug` - Start with debugger
- `npm run build` - Build for production
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run e2e tests
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier

## Database Migrations

Migrations are located in `../database/migrations/` and follow Flyway naming:
- `V000__extensions_and_baseline.sql`
- `V001__roles_permissions.sql`
- `V002__users.sql`
- ... (through V012)

Run migrations manually or use a migration tool like Flyway or node-pg-migrate.

## Next Steps

1. ✅ Foundation & Infrastructure (Phase 1) - **COMPLETED**
2. ⏳ Authentication & Authorization (Phase 2)
3. ⏳ Users Management (Phase 3)
4. ⏳ Patients Management (Phase 4)
5. ⏳ ... (see `.temp/implementation-plan.md` for full roadmap)

## License

Private - Internal use only

