# Flyball Planner
## GraphQL API

This is the GraphQL API server for the Flyball Planner application. It provides a modern, type-safe API for managing flyball practices, dogs, owners, and clubs.

## TODO
- Redis caching (mostly for subscriptions with multiple instances)


## Features

- GraphQL API with Apollo Server
- PostgreSQL database with TypeORM
- TypeScript for type safety
- Full CRUD operations for all entities
- Real-time updates through subscriptions

## Prerequisites

- Node.js 18 or later
- PostgreSQL 12 or later
- npm or yarn

## Setup

```
1. (optional) Standup a PostgreSQL container for this:
```bash
docker-compose up
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in this directory with the following content:
```
NODE_ENV=development
PORT=4000
DB_HOST=localhost
DB_PORT=5432
DB_USER=flyball_user
DB_PASSWORD=flyball_password
DB_NAME=flyball_practice_planner
DB_SSLMODE=disable
USER_INVITE_EXPIRATION_DAYS=7

4. Seed the initial data:
```bash
npm run seed
```

5. Start the development server:
```bash
npm run dev
```

The server will start at http://localhost:4000 with the GraphQL playground available at http://localhost:4000/graphql.

## Development

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run seed` - Seed the initial test data
- `npm start` - Start production server
- `npm test` - Run tests

## Configuration

### Environment Variables

- `USER_INVITE_EXPIRATION_DAYS` - Number of days user invites remain valid (default: 7)

## API Documentation

The GraphQL API provides the following main types:

- Dog
- Owner
- Club
- Practice
- PracticeAttendance
- Set
- SetDog
- Auth/Users
- UserInvite

Each type has corresponding queries and mutations for CRUD operations. Visit the GraphQL playground at http://localhost:4000/graphql for the full schema documentation and to test queries.
