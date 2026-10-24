import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { authClient } from "../lib/auth";

const queryClient = new QueryClient();

interface ProviderProps {
  children: React.ReactNode;
}

// App-level providers. Also completes the Google (managed auth) redirect sign-in.
export function Provider({ children }: ProviderProps) {
  useEffect(() => {
    authClient.managedAuth
      .handleRedirect()
      .then(() => queryClient.invalidateQueries())
      .catch(() => {});
  }, []);
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
