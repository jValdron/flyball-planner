import { ApolloClient, InMemoryCache, createHttpLink, split } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';

const httpLink = createHttpLink({
  uri: 'http://localhost:4000/graphql',
});

const wsClient = createClient({
  url: 'ws://localhost:4000/graphql',
  on: {
    connecting: () => {
      console.log('WebSocket: Connecting...');
    },
    connected: () => {
      console.log('WebSocket: Connected successfully');
    },
    closed: () => {
      console.log('WebSocket: Connection closed');
    },
    error: (error) => {
      console.error('WebSocket error:', error);
    },
  },
  connectionParams: {
    // Add any auth headers if needed
  },
  retryAttempts: 3,
  retryWait: async (retries) => {
    const delay = Math.min(1000 * 2 ** retries, 10000);
    await new Promise(resolve => setTimeout(resolve, delay));
  },
});

const wsLink = new GraphQLWsLink(wsClient);

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLink
);

export const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});

export { wsClient };
