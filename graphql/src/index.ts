import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { config } from 'dotenv';
import { buildSchema } from 'type-graphql';
import { AppDataSource } from './db';
import { DogResolver } from './resolvers/DogResolver';
import { HandlerResolver } from './resolvers/HandlerResolver';
import { ClubResolver } from './resolvers/ClubResolver';
import { PracticeResolver } from './resolvers/PracticeResolver';
import { PracticeAttendanceResolver } from './resolvers/PracticeAttendanceResolver';

config();

async function startServer() {
  try {
    await AppDataSource.initialize();
    console.log('Database connection established');

    const schema = await buildSchema({
      resolvers: [
        ClubResolver,
        DogResolver,
        HandlerResolver,
        PracticeResolver,
        PracticeAttendanceResolver,
      ],
      emitSchemaFile: true,
      validate: false,
    });

    const server = new ApolloServer({
      schema
    });

    const { url } = await startStandaloneServer(server, {
      listen: { port: Number(process.env.PORT) || 4000 },
      context: async ({ req, res }) => {
        if (process.env.NODE_ENV === 'development') {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Credentials', 'true');
          res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        }
        return {};
      }
    });

    console.log(`🚀 Server ready at ${url}`);
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

startServer();
