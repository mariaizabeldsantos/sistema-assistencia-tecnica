import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Wrench, LogOut, ClipboardList, CheckCircle2, XCircle } from 'lucide-react';
import api, { apiErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { PageHead, EmptyState, StatusBadge, OSTimeline, BackLink, Field, Toast } from '../components/common';
import { fmtDate, fmtDateTime, fmtBRL } from '../utils';

export function ClienteShell({ children }) {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div>
      <div className="row" style={{ justifyContent: 'space-between', padding: '14px 24px', borderBottom: '1px solid var(--border)' }}>
        <div className="row gap8" style={{ cursor: 'pointer' }} onClick={() => navigate('/area')}>
          <Wrench size={18} color="var(--accent)" />
          <span className="disp" style={{ fontWeight: 700 }}>Área do cliente</span>
        </div>
        <div className="row gap12">
          <span className="dim" style={{ fontSize: 13 }}>{session?.name}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => { logout(); navigate('/login'); }}><LogOut size={14} />Sair</button>
        </div>
      </div>
      <div style={{ padding: '24px', maxWidth: 900, margin: '0 auto' }}>{children}</div>
    </div>
  );
}

export function ClienteArea() {
  const navigate = useNavigate();
  const [ordens, setOrdens] = useState(null);

  useEffect(() => { api.get('/orders').then((r) => setOrdens(r.data)); }, []);
  if (!ordens) return null;

  return (
    <ClienteShell>
      <PageHead title="Minhas ordens de serviço" subtitle={`${ordens.length} registradas`} />
      {ordens.length === 0 ? <EmptyState icon={ClipboardList} text="Você ainda não possui ordens de serviço." /> : (
        <div className="col gap12">
          {[...ordens].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((o) => (
            <div key={o.id} className="card" style={{ cursor: 'pointer' }} onClick={() => navigate(`/area/os/${o.id}`)}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span className="mono ostag">OS #{o.numero}</span>
                <StatusBadge status={o.status} />
              </div>
              <div className="dim" style={{ fontSize: 12.5, marginTop: 8 }}>Aberta em {fmtDate(o.createdAt)}</div>
              {o.status === 'AGUARDANDO_APROVACAO' && <div style={{ marginTop: 8, color: 'var(--amber)', fontSize: 12.5, fontWeight: 600 }}>Orçamento aguardando sua aprovação</div>}
            </div>
          ))}
        </div>
      )}
    </ClienteShell>
  );
}

export function ClienteOSDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [toast, setToast] = useState(null);
  const [obs, setObs] = useState('');

  async function load() { const r = await api.get(`/orders/${id}`); setOrder(r.data); }
  useEffect(() => { load(); }, [id]);

  function notify(msg, kind = 'success') { setToast({ msg, kind }); setTimeout(() => setToast(null), 3500); }

  async function decidir(status) {
    try {
      await api.post(`/orders/${id}/aprovacao`, { status, observacao: obs });
      notify(status === 'aprovado' ? 'Orçamento aprovado! O reparo será iniciado em breve.' : 'Orçamento recusado.');
      load();
    } catch (e) { notify(apiErrorMessage(e), 'error'); }
  }

  if (!order) return null;
  const o = order.orcamento;

  return (
    <ClienteShell>
      <Toast toast={toast} />
      <BackLink onClick={() => navigate('/area')} label="Minhas ordens" />
      <PageHead title={`Ordem de serviço #${order.numero}`} action={<StatusBadge status={order.status} />} />
      {order.status !== 'CANCELADO' && <OSTimeline status={order.status} />}

      <div className="card" style={{ marginTop: 20 }}>
        <span className="disp" style={{ fontWeight: 700, fontSize: 14 }}>Problema relatado</span>
        <p style={{ fontSize: 13.5, marginTop: 8 }}>{order.problemaRelatado}</p>
      </div>

      {order.diagnostico?.diagnostico && (
        <div className="card" style={{ marginTop: 16 }}>
          <span className="disp" style={{ fontWeight: 700, fontSize: 14 }}>Diagnóstico técnico</span>
          <p style={{ fontSize: 13.5, marginTop: 8 }}>{order.diagnostico.diagnostico}</p>
          {order.diagnostico.solucao && <p className="dim" style={{ fontSize: 13, marginTop: 6 }}><b>Solução proposta:</b> {order.diagnostico.solucao}</p>}
        </div>
      )}

      {o && (
        <div className="card" style={{ marginTop: 16 }}>
          <span className="disp" style={{ fontWeight: 700, fontSize: 14 }}>Orçamento</span>
          <table style={{ marginTop: 10 }}><tbody>
            {o.itens.map((it, i) => <tr key={'i' + i}><td>{it.descricao}</td><td className="dim">{it.quantidade}x</td><td>{fmtBRL(it.quantidade * it.valorUnitario)}</td></tr>)}
            {o.maoObra.map((m, i) => <tr key={'m' + i}><td>{m.descricao}</td><td className="dim">Mão de obra</td><td>{fmtBRL(m.valor)}</td></tr>)}
          </tbody></table>
          <div className="divider" />
          <div className="row" style={{ justifyContent: 'space-between', fontWeight: 700, fontSize: 16 }}><span>Total</span><span>{fmtBRL(o.total)}</span></div>

          {order.status === 'AGUARDANDO_APROVACAO' && (
            <div style={{ marginTop: 18 }}>
              <Field label="Observações (opcional)"><textarea className="textarea" value={obs} onChange={(e) => setObs(e.target.value)} maxLength={500} /></Field>
              <div className="row gap8">
                <button className="btn btn-primary" onClick={() => decidir('aprovado')}><CheckCircle2 size={14} />Aprovar orçamento</button>
                <button className="btn btn-danger" onClick={() => decidir('recusado')}><XCircle size={14} />Recusar orçamento</button>
              </div>
            </div>
          )}
          {order.aprovacao && (
            <div className="card2 row gap8" style={{ marginTop: 14, alignItems: 'center' }}>
              {order.aprovacao.status === 'aprovado' ? <CheckCircle2 size={16} color="var(--success)" /> : <XCircle size={16} color="var(--danger)" />}
              <span style={{ fontSize: 13 }}>Você {order.aprovacao.status === 'aprovado' ? 'aprovou' : 'recusou'} este orçamento em {fmtDateTime(order.aprovacao.data)}.</span>
            </div>
          )}
        </div>
      )}

      {order.garantia && (
        <div className="card" style={{ marginTop: 16 }}>
          <span className="disp" style={{ fontWeight: 700, fontSize: 14 }}>Garantia</span>
          <p style={{ fontSize: 13.5, marginTop: 8 }}>Válida até <b>{fmtDate(order.garantia.dataFinal)}</b> ({order.garantia.periodoDias} dias). {order.garantia.condicoes}</p>
        </div>
      )}
    </ClienteShell>
  );
}
