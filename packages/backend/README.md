# @task-assistant/backend

Express.js API server using Prisma ORM and PostgreSQL.

## Tech Stack

- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL (via Docker)
- **ORM**: Prisma
- **Validation**: Zod (shared with frontend)

## API Documentation

The API documentation is auto-generated using Swagger/OpenAPI.
Once the server is running, you can access the interactive documentation at:
**[http://localhost:3001/api-docs](http://localhost:3001/api-docs)**

## Environment

The backend runs on port `3001` in the Docker container.
It connects to the `postgres` service on the internal Docker network.

## Scripts

- `dev`: Run locally (requires running Postgres)
- `build`: Compile TypeScript
- `prisma generate`: Generate Prisma Client
