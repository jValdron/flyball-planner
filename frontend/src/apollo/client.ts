import { ApolloClient, InMemoryCache, createHttpLink, split, from } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';

// Create auth link to add token to headers
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('authToken');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    }
  };
});

// Create error link to handle auth errors
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      );

      if (message.includes('Not authenticated') || message.includes('Invalid token')) {
        if (operation.operationName !== 'LoginUser') {
          localStorage.removeItem('authToken');
          window.location.href = '/login';
        }
      }
    });
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
  }
});

const httpLink = createHttpLink({
  uri: 'http://localhost:4000/graphql',
});

// Create WebSocket client with authentication
const createWsClient = () => {
  return createClient({
    url: 'ws://localhost:4000/subscriptions',
    connectionParams: () => ({
      authorization: (localStorage.getItem('authToken') ? `Bearer ${localStorage.getItem('authToken')}` : ''),
    }),
    on: {
        connecting: () => {
          if (process.env.NODE_ENV === 'development') {
            console.log('WebSocket: Connecting...');
          }
        },
        connected: () => {
          if (process.env.NODE_ENV === 'development') {
            console.log('WebSocket: Connected successfully');
          }
        },
        closed: () => {
          if (process.env.NODE_ENV === 'development') {
            console.log('WebSocket: Connection closed');
          }
        },
        error: (error) => {
          if (process.env.NODE_ENV === 'development') {
            console.error('WebSocket error:', error);
          }
        },
      },
    retryAttempts: 3,
    retryWait: async (retries) => {
      const delay = Math.min(1000 * 2 ** retries, 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
    },
    lazyCloseTimeout: 5000,
    disablePong: false,
  });
};

let wsClient = createWsClient();

// Close current socket so next activity reconnects and pulls fresh connectionParams
export const recreateWsClient = () => {
  try {
    wsClient.dispose();
  } catch (e) {
    // ignore
  }
  return wsClient;
};

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
  from([errorLink, authLink, httpLink])
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
  connectToDevTools: process.env.NODE_ENV === 'development',
});

export { wsClient };
