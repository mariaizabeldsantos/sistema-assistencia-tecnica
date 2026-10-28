import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import api, { API_URL } from '../api/client';

const AuthContext = createContext(null);

function Aviso({ titulo, texto, detalhe, onRetry }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="card" style={{ maxWidth: 440, width: '100%', textAlign: 'center' }}>
        <div className="disp" style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>{titulo}</div>
        <p className="dim" style={{ fontSize: 14 }}>{texto}</p>
        {detalhe && <p className="dim" style={{ fontSize: 12, wordBreak: 'break-all' }}>{detalhe}</p>}
        {onRetry && <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={onRetry}>Tentar novamente</button>}
      </div>
    </div>
  );
}

export function AuthProvider({ children }) {
  const [session, setSessionState] = useState(() => {
    const raw = localStorage.getItem('at_session');
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(null);
  const [setupTokenRequired, setSetupTokenRequired] = useState(false);
  const [apiError, setApiError] = useState(false);

  // Pergunta à API se já existe administrador. Se a API não responder (ex.: serviço
  // gratuito ainda "acordando"), tenta de novo; NUNCA assume que o sistema está
  // configurado só porque a chamada falhou.
  const checkStatus = useCallback(async () => {
    setLoading(true); setApiError(false);
    for (let tentativa = 0; tentativa < 8; tentativa++) {
      try {
        const r = await api.get('/auth/status');
        setConfigured(!!r.data.configured);
        setSetupTokenRequired(!!r.data.setupTokenRequired);
        setLoading(false);
        return;
      } catch (e) {
        if (e.response && e.response.status < 500) break; // resposta real da API, não é "dormindo"
        await new Promise((res) => setTimeout(res, 5000));
      }
    }
    setApiError(true);
    setLoading(false);
  }, []);

  useEffect(() => { checkStatus(); }, [checkStatus]);

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
    <AuthContext.Provider value={{ session, loading, configured, setupTokenRequired, login, setup, logout }}>
      {loading ? (
        <Aviso titulo="Conectando ao servidor…" texto="Na primeira abertura o servidor gratuito pode levar até 1 minuto para acordar." />
      ) : apiError ? (
        <Aviso
          titulo="Servidor indisponível"
          texto="Não foi possível se conectar à API do sistema. Isto não significa que o login está errado."
          detalhe={`Endereço da API usado por este site: ${API_URL}`}
          onRetry={checkStatus}
        />
      ) : children}
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
