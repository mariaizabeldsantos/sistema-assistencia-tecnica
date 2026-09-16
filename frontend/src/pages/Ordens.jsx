import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ClipboardList, Plus } from 'lucide-react';
import api, { apiErrorMessage } from '../api/client';
import { PageHead, EmptyState, Modal, Field, Counter, StatusBadge } from '../components/common';
import { fmtDate } from '../utils';

export function OrdensList() {
  const navigate = useNavigate();
  const [ordens, setOrdens] = useState([]);
  const [clients, setClients] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [showNew, setShowNew] = useState(false);

  async function load() {
    const [o, c, e] = await Promise.all([api.get('/orders'), api.get('/clients'), api.get('/equipment')]);
    setOrdens(o.data);
    setClients(c.data);
    setEquipment(e.data);
  }
  useEffect(() => { load(); }, []);

  return (
    <div>
      <PageHead title="Ordens de Serviço" subtitle={`${ordens.length} registradas`}
        action={<button className="btn btn-primary" onClick={() => setShowNew(true)}><Plus size={15} />Nova OS</button>} />
      <div className="card" style={{ padding: 0 }}>
        {ordens.length === 0 ? <EmptyState icon={ClipboardList} text="Nenhuma ordem de serviço cadastrada ainda." /> : (
          <table><thead><tr><th>OS</th><th>Cliente</th><th>Equipamento</th><th>Data</th><th>Status</th></tr></thead>
            <tbody>
              {ordens.map((o) => {
                const cli = clients.find((c) => c.id === o.clientId);
                const eq = equipment.find((e) => e.id === o.equipmentId);
                return (
                  <tr key={o.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/ordens/${o.id}`)}>
                    <td className="mono ostag">#{o.numero}</td>
                    <td>{cli?.nome || '—'}</td>
                    <td className="dim">{eq ? `${eq.marca} ${eq.modelo}` : '—'}</td>
                    <td className="dim">{fmtDate(o.createdAt)}</td>
                    <td><StatusBadge status={o.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      {showNew && <NovaOSForm onClose={(id) => { setShowNew(false); load(); if (id) navigate(`/ordens/${id}`); }} />}
    </div>
  );
}

export function NovaOSForm({ onClose }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const presetEquipId = params.get('equipmentId') || '';
  const [equipId, setEquipId] = useState(presetEquipId);
  const [buscaEq, setBuscaEq] = useState('');
  const [equipment, setEquipment] = useState([]);
  const [clients, setClients] = useState([]);
  const [f, setF] = useState({ problemaRelatado: '', acessorios: '', estadoFisico: '', observacoes: '', prazo: '' });
  const [err, setErr] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([api.get('/equipment'), api.get('/clients')]).then(([eq, cl]) => {
      setEquipment(eq.data);
      setClients(cl.data);
    });
  }, []);

  const equipSel = equipment.find((e) => e.id === equipId);
  const clienteSel = equipSel ? clients.find((c) => c.id === equipSel.clientId) : null;
  const equipFiltrados = equipment.filter((eq) => {
    const cli = clients.find((c) => c.id === eq.clientId);
    const s = buscaEq.toLowerCase();
    return (eq.marca + ' ' + eq.modelo + ' ' + (cli?.nome || '')).toLowerCase().includes(s);
  }).slice(0, 6);

  function close() {
    if (onClose) onClose();
    else navigate(-1);
  }

  async function submit(ev) {
    ev.preventDefault();
    const e = {};
    if (!equipId) e.equipId = 'Selecione o equipamento (ou cadastre um novo).';
    if (!f.problemaRelatado.trim() || f.problemaRelatado.trim().length < 5) e.problemaRelatado = 'Descreva o problema (mínimo 5 caracteres).';
    setErr(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      const r = await api.post('/orders', { equipmentId: equipId, ...f });
      if (onClose) onClose(r.data.id);
      else navigate(`/ordens/${r.data.id}`);
    } catch (e2) {
      setErr({ geral: apiErrorMessage(e2) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Nova Ordem de Serviço" onClose={close} width={620}>
      <form onSubmit={submit}>
        <Field label="Equipamento" required error={err.equipId}>
          {equipSel ? (
            <div className="card2">
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <b>{equipSel.marca} {equipSel.modelo}</b>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEquipId('')}>Trocar</button>
              </div>
              <div className="dim" style={{ fontSize: 12.5 }}>Cliente: {clienteSel?.nome}</div>
            </div>
          ) : (
            <div>
              <input className="input" placeholder="Buscar equipamento por marca, modelo ou cliente…" value={buscaEq} onChange={(e) => setBuscaEq(e.target.value)} />
              {buscaEq && (
                <div className="card2" style={{ marginTop: 6, padding: 6 }}>
                  {equipFiltrados.map((eq) => {
                    const cli = clients.find((c) => c.id === eq.clientId);
                    return <div key={eq.id} className="navitem" onClick={() => { setEquipId(eq.id); setBuscaEq(''); }}>{eq.marca} {eq.modelo} — {cli?.nome}</div>;
                  })}
                  {equipFiltrados.length === 0 && <div className="dim" style={{ fontSize: 12.5, padding: 6 }}>Nenhum equipamento encontrado. Cadastre em "Equipamentos".</div>}
                </div>
              )}
            </div>
          )}
        </Field>
        <Field label="Problema relatado" required error={err.problemaRelatado}>
          <textarea className="textarea" maxLength={1000} value={f.problemaRelatado} onChange={(e) => setF({ ...f, problemaRelatado: e.target.value })} />
          <Counter value={f.problemaRelatado} max={1000} />
        </Field>
        <div className="row gap12" style={{ alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}><Field label="Acessórios"><input className="input" maxLength={500} value={f.acessorios} onChange={(e) => setF({ ...f, acessorios: e.target.value })} /></Field></div>
          <div style={{ flex: 1 }}><Field label="Prazo estimado"><input className="input" type="date" value={f.prazo} onChange={(e) => setF({ ...f, prazo: e.target.value })} /></Field></div>
        </div>
        <Field label="Estado físico do equipamento"><input className="input" maxLength={500} value={f.estadoFisico} onChange={(e) => setF({ ...f, estadoFisico: e.target.value })} placeholder="Ex.: riscos na tampa, tela com trinco…" /></Field>
        <Field label="Observações"><textarea className="textarea" maxLength={2000} value={f.observacoes} onChange={(e) => setF({ ...f, observacoes: e.target.value })} /><Counter value={f.observacoes} max={2000} /></Field>
        {err.geral && <div className="err" style={{ marginBottom: 10 }}>{err.geral}</div>}
        <div className="row gap8" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
          <button type="button" className="btn" onClick={close}>Cancelar</button>
          <button className="btn btn-primary" disabled={busy}>Abrir ordem de serviço</button>
        </div>
      </form>
    </Modal>
  );
}
