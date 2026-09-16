import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth, ProtectedRoute } from './context/AuthContext';

import Setup from './pages/Setup';
import Login from './pages/Login';
import AdminLayout from './pages/AdminLayout';
import Dashboard from './pages/Dashboard';
import { ClientesList, ClienteDetalhe } from './pages/Clientes';
import { EquipamentosList, EquipamentoForm, EquipamentoDetalhe } from './pages/Equipamentos';
import { OrdensList, NovaOSForm } from './pages/Ordens';
import OSDetalhe from './pages/OSDetalhe';
import Estoque from './pages/Estoque';
import { Relatorios, Garantias } from './pages/Relatorios';
import { Configuracoes, Perfil } from './pages/Configuracoes';
import { ClienteArea, ClienteOSDetalhe } from './pages/ClientePortal';

function SetupGate({ children }) {
  const { configured, loading } = useAuth();
  if (loading || configured === null) return null;
  if (configured) return <Navigate to="/login" replace />;
  return children;
}

function LoginGate({ children }) {
  const { session, configured, loading } = useAuth();
  if (loading || configured === null) return null;
  if (!configured) return <Navigate to="/setup" replace />;
  if (session) return <Navigate to={session.role === 'admin' ? '/' : '/area'} replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/setup" element={<SetupGate><Setup /></SetupGate>} />
          <Route path="/login" element={<LoginGate><Login /></LoginGate>} />

          <Route path="/area" element={<ProtectedRoute role="client"><ClienteArea /></ProtectedRoute>} />
          <Route path="/area/os/:id" element={<ProtectedRoute role="client"><ClienteOSDetalhe /></ProtectedRoute>} />

          <Route path="/" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="clientes" element={<ClientesList />} />
            <Route path="clientes/:id" element={<ClienteDetalhe />} />
            <Route path="equipamentos" element={<EquipamentosList />} />
            <Route path="equipamentos/novo" element={<EquipamentoForm />} />
            <Route path="equipamentos/:id" element={<EquipamentoDetalhe />} />
            <Route path="ordens" element={<OrdensList />} />
            <Route path="ordens/nova" element={<NovaOSForm />} />
            <Route path="ordens/:id" element={<OSDetalhe />} />
            <Route path="estoque" element={<Estoque />} />
            <Route path="garantias" element={<Garantias />} />
            <Route path="relatorios" element={<Relatorios />} />
            <Route path="perfil" element={<Perfil />} />
            <Route path="configuracoes" element={<Configuracoes />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
