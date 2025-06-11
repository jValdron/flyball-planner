# Flyball Practice Planner GraphQL API

This is the GraphQL API server for the Flyball Practice Planner application. It provides a modern, type-safe API for managing flyball practices, dogs, owners, and clubs.

## Features

- GraphQL API with Apollo Server
- PostgreSQL database with TypeORM
- TypeScript for type safety
- Full CRUD operations for all entities
- Real-time updates (coming soon)

## Prerequisites

- Node.js 18 or later
- PostgreSQL 12 or later
- npm or yarn

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with the following content:
```
PORT=4000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/flyball_practice_planner
NODE_ENV=development
```

3. Create the database:
```bash
createdb flyball_practice_planner
```

4. Start the development server:
```bash
npm run dev
```

The server will start at http://localhost:4000 with the GraphQL playground available at http://localhost:4000/graphql.

## Development

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests

## API Documentation

The GraphQL API provides the following main types:

- Dog
- Owner
- Club
- Practice
- PracticeAttendance
- Set
- SetDog

Each type has corresponding queries and mutations for CRUD operations. Visit the GraphQL playground at http://localhost:4000/graphql for the full schema documentation and to test queries.

## License

MIT
