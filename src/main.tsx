import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import './index.css'
import App from './App.tsx'
import { ApolloProvider } from "@apollo/client";
import { apolloClient } from "./lib/apollo.ts";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
    <ApolloProvider client={apolloClient} >
      <AuthProvider>
        <App />
      </AuthProvider>
      </ApolloProvider>
    </BrowserRouter>
  </StrictMode>,
)
