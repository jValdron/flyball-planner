import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import { config } from 'dotenv';
import { buildSchema } from 'type-graphql';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/use/ws';
import type { Context } from 'graphql-ws';
import express from 'express';
import { AppDataSource } from './db';
import { DogResolver } from './resolvers/DogResolver';
import { HandlerResolver } from './resolvers/HandlerResolver';
import { ClubResolver } from './resolvers/ClubResolver';
import { PracticeResolver } from './resolvers/PracticeResolver';
import { PracticeAttendanceResolver } from './resolvers/PracticeAttendanceResolver';
import { LocationResolver } from './resolvers/LocationResolver';
import { PracticeSetResolver } from './resolvers/PracticeSetResolver';
import { ClubSubscriptionResolver } from './resolvers/ClubSubscriptionResolver';
import { pubsub } from './services/PubSubService';

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
        PracticeSetResolver,
        LocationResolver,
        ClubSubscriptionResolver,
      ],
      emitSchemaFile: true,
      validate: false,
      pubSub: pubsub as any,
    });

    const server = new ApolloServer({
      schema
    });

    await server.start();

    const app = express();

    if (process.env.NODE_ENV === 'development') {
      app.use((req, res, next) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, User-Agent, DNT, Cache-Control, X-Mx-ReqToken, Keep-Alive, X-Requested-With, If-Modified-Since');

        if (req.method === 'OPTIONS') {
          res.status(200).end();
          return;
        }

        next();
      });
    }

    app.use('/graphql', express.json(), expressMiddleware(server));

    const httpServer = createServer(app);

    const wsServer = new WebSocketServer({
      server: httpServer,
      path: '/graphql',
      verifyClient: (info: any) => {
        // Allow all origins for development
        return process.env.NODE_ENV === 'development';
      }
    });

    useServer(
      {
        schema,
        context: async (ctx) => {
          return { pubsub };
        },
        onConnect: (ctx: Context) => {
          console.log('Client connected to WebSocket');
        },
        onDisconnect: (ctx: Context) => {
          console.log('Client disconnected from WebSocket');
        },
      },
      wsServer
    );

    await new Promise<void>((resolve) => httpServer.listen({ port: Number(process.env.PORT) || 4000 }, resolve));
    console.log(`🚀 Server ready at http://localhost:${process.env.PORT || 4000}`);
    console.log(`🔌 WebSocket server ready at ws://localhost:${process.env.PORT || 4000}/graphql`);
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

startServer();
