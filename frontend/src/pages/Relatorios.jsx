import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import api from '../api/client';
import { PageHead, EmptyState } from '../components/common';
import { fmtBRL, fmtDate, fmtDateTime, STATUS_LABEL } from '../utils';

// Este arquivo junta duas telas pequenas e parecidas — Relatórios e
// Garantias — porque as duas são só de "leitura" (consultam dados que já
// existem, não criam nada novo). Cada uma continua sendo sua própria rota
// (/relatorios e /garantias); só o arquivo que guarda o código é o mesmo.

export function Relatorios() {
  const [de, setDe] = useState('');
  const [ate, setAte] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/reports', { params: { de: de || undefined, ate: ate || undefined } }).then((r) => setData(r.data));
  }, [de, ate]);

  if (!data) return null;

  return (
    <div>
      <PageHead title="Relatórios" subtitle="Indicadores operacionais e auditoria do sistema" />
      <div className="row gap12" style={{ marginBottom: 20 }}>
        <div><label className="label">De</label><input className="input" type="date" value={de} onChange={(e) => setDe(e.target.value)} /></div>
        <div><label className="label">Até</label><input className="input" type="date" value={ate} onChange={(e) => setAte(e.target.value)} /></div>
      </div>

      <div className="row wrap gap16" style={{ alignItems: 'flex-start' }}>
        <div className="card" style={{ flex: 1, minWidth: 260 }}>
          <span className="disp" style={{ fontWeight: 700, fontSize: 14 }}>OS por status</span>
          <div className="col gap8" style={{ marginTop: 12 }}>
            {Object.entries(data.porStatus).map(([s, n]) => (
              <div key={s} className="row" style={{ justifyContent: 'space-between', fontSize: 13 }}><span className="dim">{STATUS_LABEL[s] || s}</span><span style={{ fontWeight: 700 }}>{n}</span></div>
            ))}
          </div>
        </div>

        <div className="card" style={{ flex: 1, minWidth: 260 }}>
          <span className="disp" style={{ fontWeight: 700, fontSize: 14 }}>Peças mais utilizadas</span>
          <div className="col gap8" style={{ marginTop: 12 }}>
            {data.topPecas.length === 0 && <div className="dim" style={{ fontSize: 13 }}>Sem dados suficientes.</div>}
            {data.topPecas.map((p) => (
              <div key={p.nome} className="row" style={{ justifyContent: 'space-between', fontSize: 13 }}><span>{p.nome}</span><span className="dim">{p.quantidade}x</span></div>
            ))}
          </div>
        </div>

        <div className="card" style={{ flex: 1, minWidth: 220 }}>
          <span className="disp" style={{ fontWeight: 700, fontSize: 14 }}>Período selecionado</span>
          <div className="col gap8" style={{ marginTop: 12, fontSize: 13 }}>
            <div className="row" style={{ justifyContent: 'space-between' }}><span className="dim">Valor total orçado</span><span style={{ fontWeight: 700 }}>{fmtBRL(data.periodo.valorTotalOrcado)}</span></div>
            <div className="row" style={{ justifyContent: 'space-between' }}><span className="dim">OS entregues</span><span>{data.periodo.entregues}</span></div>
            <div className="row" style={{ justifyContent: 'space-between' }}><span className="dim">OS canceladas</span><span>{data.periodo.cancelados}</span></div>
          </div>
          <div className="divider" />
          <div className="row" style={{ justifyContent: 'space-between', fontSize: 13 }}><span className="dim">Garantias vigentes</span><span>{data.garantias.vigentes}</span></div>
          <div className="row" style={{ justifyContent: 'space-between', fontSize: 13 }}><span className="dim">Garantias vencidas</span><span>{data.garantias.vencidas}</span></div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <span className="disp" style={{ fontWeight: 700, fontSize: 14 }}>Auditoria recente</span>
        <div style={{ marginTop: 10 }}>
          {data.auditoria.length === 0 ? <div className="dim" style={{ fontSize: 13 }}>Nenhum evento registrado.</div> : (
            <table><tbody>
              {data.auditoria.map((a) => (
                <tr key={a.id}><td style={{ fontWeight: 600 }}>{a.acao}</td><td className="dim">{a.detalhe || '—'}</td><td className="dim">{a.usuario || 'Sistema'}</td><td className="dim">{fmtDateTime(a.data)}</td></tr>
              ))}
            </tbody></table>
          )}
        </div>
      </div>
    </div>
  );
}

export function Garantias() {
  const navigate = useNavigate();
  const [lista, setLista] = useState([]);
  const [q, setQ] = useState('');

  useEffect(() => { api.get('/warranties', { params: q ? { q } : {} }).then((r) => setLista(r.data)); }, [q]);

  return (
    <div>
      <PageHead title="Garantias" subtitle={`${lista.length} ordens com garantia registrada`} />
      <div style={{ maxWidth: 320, marginBottom: 16 }}>
        <input className="input" placeholder="Buscar por nº da OS ou cliente…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="card" style={{ padding: 0 }}>
        {lista.length === 0 ? <EmptyState icon={ShieldCheck} text="Nenhuma garantia registrada ainda." /> : (
          <table><thead><tr><th>OS</th><th>Cliente</th><th>Equipamento</th><th>Válida até</th><th>Status</th></tr></thead>
            <tbody>
              {lista.map((g) => (
                <tr key={g.orderId} style={{ cursor: 'pointer' }} onClick={() => navigate(`/ordens/${g.orderId}`)}>
                  <td className="mono ostag">#{g.numero}</td>
                  <td>{g.clienteNome}</td>
                  <td className="dim">{g.equipamento}</td>
                  <td className="dim">{fmtDate(g.garantia.dataFinal)}</td>
                  <td>
                    <span className="badge" style={g.vigente
                      ? { background: '#4CD78722', color: 'var(--success)', border: '1px solid #4CD78755' }
                      : { background: '#8C96A622', color: 'var(--dim)', border: '1px solid #8C96A655' }}>
                      {g.vigente ? 'Vigente' : 'Vencida'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
