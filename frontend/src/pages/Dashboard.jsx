import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { PageHead, EmptyState, StatusBadge } from '../components/common';

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => { api.get('/dashboard').then((r) => setData(r.data)); }, []);

  if (!data) return null;
  const { kpis, estoqueBaixo, ordensRecentes } = data;

  const kpiList = [
    { n: kpis.abertas, l: 'OS abertas' }, { n: kpis.emEntrada, l: 'Entrada' }, { n: kpis.emOrcamento, l: 'Em orçamento' },
    { n: kpis.aguardandoAprovacao, l: 'Aguard. aprovação' },
    { n: kpis.emManutencao, l: 'Em manutenção' }, { n: kpis.prontos, l: 'Aguard. retirada' },
    { n: kpis.estoqueBaixo, l: 'Estoque baixo', warn: kpis.estoqueBaixo > 0 },
    { n: kpis.garantiasVigentes, l: 'Garantias vigentes' },
  ];

  return (
    <div>
      <PageHead title="Dashboard" subtitle="Visão geral em tempo real da operação" />
      <div className="row wrap gap12" style={{ marginBottom: 24 }}>
        {kpiList.map((k, i) => (
          <div className="kpi" key={i}>
            <div className="kpi-num" style={k.warn ? { color: 'var(--amber)' } : {}}>{k.n}</div>
            <div className="kpi-lbl">{k.l}</div>
          </div>
        ))}
      </div>

      <div className="row wrap gap16" style={{ alignItems: 'flex-start' }}>
        <div className="card" style={{ flex: 2, minWidth: 340 }}>
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
            <span className="disp" style={{ fontWeight: 700, fontSize: 15 }}>Ordens recentes</span>
            <span className="dim" style={{ fontSize: 12, cursor: 'pointer' }} onClick={() => navigate('/ordens')}>Ver todas →</span>
          </div>
          {ordensRecentes.length === 0 ? <EmptyState text="Nenhuma ordem de serviço cadastrada ainda." /> : (
            <table><tbody>
              {ordensRecentes.map((o) => (
                <tr key={o.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/ordens/${o.id}`)}>
                  <td className="mono ostag">#{o.numero}</td>
                  <td>{o.clienteNome || '—'}</td>
                  <td className="dim">{o.equipamento || '—'}</td>
                  <td><StatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody></table>
          )}
        </div>
        <div className="card" style={{ flex: 1, minWidth: 260 }}>
          <span className="disp" style={{ fontWeight: 700, fontSize: 15 }}>Estoque baixo</span>
          <div style={{ marginTop: 12 }}>
            {estoqueBaixo.length === 0 ? <div className="dim" style={{ fontSize: 13 }}>Nenhuma peça abaixo do mínimo.</div> :
              estoqueBaixo.map((p) => (
                <div key={p.id} className="row" style={{ justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 13 }}>{p.nome}</span>
                  <span className="lowstock mono" style={{ fontSize: 12, fontWeight: 700 }}>{p.quantidade}/{p.estoqueMinimo}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
