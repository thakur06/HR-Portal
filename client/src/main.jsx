import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { Auth0Provider } from "@auth0/auth0-react";
import { AuthProvider } from "./Context/AuthContext.jsx";
import { ApolloClientProvider } from "../src/apolloClient.jsx";
createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <Auth0Provider
      domain={import.meta.env.AUTH_DOMAIN}
      clientId={import.meta.env.AUTH_CLIENT}
      authorizationParams={{
        redirect_uri: window.location.origin,
      }}
    >
      <ApolloClientProvider>
        <App />
      </ApolloClientProvider>
    </Auth0Provider>
  </AuthProvider>
);
