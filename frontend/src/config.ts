const GRAPHQL_BASE_URL = import.meta.env.VITE_GRAPHQL_BASE_URL || 'http://localhost:4000'

export const config = {
  graphqlBaseUrl: GRAPHQL_BASE_URL,
  endpoints: {
    dogs: `${GRAPHQL_BASE_URL}/api/dogs`,
    clubs: `${GRAPHQL_BASE_URL}/api/clubs`,
    owners: `${GRAPHQL_BASE_URL}/api/owners`,
    practices: `${GRAPHQL_BASE_URL}/api/practices`,
    attendance: `${GRAPHQL_BASE_URL}/api/clubs/{clubID}/practices/{practiceID}/attendance`
  }
}
