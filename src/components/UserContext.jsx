import { createContext, useContext } from 'react';

/**
 * Shared user context — populated once by Layout.jsx.
 * Child pages read from this instead of making their own /current-user calls.
 */
export const UserContext = createContext(null);

export const useUser = () => useContext(UserContext);
