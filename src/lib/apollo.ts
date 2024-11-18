// Core Apollo imports
import { ApolloClient, InMemoryCache, createHttpLink, gql } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { supabase } from './supabase'

// Setup GraphQL endpoint using Supabase URL
const httpLink = createHttpLink({
  uri: `${import.meta.env.VITE_SUPABASE_URL}/graphql/v1`,
})

// Handle auth token injection for authenticated requests
const authLink = setContext(async (_, { headers }) => {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token

  return {
    headers: {
      ...headers,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      authorization: token ? `Bearer ${token}` : '',
    }
  }
})

// Initialize Apollo Client with auth and caching config
export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
  connectToDevTools: true,
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'network-only', // Always fetch fresh data
    },
  },
})

// Debug query to fetch all available types and fields
apolloClient
  .query({
    query: gql`
      query IntrospectionQuery {
        __schema {
          types {
            name
            fields {
              name
            }
          }
        }
      }
    `,
  })
  .then((result) => {
    console.log('Available GraphQL Schema:', result.data.__schema.types);
  })
  .catch((error) => {
    console.error('GraphQL Schema Error:', error);
  });

// Debug query to fetch available mutations
apolloClient
  .query({
    query: gql`
      query GetSchema {
        __schema {
          mutationType {
            fields {
              name
              description
            }
          }
        }
      }
    `,
  })
  .then((result) => {
    console.log('Available Mutations:', result.data.__schema.mutationType.fields);
  })
  .catch((error) => {
    console.error('Schema Error:', error);
  }); 