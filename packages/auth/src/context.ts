import { createContext } from 'react-router';

// User context to share authenticated user data between middleware and loaders
export const userContext = createContext<{
    id: string;
    email: string;
    name: string;
    role: string;
} | null>(null);
