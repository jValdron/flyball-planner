import { ApolloClient, InMemoryCache, createHttpLink, split } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';

const httpLink = createHttpLink({
  uri: 'http://localhost:4000/graphql',
});

const wsClient = createClient({
  url: 'ws://localhost:4000/subscriptions',
  on: {
    connecting: () => {
      if (__DEV__) {
        console.log('WebSocket: Connecting...');
      }
    },
    connected: () => {
      if (__DEV__) {
        console.log('WebSocket: Connected successfully');
      }
    },
    closed: () => {
      if (__DEV__) {
        console.log('WebSocket: Connection closed');
      }
    },
    error: (error) => {
      if (__DEV__) {
        console.error('WebSocket error:', error);
      }
    },
  },
  connectionParams: {},
  retryAttempts: 3,
  retryWait: async (retries) => {
    const delay = Math.min(1000 * 2 ** retries, 10000);
    await new Promise(resolve => setTimeout(resolve, delay));
  },
  lazyCloseTimeout: 5000,
  disablePong: false,
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
    query: {
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
  connectToDevTools: __DEV__,
});

export { wsClient };
