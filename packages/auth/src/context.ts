import { createContext } from "react-router";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

// User context to share authenticated user data between middleware and loaders
export const userContext = createContext<AuthUser | null>(null);
