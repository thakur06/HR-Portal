import { ApolloClient, InMemoryCache, ApolloProvider, createHttpLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

// HTTP link to backend
const httpLink = createHttpLink({
  uri: "http://localhost:3001",
});

// Auth link uses localStorage for token
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem("token") || "";
  return {
    headers: {
      ...headers,
      Authorization: token ? `Bearer ${token}` : "",
    },
  };
});

// Initialize Apollo Client
const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

// Provider component
export const ApolloClientProvider = ({ children }) => (
  <ApolloProvider client={client}>{children}</ApolloProvider>
);