import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { config } from 'dotenv';
import { buildSchema } from 'type-graphql';
import { AppDataSource } from './db';
import { DogResolver } from './resolvers/DogResolver';
import { OwnerResolver } from './resolvers/OwnerResolver';

config();

async function startServer() {
  try {
    // Initialize database connection
    await AppDataSource.initialize();
    console.log('Database connection established');

    // Build TypeGraphQL schema
    const schema = await buildSchema({
      resolvers: [DogResolver, OwnerResolver],
      emitSchemaFile: true,
      validate: false,
    });

    // Create Apollo Server
    const server = new ApolloServer({
      schema,
    });

    // Start the server
    const { url } = await startStandaloneServer(server, {
      listen: { port: Number(process.env.PORT) || 4000 },
    });

    console.log(`🚀 Server ready at ${url}`);
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

startServer();
