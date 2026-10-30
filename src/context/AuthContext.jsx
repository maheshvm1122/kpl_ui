import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authService } from '../services';
import { setUnauthorizedHandler, tokenStore } from '../services/api';
import { ROLES } from '../utils/constants';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(tokenStore.get()));
  const [sessionMessage, setSessionMessage] = useState('');

  const logout = useCallback((message = '') => {
    tokenStore.clear();
    setUser(null);
    setSessionMessage(message);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler((message) => logout(message));
    if (!tokenStore.get()) return;
    authService
      .me()
      .then((res) => setUser(res.data))
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, [logout]);

  const login = useCallback(async (username, password) => {
    const res = await authService.login(username, password);
    tokenStore.set(res.data.token);
    setUser(res.data.user);
    setSessionMessage('');
    return res.data.user;
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      sessionMessage,
      login,
      logout,
      isAdmin: user?.role === ROLES.ADMIN,
      isAuctioneer: user?.role === ROLES.AUCTIONEER,
    }),
    [user, loading, sessionMessage, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
