import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSessionState] = useState(() => {
    const raw = localStorage.getItem('at_session');
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(null);

  useEffect(() => {
    api.get('/auth/status')
      .then((r) => setConfigured(r.data.configured))
      .catch(() => setConfigured(true))
      .finally(() => setLoading(false));
  }, []);

  const applySession = useCallback((data) => {
    const sess = {
      userId: data.userId, role: data.role, clientId: data.clientId || null, name: data.name,
    };
    localStorage.setItem('at_token', data.access_token);
    localStorage.setItem('at_session', JSON.stringify(sess));
    setSessionState(sess);
  }, []);

  const login = useCallback(async (email, senha) => {
    const r = await api.post('/auth/login', { email, senha });
    applySession(r.data);
    return r.data;
  }, [applySession]);

  const setup = useCallback(async (payload) => {
    const r = await api.post('/auth/setup', payload);
    applySession(r.data);
    setConfigured(true);
    return r.data;
  }, [applySession]);

  const logout = useCallback(() => {
    localStorage.removeItem('at_token');
    localStorage.removeItem('at_session');
    setSessionState(null);
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading, configured, login, setup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

// Bloqueia o acesso a uma rota se ninguém estiver logado (ou se o papel
// logado não for o esperado). Fica neste arquivo porque só usa dados que já
// vêm do próprio AuthContext — não precisa de um arquivo à parte.
export function ProtectedRoute({ children, role }) {
  const { session, loading, configured } = useAuth();
  if (loading || configured === null) return null;
  if (!configured) return <Navigate to="/setup" replace />;
  if (!session) return <Navigate to="/login" replace />;
  if (role && session.role !== role) return <Navigate to={session.role === 'admin' ? '/' : '/area'} replace />;
  return children;
}
