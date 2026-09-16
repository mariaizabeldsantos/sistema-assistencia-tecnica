import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Laptop, Plus, ChevronRight, Edit3, Lock, Eye, EyeOff } from 'lucide-react';
import api, { apiErrorMessage } from '../api/client';
import { PageHead, EmptyState, Modal, Field, Counter, BackLink } from '../components/common';
import { fmtDate } from '../utils';

/* ---------------- Lista ---------------- */
export function EquipamentosList() {
  const navigate = useNavigate();
  const [equipamentos, setEquipamentos] = useState([]);
  const [clients, setClients] = useState([]);
  const [q, setQ] = useState('');

  async function load() {
    const [eq, cl] = await Promise.all([api.get('/equipment', { params: q ? { q } : {} }), api.get('/clients')]);
    setEquipamentos(eq.data);
    setClients(cl.data);
  }
  useEffect(() => { load(); }, [q]);

  return (
    <div>
      <PageHead title="Equipamentos" subtitle={`${equipamentos.length} cadastrados`}
        action={<button className="btn btn-primary" onClick={() => navigate('/equipamentos/novo')}><Plus size={15} />Novo equipamento</button>} />
      <div style={{ maxWidth: 340, marginBottom: 16 }}>
        <input className="input" placeholder="Pesquisar por marca, modelo ou nº de série…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="card" style={{ padding: 0 }}>
        {equipamentos.length === 0 ? <EmptyState icon={Laptop} text="Nenhum equipamento cadastrado." /> : (
          <table><thead><tr><th>Tipo</th><th>Marca/Modelo</th><th>Nº Série</th><th>Cliente</th><th></th></tr></thead>
            <tbody>
              {equipamentos.map((eq) => {
                const cli = clients.find((c) => c.id === eq.clientId);
                return (
                  <tr key={eq.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/equipamentos/${eq.id}`)}>
                    <td className="dim">{eq.tipo === 'notebook' ? 'Notebook' : 'Computador'}</td>
                    <td style={{ fontWeight: 600 }}>{eq.marca} {eq.modelo}</td>
                    <td className="mono dim">{eq.numeroSerie || '—'}</td>
                    <td className="dim">{cli?.nome || '—'}</td>
                    <td><ChevronRight size={15} className="dim" /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ---------------- Formulário (rota separada, como no protótipo) ---------------- */
export function EquipamentoForm({ inline, initial, presetClientId, onClose }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const isEdit = !!initial;
  const presetId = presetClientId || params.get('clientId') || '';
  const [f, setF] = useState(initial || {
    clientId: presetId, tipo: 'notebook', marca: '', modelo: '', numeroSerie: '',
    observacoes: '', senha: '', temSenha: false,
  });
  const [err, setErr] = useState({});
  const [clientes, setClientes] = useState([]);
  const [clienteBusca, setClienteBusca] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { api.get('/clients').then((r) => setClientes(r.data)); }, []);

  function validate() {
    const e = {};
    if (!f.clientId) e.clientId = 'Selecione o cliente dono do equipamento.';
    if (!f.marca.trim() || f.marca.length > 50) e.marca = 'Marca obrigatória (máx. 50 caracteres).';
    return e;
  }

  function close() {
    if (onClose) onClose();
    else navigate(-1);
  }

  async function submit(ev, continuarParaOS) {
    ev.preventDefault();
    const e = validate(); setErr(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    const payload = {
      clientId: f.clientId, tipo: f.tipo, marca: f.marca.trim(), modelo: (f.modelo || '').trim(),
      numeroSerie: (f.numeroSerie || '').trim(), observacoes: f.observacoes || '',
      senha: f.temSenha ? f.senha : '',
    };
    try {
      const r = isEdit ? await api.put(`/equipment/${f.id}`, payload) : await api.post('/equipment', payload);
      if (continuarParaOS) {
        navigate(`/ordens/nova?equipmentId=${r.data.id}`);
      } else {
        close();
        if (!onClose) navigate(`/equipamentos/${r.data.id}`);
      }
    } catch (e2) {
      setErr({ geral: apiErrorMessage(e2) });
    } finally {
      setBusy(false);
    }
  }

  const clientesFiltrados = clientes.filter((c) => c.nome.toLowerCase().includes(clienteBusca.toLowerCase())).slice(0, 6);
  const clienteSel = clientes.find((c) => c.id === f.clientId);

  return (
    <Modal title={isEdit ? 'Editar equipamento' : 'Novo equipamento'} onClose={close} width={620}>
      <form onSubmit={(e) => submit(e, false)}>
        <Field label="Cliente" required error={err.clientId}>
          {clienteSel ? (
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <span className="tag">{clienteSel.nome}</span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setF({ ...f, clientId: '' })}>Trocar</button>
            </div>
          ) : (
            <div>
              <input className="input" placeholder="Buscar cliente pelo nome…" value={clienteBusca} onChange={(e) => setClienteBusca(e.target.value)} />
              {clienteBusca && (
                <div className="card2" style={{ marginTop: 6, padding: 6 }}>
                  {clientesFiltrados.length === 0 && <div className="dim" style={{ fontSize: 12.5, padding: 6 }}>Nenhum cliente encontrado.</div>}
                  {clientesFiltrados.map((c) => (
                    <div key={c.id} className="navitem" onClick={() => { setF({ ...f, clientId: c.id }); setClienteBusca(''); }}>{c.nome}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Field>
        <div className="row gap12" style={{ alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}><Field label="Tipo" required>
            <select className="select" value={f.tipo} onChange={(e) => setF({ ...f, tipo: e.target.value })}>
              <option value="notebook">Notebook</option><option value="computador">Computador</option>
            </select>
          </Field></div>
          <div style={{ flex: 1 }}><Field label="Marca" required error={err.marca}>
            <input className="input" maxLength={50} value={f.marca} onChange={(e) => setF({ ...f, marca: e.target.value })} />
          </Field></div>
          <div style={{ flex: 1 }}><Field label="Modelo">
            <input className="input" maxLength={100} value={f.modelo} onChange={(e) => setF({ ...f, modelo: e.target.value })} />
          </Field></div>
        </div>
        <Field label="Número de série" hint="Opcional">
          <input className="input" maxLength={100} value={f.numeroSerie} onChange={(e) => setF({ ...f, numeroSerie: e.target.value })} />
        </Field>
        <Field label="Senha do equipamento">
          <label className="row gap8" style={{ fontSize: 12.5, marginBottom: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={f.temSenha} onChange={(e) => setF({ ...f, temSenha: e.target.checked })} /> Equipamento possui senha de acesso
          </label>
          {f.temSenha && <input className="input" value={f.senha} onChange={(e) => setF({ ...f, senha: e.target.value })} placeholder="Senha informada pelo cliente" />}
          <div className="hint"><Lock size={11} style={{ verticalAlign: -1 }} /> Nunca exibida em listagens; visível apenas nos detalhes, para o técnico.</div>
        </Field>
        <Field label="Observações">
          <textarea className="textarea" maxLength={2000} value={f.observacoes} onChange={(e) => setF({ ...f, observacoes: e.target.value })} />
          <Counter value={f.observacoes} max={2000} />
        </Field>
        {err.geral && <div className="err" style={{ marginBottom: 10 }}>{err.geral}</div>}
        <div className="row gap8" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
          <button type="button" className="btn" onClick={close}>Cancelar</button>
          <button className="btn" disabled={busy}>{isEdit ? 'Salvar' : 'Cadastrar equipamento'}</button>
          {!isEdit && <button type="button" className="btn btn-primary" onClick={(e) => submit(e, true)}>Cadastrar e abrir OS →</button>}
        </div>
      </form>
    </Modal>
  );
}

/* ---------------- Detalhe ---------------- */
export function EquipamentoDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [eq, setEq] = useState(null);
  const [cliente, setCliente] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showSenha, setShowSenha] = useState(false);

  async function load() {
    const r = await api.get(`/equipment/${id}`);
    setEq(r.data);
    if (r.data.clientId) {
      const c = await api.get(`/clients/${r.data.clientId}`);
      setCliente(c.data);
    }
  }
  useEffect(() => { load(); }, [id]);

  if (!eq) return null;

  return (
    <div>
      <BackLink onClick={() => navigate(-1)} label="Voltar" />
      <PageHead title={`${eq.marca} ${eq.modelo}`} subtitle={cliente ? `Cliente: ${cliente.nome}` : ''}
        action={<div className="row gap8">
          <button className="btn" onClick={() => setShowEdit(true)}><Edit3 size={14} />Editar</button>
          <button className="btn btn-primary" onClick={() => navigate(`/ordens/nova?equipmentId=${eq.id}`)}><Plus size={14} />Nova OS</button>
        </div>} />
      <div className="card" style={{ maxWidth: 520 }}>
        <div className="col gap8" style={{ fontSize: 13.5 }}>
          <div><span className="dim">Tipo: </span>{eq.tipo === 'notebook' ? 'Notebook' : 'Computador'}</div>
          <div><span className="dim">Nº de série: </span><span className="mono">{eq.numeroSerie || '—'}</span></div>
          <div><span className="dim">Cadastrado em: </span>{fmtDate(eq.createdAt)}</div>
          {eq.observacoes && <div><span className="dim">Observações: </span>{eq.observacoes}</div>}
          <div className="row gap8" style={{ alignItems: 'center' }}>
            <span className="dim">Senha do equipamento: </span>
            {eq.senha ? (
              <>
                <span className="mono">{showSenha ? eq.senha : '••••••••'}</span>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowSenha(!showSenha)}>
                  {showSenha ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </>
            ) : '—'}
          </div>
        </div>
      </div>
      {showEdit && <EquipamentoForm initial={eq} onClose={() => { setShowEdit(false); load(); }} />}
    </div>
  );
}
