import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { config } from 'dotenv';
import { buildSchema } from 'type-graphql';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import express from 'express';
import cors from 'cors';
import { AppDataSource } from './db';
import { DogResolver } from './resolvers/DogResolver';
import { HandlerResolver } from './resolvers/HandlerResolver';
import { ClubResolver } from './resolvers/ClubResolver';
import { PracticeResolver } from './resolvers/PracticeResolver';
import { PracticeAttendanceResolver } from './resolvers/PracticeAttendanceResolver';
import { LocationResolver } from './resolvers/LocationResolver';
import { PracticeSetResolver } from './resolvers/PracticeSetResolver';
import { ClubSubscriptionResolver } from './resolvers/ClubSubscriptionResolver';
import { PracticeSubscriptionResolver } from './resolvers/PracticeSubscriptionResolver';
import { UserResolver } from './resolvers/UserResolver';
import { pubsub } from './services/PubSubService';
import { AuthContext, isAuth } from './middleware/auth';

config();

async function startServer() {
  try {
    await AppDataSource.initialize();
    console.log('Database connection established');

    const app = express();
    const httpServer = createServer(app);

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
        PracticeSubscriptionResolver,
        UserResolver,
      ],
      emitSchemaFile: true,
      validate: false,
      pubSub: pubsub,
    });

    const wsServer = new WebSocketServer({
      server: httpServer,
      path: '/subscriptions',
    });

    const serverCleanup = useServer({
      schema,
      context: async (ctx) => {
        const token = (ctx.connectionParams?.authorization as string) || (ctx.connectionParams?.token as string);

        if (token) {
          try {
            const { AuthService } = await import('./services/AuthService.js');
            const decoded = AuthService.verifyToken(token);

            if (decoded) {
              const user = await AuthService.getUserById(decoded.id);
              if (user) {
                return {
                  ...ctx,
                  pubsub,
                  user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    clubIds: user.clubs.map(club => club.id)
                  }
                };
              }
            }
          } catch (error) {
            console.error('WebSocket authentication error:', error);
          }
        }

        return {
          ...ctx,
          pubsub,
        };
      },
    }, wsServer);

    const server = new ApolloServer<AuthContext>({
      schema,
      plugins: [
        ApolloServerPluginDrainHttpServer({ httpServer }),
        {
          async serverWillStart() {
            return {
              async drainServer() {
                await serverCleanup.dispose();
              },
            };
          },
        },
      ],
    });

    await server.start();

    app.use(
      '/graphql',
      cors<cors.CorsRequest>({
        origin: process.env.NODE_ENV === 'development' ? '*' : false,
        credentials: true,
      }),
      express.json(),
      expressMiddleware(server, {
        context: async ({ req }) => ({
          req,
          dataSource: AppDataSource,
        }),
      }),
    );

    await new Promise<void>((resolve) => httpServer.listen({ port: Number(process.env.PORT) || 4000 }, resolve));
    console.log(`🚀 Server ready at http://localhost:${process.env.PORT || 4000}`);
    console.log(`🔌 WebSocket server ready at ws://localhost:${process.env.PORT || 4000}/subscriptions`);
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

startServer();
