import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Wrench, LayoutDashboard, Users, Laptop, ClipboardList, Package, ShieldCheck, BarChart3, Settings, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ITEMS = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/clientes', icon: Users, label: 'Clientes' },
  { path: '/equipamentos', icon: Laptop, label: 'Equipamentos' },
  { path: '/ordens', icon: ClipboardList, label: 'Ordens de Serviço' },
  { path: '/estoque', icon: Package, label: 'Estoque' },
  { path: '/garantias', icon: ShieldCheck, label: 'Garantias' },
  { path: '/relatorios', icon: BarChart3, label: 'Relatórios' },
];

export default function AdminLayout() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function isActive(path) {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  }

  return (
    <div className="row" style={{ minHeight: '100vh', alignItems: 'stretch' }}>
      <div className="col" style={{ width: 220, borderRight: '1px solid var(--border)', padding: '18px 12px', flexShrink: 0 }}>
        <div className="row gap8" style={{ padding: '0 10px 20px' }}>
          <Wrench size={18} color="var(--accent)" />
          <span className="disp" style={{ fontWeight: 700, fontSize: 14.5 }}>Assistência</span>
        </div>
        <div className="col gap4">
          {ITEMS.map((it) => (
            <div key={it.path} className={'navitem' + (isActive(it.path) ? ' active' : '')} onClick={() => navigate(it.path)}>
              <it.icon size={16} />{it.label}
            </div>
          ))}
        </div>
        <div className="grow" />
        <div className="col gap4">
          <div className={'navitem' + (isActive('/perfil') ? ' active' : '')} onClick={() => navigate('/perfil')}><User size={16} />Meu perfil</div>
          <div className={'navitem' + (isActive('/configuracoes') ? ' active' : '')} onClick={() => navigate('/configuracoes')}><Settings size={16} />Configurações</div>
          <div className="navitem" onClick={() => { logout(); navigate('/login'); }}><LogOut size={16} />Sair</div>
        </div>
        <div className="dim" style={{ fontSize: 11.5, padding: '10px 10px 0' }}>{session?.name}</div>
      </div>
      <div className="grow" style={{ padding: '26px 32px', maxWidth: 1180 }}>
        <Outlet />
      </div>
    </div>
  );
}
