import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(() =>
    client.get('/auth/me').then(({ data }) => setUser(data.user)).catch(() => setUser(null)),
    []
  );

  useEffect(() => {
    fetchMe().finally(() => setLoading(false));

    // Listen for profile updates from ProfilePage
    const handler = () => fetchMe();
    window.addEventListener('profile-updated', handler);
    return () => window.removeEventListener('profile-updated', handler);
  }, [fetchMe]);

  const login = async credentials => {
    const { data } = await client.post('/auth/login', credentials);
    setUser(data.user);
  };

  const logout = async () => {
    await client.post('/auth/logout');
    setUser(null);
  };

  const switchRole = async (role) => {
    const { data } = await client.patch('/auth/role', { role });
    setUser(data.user);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, switchRole, refreshUser: fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
