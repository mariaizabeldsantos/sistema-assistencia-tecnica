import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Users, Plus, ChevronRight, Edit3, Lock } from 'lucide-react';
import api, { apiErrorMessage } from '../api/client';
import { PageHead, EmptyState, Modal, Field, Counter, BackLink, StatusBadge } from '../components/common';
import { maskCPF, maskPhone, onlyDigits, validPhone, validEmail, fmtDate } from '../utils';

/* ---------------- Lista ---------------- */
export function ClientesList() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [counts, setCounts] = useState({});
  const [q, setQ] = useState('');
  const [showNew, setShowNew] = useState(false);

  async function load() {
    const r = await api.get('/clients', { params: q ? { q } : {} });
    setClients(r.data);
  }
  useEffect(() => { load(); }, [q]);
  useEffect(() => {
    // busca contagem de equipamentos/OS por cliente (usa endpoints já existentes)
    Promise.all([api.get('/equipment'), api.get('/orders')]).then(([eq, ord]) => {
      const c = {};
      clients.forEach((cl) => {
        c[cl.id] = {
          eq: eq.data.filter((e) => e.clientId === cl.id).length,
          os: ord.data.filter((o) => o.clientId === cl.id).length,
        };
      });
      setCounts(c);
    });
  }, [clients]);

  return (
    <div>
      <PageHead title="Clientes" subtitle={`${clients.length} cadastrados`}
        action={<button className="btn btn-primary" onClick={() => setShowNew(true)}><Plus size={15} />Novo cliente</button>} />
      <div style={{ maxWidth: 340, marginBottom: 16 }}>
        <input className="input" placeholder="Pesquisar por nome, telefone ou CPF…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="card" style={{ padding: 0 }}>
        {clients.length === 0 ? <EmptyState icon={Users} text="Nenhum cliente encontrado." /> : (
          <table><thead><tr><th>Nome</th><th>Telefone</th><th>E-mail</th><th>Equipamentos</th><th>OS</th><th></th></tr></thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/clientes/${c.id}`)}>
                  <td style={{ fontWeight: 600 }}>{c.nome}</td>
                  <td className="mono dim">{maskPhone(c.telefone)}</td>
                  <td className="dim">{c.email || '—'}</td>
                  <td className="dim">{counts[c.id]?.eq ?? '—'}</td>
                  <td className="dim">{counts[c.id]?.os ?? '—'}</td>
                  <td><ChevronRight size={15} className="dim" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {showNew && <ClienteForm onClose={(id) => { setShowNew(false); load(); if (id) navigate(`/clientes/${id}`); }} />}
    </div>
  );
}

/* ---------------- Formulário ---------------- */
export function ClienteForm({ onClose, initial }) {
  const isEdit = !!initial;
  const [f, setF] = useState(initial || { nome: '', cpf: '', telefone: '', whatsappIgual: true, whatsapp: '', email: '', endereco: '', observacoes: '' });
  const [err, setErr] = useState({});
  const [busy, setBusy] = useState(false);

  function validate() {
    const e = {};
    if (!f.nome.trim() || f.nome.trim().length < 3 || f.nome.trim().length > 150) e.nome = 'Nome deve ter entre 3 e 150 caracteres.';
    if (!f.telefone || !validPhone(f.telefone)) e.telefone = 'Informe um telefone válido.';
    if (f.email && !validEmail(f.email)) e.email = 'Informe um e-mail válido.';
    return e;
  }

  async function submit(ev) {
    ev.preventDefault();
    const e = validate(); setErr(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    const payload = {
      nome: f.nome.trim(), cpf: onlyDigits(f.cpf), telefone: onlyDigits(f.telefone),
      whatsapp: f.whatsappIgual ? onlyDigits(f.telefone) : onlyDigits(f.whatsapp),
      email: (f.email || '').trim(), endereco: f.endereco || '', observacoes: f.observacoes || '',
    };
    try {
      const r = isEdit ? await api.put(`/clients/${f.id}`, payload) : await api.post('/clients', payload);
      onClose(r.data.id);
    } catch (e2) {
      setErr({ geral: apiErrorMessage(e2) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={isEdit ? 'Editar cliente' : 'Novo cliente'} onClose={() => onClose()}>
      <form onSubmit={submit}>
        <Field label="Nome completo" required error={err.nome}>
          <input className="input" maxLength={150} value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} />
        </Field>
        <div className="row gap12" style={{ alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <Field label="CPF" hint="Opcional">
              <input className="input" maxLength={14} value={maskCPF(f.cpf)} onChange={(e) => setF({ ...f, cpf: e.target.value })} placeholder="000.000.000-00" />
            </Field>
          </div>
          <div style={{ flex: 1 }}>
            <Field label="Telefone" required error={err.telefone}>
              <input className="input" maxLength={15} value={maskPhone(f.telefone)} onChange={(e) => setF({ ...f, telefone: e.target.value })} placeholder="(00) 00000-0000" />
            </Field>
          </div>
        </div>
        <Field label="WhatsApp">
          <label className="row gap8" style={{ fontSize: 12.5, marginBottom: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={f.whatsappIgual} onChange={(e) => setF({ ...f, whatsappIgual: e.target.checked })} /> Mesmo número do telefone
          </label>
          {!f.whatsappIgual && <input className="input" maxLength={15} value={maskPhone(f.whatsapp)} onChange={(e) => setF({ ...f, whatsapp: e.target.value })} placeholder="(00) 00000-0000" />}
        </Field>
        <Field label="E-mail" error={err.email} hint="Opcional">
          <input className="input" type="email" maxLength={254} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        </Field>
        <Field label="Endereço" hint="Opcional">
          <input className="input" value={f.endereco} onChange={(e) => setF({ ...f, endereco: e.target.value })} />
        </Field>
        <Field label="Observações">
          <textarea className="textarea" maxLength={2000} value={f.observacoes} onChange={(e) => setF({ ...f, observacoes: e.target.value })} />
          <Counter value={f.observacoes} max={2000} />
        </Field>
        {err.geral && <div className="err" style={{ marginBottom: 10 }}>{err.geral}</div>}
        <div className="row gap8" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
          <button type="button" className="btn" onClick={() => onClose()}>Cancelar</button>
          <button className="btn btn-primary" disabled={busy}>{isEdit ? 'Salvar alterações' : 'Cadastrar cliente'}</button>
        </div>
      </form>
    </Modal>
  );
}

/* ---------------- Detalhe ---------------- */
export function ClienteDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cliente, setCliente] = useState(null);
  const [equipamentos, setEquipamentos] = useState([]);
  const [ordens, setOrdens] = useState([]);
  const [showEdit, setShowEdit] = useState(false);
  const [showAcesso, setShowAcesso] = useState(false);

  async function load() {
    const [c, eq, ord] = await Promise.all([
      api.get(`/clients/${id}`),
      api.get('/equipment', { params: { clientId: id } }),
      api.get('/orders', { params: { clientId: id } }),
    ]);
    setCliente(c.data);
    setEquipamentos(eq.data);
    setOrdens(ord.data);
  }
  useEffect(() => { load(); }, [id]);

  if (!cliente) return null;
  const garantias = ordens.filter((o) => o.garantia);

  return (
    <div>
      <BackLink onClick={() => navigate('/clientes')} label="Clientes" />
      <PageHead title={cliente.nome} subtitle={`Cliente desde ${fmtDate(cliente.createdAt)}`}
        action={<div className="row gap8">
          <button className="btn" onClick={() => setShowAcesso(true)}><Lock size={14} />Área do cliente</button>
          <button className="btn" onClick={() => setShowEdit(true)}><Edit3 size={14} />Editar</button>
          <button className="btn btn-primary" onClick={() => navigate(`/equipamentos/novo?clientId=${id}`)}><Plus size={14} />Novo equipamento</button>
        </div>} />

      <div className="row wrap gap16" style={{ alignItems: 'flex-start' }}>
        <div className="card" style={{ minWidth: 260 }}>
          <span className="disp" style={{ fontWeight: 700, fontSize: 14 }}>Dados pessoais</span>
          <div className="col gap8" style={{ marginTop: 12, fontSize: 13.5 }}>
            <div><span className="dim">CPF: </span>{cliente.cpf ? maskCPF(cliente.cpf) : '—'}</div>
            <div><span className="dim">{cliente.whatsapp === cliente.telefone ? 'Telefone / WhatsApp: ' : 'Telefone: '}</span><span className="mono">{maskPhone(cliente.telefone)}</span></div>
            {cliente.whatsapp && cliente.whatsapp !== cliente.telefone && <div><span className="dim">WhatsApp: </span><span className="mono">{maskPhone(cliente.whatsapp)}</span></div>}
            <div><span className="dim">E-mail: </span>{cliente.email || '—'}</div>
            <div><span className="dim">Endereço: </span>{cliente.endereco || '—'}</div>
            {cliente.observacoes && <div><span className="dim">Obs: </span>{cliente.observacoes}</div>}
          </div>
        </div>

        <div className="card grow" style={{ minWidth: 300 }}>
          <span className="disp" style={{ fontWeight: 700, fontSize: 14 }}>Equipamentos ({equipamentos.length})</span>
          <div style={{ marginTop: 10 }}>
            {equipamentos.length === 0 ? <div className="dim" style={{ fontSize: 13 }}>Nenhum equipamento cadastrado.</div> :
              equipamentos.map((eq) => (
                <div key={eq.id} className="row" style={{ justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => navigate(`/equipamentos/${eq.id}`)}>
                  <span>{eq.tipo === 'notebook' ? '💻' : '🖥️'} {eq.marca} {eq.modelo}</span>
                  <ChevronRight size={14} className="dim" />
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <span className="disp" style={{ fontWeight: 700, fontSize: 14 }}>Ordens de serviço ({ordens.length})</span>
        <div style={{ marginTop: 10 }}>
          {ordens.length === 0 ? <div className="dim" style={{ fontSize: 13 }}>Nenhuma ordem registrada.</div> : (
            <table><tbody>
              {[...ordens].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((o) => {
                const eq = equipamentos.find((e) => e.id === o.equipmentId);
                return (
                  <tr key={o.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/ordens/${o.id}`)}>
                    <td className="mono ostag">#{o.numero}</td>
                    <td className="dim">{eq ? `${eq.marca} ${eq.modelo}` : '—'}</td>
                    <td className="dim">{fmtDate(o.createdAt)}</td>
                    <td><StatusBadge status={o.status} /></td>
                  </tr>
                );
              })}
            </tbody></table>
          )}
        </div>
      </div>

      {garantias.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <span className="disp" style={{ fontWeight: 700, fontSize: 14 }}>Garantias</span>
          <div style={{ marginTop: 10 }}>
            {garantias.map((o) => (
              <div key={o.id} className="row" style={{ justifyContent: 'space-between', padding: '6px 0', fontSize: 13 }}>
                <span className="mono ostag">#{o.numero}</span>
                <span className="dim">válida até {fmtDate(o.garantia.dataFinal)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showEdit && <ClienteForm initial={cliente} onClose={() => { setShowEdit(false); load(); }} />}
      {showAcesso && <AcessoClienteForm cliente={cliente} onClose={() => setShowAcesso(false)} />}
    </div>
  );
}

function AcessoClienteForm({ cliente, onClose }) {
  const [email, setEmail] = useState(cliente.email || '');
  const [senha, setSenha] = useState('');
  const [err, setErr] = useState('');
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr('');
    if (senha.length < 8 || senha.length > 64) { setErr('A senha deve ter entre 8 e 64 caracteres.'); return; }
    setBusy(true);
    try {
      await api.post(`/clients/${cliente.id}/acesso`, { email, senha });
      setOk(true);
    } catch (e2) {
      setErr(apiErrorMessage(e2));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Área do cliente — acesso" onClose={onClose}>
      {ok ? (
        <div className="card2" style={{ fontSize: 13 }}>
          Acesso criado/atualizado. Repasse o e-mail e a senha ao cliente para que ele acompanhe as ordens de serviço.
        </div>
      ) : (
        <form onSubmit={submit}>
          <p className="dim" style={{ fontSize: 12.5, marginBottom: 12 }}>
            Crie um login para que este cliente acompanhe suas ordens de serviço e aprove orçamentos pela área do cliente.
          </p>
          <Field label="E-mail de acesso" required>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Senha (8–64 caracteres)" required>
            <input className="input" type="password" maxLength={64} value={senha} onChange={(e) => setSenha(e.target.value)} />
          </Field>
          {err && <div className="err" style={{ marginBottom: 10 }}>{err}</div>}
          <div className="row gap8" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="btn" onClick={onClose}>Cancelar</button>
            <button className="btn btn-primary" disabled={busy}>Criar acesso</button>
          </div>
        </form>
      )}
    </Modal>
  );
}
