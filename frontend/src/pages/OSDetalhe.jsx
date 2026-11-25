import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import api, { estoqueApi, apiErrorMessage } from '../api/client';
import { PageHead, BackLink, StatusBadge, OSTimeline, Field, Counter, Toast, CurrencyInput } from '../components/common';
import { fmtDate, fmtDateTime, fmtBRL } from '../utils';

const NEXT_LABEL = {
  ENTRADA: 'Ir para orçamento',
  EM_MANUTENCAO: 'Marcar como pronto', PRONTO: 'Marcar como entregue',
};
const NEXT_STATUS = {
  ENTRADA: 'ORCAMENTO',
  EM_MANUTENCAO: 'PRONTO', PRONTO: 'ENTREGUE',
};

export default function OSDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [cliente, setCliente] = useState(null);
  const [equipamento, setEquipamento] = useState(null);
  const [tab, setTab] = useState('geral');
  const [toast, setToast] = useState(null);

  async function load() {
    const o = await api.get(`/orders/${id}`);
    setOrder(o.data);
    const [c, e] = await Promise.all([api.get(`/clients/${o.data.clientId}`), api.get(`/equipment/${o.data.equipmentId}`)]);
    setCliente(c.data);
    setEquipamento(e.data);
  }
  useEffect(() => { load(); }, [id]);

  function notify(msg, kind = 'success') {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 3500);
  }

  async function avancarStatus() {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    try {
      await api.post(`/orders/${id}/status`, { status: next });
      notify('Status atualizado.');
      load();
    } catch (e) { notify(apiErrorMessage(e), 'error'); }
  }

  async function cancelar() {
    if (!window.confirm('Tem certeza que deseja cancelar esta OS?')) return;
    try {
      await api.post(`/orders/${id}/status`, { status: 'CANCELADO' });
      notify('Ordem cancelada.', 'warn');
      load();
    } catch (e) { notify(apiErrorMessage(e), 'error'); }
  }

  if (!order || !cliente || !equipamento) return null;

  const tabs = [
    { k: 'geral', l: 'Visão geral' }, { k: 'diagnostico', l: 'Diagnóstico' },
    { k: 'orcamento', l: 'Orçamento' }, { k: 'pecas', l: 'Peças utilizadas' },
    { k: 'historico', l: 'Histórico' }, { k: 'garantia', l: 'Garantia' },
  ];

  return (
    <div>
      <Toast toast={toast} />
      <BackLink onClick={() => navigate('/ordens')} label="Ordens de serviço" />
      <PageHead
        title={<span className="row gap12"><span className="mono ostag" style={{ fontSize: 16 }}>OS #{order.numero}</span><StatusBadge status={order.status} /></span>}
        subtitle={`${cliente.nome} · ${equipamento.marca} ${equipamento.modelo} · aberta em ${fmtDate(order.createdAt)}`}
        action={order.status !== 'ENTREGUE' && order.status !== 'CANCELADO' && (
          <div className="row gap8">
            <button className="btn btn-danger" onClick={cancelar}>Cancelar OS</button>
            {NEXT_STATUS[order.status] && <button className="btn btn-primary" onClick={avancarStatus}>{NEXT_LABEL[order.status]}</button>}
          </div>
        )}
      />
      {order.status !== 'CANCELADO' && <OSTimeline status={order.status} />}
      {order.status === 'CANCELADO' && <div className="card2" style={{ marginTop: 14, color: 'var(--danger)', fontSize: 13 }}>Esta ordem de serviço foi cancelada.</div>}

      <div className="row gap16" style={{ borderBottom: '1px solid var(--border)', marginTop: 22, marginBottom: 20 }}>
        {tabs.map((t) => <div key={t.k} className={'tab' + (tab === t.k ? ' active' : '')} onClick={() => setTab(t.k)}>{t.l}</div>)}
      </div>

      {tab === 'geral' && <AbaGeral order={order} cliente={cliente} equipamento={equipamento} onSaved={() => { load(); notify('Observações atualizadas.'); }} />}
      {tab === 'diagnostico' && <AbaDiagnostico order={order} onSaved={(adv) => { load(); notify(adv ? 'Diagnóstico salvo e OS avançada.' : 'Diagnóstico salvo.'); }} />}
      {tab === 'orcamento' && <AbaOrcamento order={order} onSaved={(msg) => { load(); notify(msg); }} onError={(e) => notify(apiErrorMessage(e), 'error')} />}
      {tab === 'pecas' && <AbaPecas order={order} onSaved={() => { load(); notify('Peça registrada e baixada do estoque.'); }} onError={(e) => notify(apiErrorMessage(e), 'error')} />}
      {tab === 'historico' && <AbaHistorico order={order} />}
      {tab === 'garantia' && <AbaGarantia order={order} />}
    </div>
  );
}

function AbaGeral({ order, cliente, equipamento, onSaved }) {
  const [obs, setObs] = useState(order.observacoes || '');
  const dirty = obs !== (order.observacoes || '');
  async function salvar() {
    await api.put(`/orders/${order.id}/observacoes`, { observacoes: obs });
    onSaved();
  }
  return (
    <div className="row wrap gap16" style={{ alignItems: 'flex-start' }}>
      <div className="card" style={{ flex: 1, minWidth: 280 }}>
        <span className="disp" style={{ fontWeight: 700, fontSize: 14 }}>Problema relatado</span>
        <p style={{ fontSize: 13.5, marginTop: 8 }}>{order.problemaRelatado}</p>
        <div className="divider" />
        <div className="col gap8" style={{ fontSize: 13.5 }}>
          <div><span className="dim">Acessórios: </span>{order.acessorios || '—'}</div>
          <div><span className="dim">Estado físico: </span>{order.estadoFisico || '—'}</div>
          <div><span className="dim">Prazo estimado: </span>{order.prazo ? fmtDate(order.prazo) : '—'}</div>
        </div>
      </div>
      <div className="card" style={{ flex: 1, minWidth: 280 }}>
        <span className="disp" style={{ fontWeight: 700, fontSize: 14 }}>Cliente &amp; equipamento</span>
        <div className="col gap8" style={{ marginTop: 10, fontSize: 13.5 }}>
          <div><span className="dim">Cliente: </span>{cliente.nome}</div>
          <div><span className="dim">Telefone: </span>{cliente.telefone}</div>
          <div><span className="dim">Equipamento: </span>{equipamento.marca} {equipamento.modelo}</div>
          <div><span className="dim">Nº série: </span>{equipamento.numeroSerie || '—'}</div>
        </div>
        <div className="divider" />
        <Field label="Observações internas">
          <textarea className="textarea" maxLength={2000} value={obs} onChange={(e) => setObs(e.target.value)} />
          <Counter value={obs} max={2000} />
        </Field>
        {dirty && <button className="btn btn-primary btn-sm" onClick={salvar}>Salvar observações</button>}
      </div>
    </div>
  );
}

function AbaDiagnostico({ order, onSaved }) {
  const d = order.diagnostico || { diagnostico: '', testes: '', solucao: '' };
  const [f, setF] = useState(d);
  const editavel = order.status === 'ENTRADA';

  async function salvar(avancar) {
    await api.put(`/orders/${order.id}/diagnostico`, f, { params: { avancar } });
    onSaved(avancar);
  }

  return (
    <div className="card" style={{ maxWidth: 640 }}>
      <div className="card2" style={{ marginBottom: 14 }}>
        <span className="dim" style={{ fontSize: 12 }}>Problema relatado pelo cliente na abertura da OS</span>
        <p style={{ fontSize: 13.5, marginTop: 4 }}>{order.problemaRelatado}</p>
      </div>
      <Field label="Diagnóstico técnico" hint="O que você constatou ao examinar o equipamento — pode confirmar, detalhar ou divergir do relato acima.">
        <textarea className="textarea" disabled={!editavel} value={f.diagnostico} onChange={(e) => setF({ ...f, diagnostico: e.target.value })} maxLength={2000} placeholder="Ex.: confirmado — placa-mãe com sinais de queima na fonte de alimentação" />
      </Field>
      <Field label="Testes realizados"><textarea className="textarea" disabled={!editavel} value={f.testes} onChange={(e) => setF({ ...f, testes: e.target.value })} maxLength={2000} /></Field>
      <Field label="Solução proposta"><textarea className="textarea" disabled={!editavel} value={f.solucao} onChange={(e) => setF({ ...f, solucao: e.target.value })} maxLength={2000} /></Field>
      {editavel && (
        <div className="row gap8">
          <button className="btn" onClick={() => salvar(false)}>Salvar rascunho</button>
          {order.status === 'ENTRADA' && <button className="btn btn-primary" onClick={() => salvar(true)}>Salvar e enviar para orçamento →</button>}
        </div>
      )}
      {!editavel && <div className="dim" style={{ fontSize: 12.5 }}>Diagnóstico bloqueado para edição nesta etapa da OS.</div>}
    </div>
  );
}

function AbaOrcamento({ order, onSaved, onError }) {
  const o = order.orcamento || { itens: [], maoObra: [], desconto: 0 };
  const [itens, setItens] = useState(o.itens || []);
  const [maoObra, setMaoObra] = useState(o.maoObra || []);
  const [desconto, setDesconto] = useState(o.desconto || 0);
  const editavel = order.status === 'ORCAMENTO';

  const totalPecas = itens.reduce((s, i) => s + i.quantidade * i.valorUnitario, 0);
  const totalMO = maoObra.reduce((s, m) => s + m.valor, 0);
  const total = Math.max(0, totalPecas + totalMO - (Number(desconto) || 0));

  function addItem() { setItens([...itens, { descricao: '', quantidade: 1, valorUnitario: 0 }]); }
  function addMO() { setMaoObra([...maoObra, { descricao: '', valor: 0 }]); }

  async function salvar() {
    try { await api.put(`/orders/${order.id}/orcamento`, { itens, maoObra, desconto: Number(desconto) || 0 }); onSaved('Orçamento salvo.'); }
    catch (e) { onError(e); }
  }
  async function enviar() {
    try { await api.post(`/orders/${order.id}/orcamento/enviar`, { itens, maoObra, desconto: Number(desconto) || 0 }); onSaved('Orçamento enviado para aprovação do cliente.'); }
    catch (e) { onError(e); }
  }

  if (order.orcamento && !editavel && order.status !== 'ORCAMENTO') {
    // já enviado / decidido — mostra somente leitura
  }

  return (
    <div className="card" style={{ maxWidth: 640 }}>
      <span className="disp" style={{ fontWeight: 700, fontSize: 14 }}>Peças e materiais</span>
      {itens.map((it, i) => (
        <div key={i} className="row gap8" style={{ marginTop: 8, alignItems: 'flex-end' }}>
          <div style={{ flex: 2 }}><input className="input" placeholder="Descrição" disabled={!editavel} value={it.descricao} onChange={(e) => { const n = [...itens]; n[i].descricao = e.target.value; setItens(n); }} /></div>
          <div style={{ width: 70 }}><input className="input" type="number" min={1} disabled={!editavel} value={it.quantidade} onChange={(e) => { const n = [...itens]; n[i].quantidade = Number(e.target.value); setItens(n); }} /></div>
          <div style={{ width: 110 }}><CurrencyInput disabled={!editavel} value={it.valorUnitario} onChange={(v) => { const n = [...itens]; n[i].valorUnitario = v; setItens(n); }} /></div>
          {editavel && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setItens(itens.filter((_, x) => x !== i))}><Trash2 size={14} /></button>}
        </div>
      ))}
      {editavel && <button className="btn btn-sm" style={{ marginTop: 10 }} onClick={addItem}><Plus size={13} />Item</button>}

      <div className="divider" />
      <span className="disp" style={{ fontWeight: 700, fontSize: 14 }}>Mão de obra</span>
      {maoObra.map((m, i) => (
        <div key={i} className="row gap8" style={{ marginTop: 8, alignItems: 'flex-end' }}>
          <div style={{ flex: 2 }}><input className="input" placeholder="Descrição do serviço" disabled={!editavel} value={m.descricao} onChange={(e) => { const n = [...maoObra]; n[i].descricao = e.target.value; setMaoObra(n); }} /></div>
          <div style={{ width: 110 }}><CurrencyInput disabled={!editavel} value={m.valor} onChange={(v) => { const n = [...maoObra]; n[i].valor = v; setMaoObra(n); }} /></div>
          {editavel && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setMaoObra(maoObra.filter((_, x) => x !== i))}><Trash2 size={14} /></button>}
        </div>
      ))}
      {editavel && <button className="btn btn-sm" style={{ marginTop: 10 }} onClick={addMO}><Plus size={13} />Serviço</button>}

      <div className="divider" />
      <div className="row gap12" style={{ alignItems: 'center' }}>
        <span className="dim" style={{ fontSize: 13 }}>Desconto (R$)</span>
        <CurrencyInput style={{ width: 120 }} disabled={!editavel} value={desconto} onChange={(v) => setDesconto(v)} />
      </div>
      <div className="col gap4" style={{ marginTop: 14, fontSize: 13.5 }}>
        <div className="row" style={{ justifyContent: 'space-between' }}><span className="dim">Total peças</span><span>{fmtBRL(totalPecas)}</span></div>
        <div className="row" style={{ justifyContent: 'space-between' }}><span className="dim">Total mão de obra</span><span>{fmtBRL(totalMO)}</span></div>
        <div className="row" style={{ justifyContent: 'space-between', fontWeight: 700, fontSize: 16 }}><span>Total</span><span>{fmtBRL(total)}</span></div>
      </div>

      {editavel && (
        <div className="row gap8" style={{ marginTop: 16 }}>
          <button className="btn" onClick={salvar}>Salvar rascunho</button>
          <button className="btn btn-primary" onClick={enviar}>Enviar para aprovação do cliente →</button>
        </div>
      )}
      {order.status === 'AGUARDANDO_APROVACAO' && <div className="card2" style={{ marginTop: 14, fontSize: 13 }}>Orçamento aguardando decisão do cliente.</div>}
      {order.aprovacao && <AprovacaoStatus aprovacao={order.aprovacao} />}
    </div>
  );
}

function AprovacaoStatus({ aprovacao }) {
  const ok = aprovacao.status === 'aprovado';
  return (
    <div className="card2 row gap8" style={{ marginTop: 12, alignItems: 'center' }}>
      {ok ? <CheckCircle2 size={16} color="var(--success)" /> : <XCircle size={16} color="var(--danger)" />}
      <span style={{ fontSize: 13 }}>
        Orçamento <b>{ok ? 'aprovado' : 'recusado'}</b> por {aprovacao.usuario} em {fmtDateTime(aprovacao.data)}
        {aprovacao.observacao && ` — "${aprovacao.observacao}"`}
      </span>
    </div>
  );
}

function AbaPecas({ order, onSaved, onError }) {
  const [pecas, setPecas] = useState([]);
  const [pecaId, setPecaId] = useState('');
  const [qtd, setQtd] = useState(1);
  const podeUsar = order.status === 'EM_MANUTENCAO';

  // Lista de peças vem da API Java; se ela estiver fora do ar, usa a rota equivalente do Python.
  // (A baixa da peça na OS continua sendo feita pelo Python em /orders/{id}/pecas.)
  useEffect(() => {
    estoqueApi.get('/parts').catch(() => api.get('/parts')).then((r) => setPecas(r.data));
  }, [order]);

  async function usar() {
    if (!pecaId) return;
    try { await api.post(`/orders/${order.id}/pecas`, { pecaId, quantidade: Number(qtd) }); setPecaId(''); setQtd(1); onSaved(); }
    catch (e) { onError(e); }
  }

  return (
    <div className="card" style={{ maxWidth: 640 }}>
      {podeUsar && (
        <div className="row gap8" style={{ marginBottom: 16, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label className="label">Peça do estoque</label>
            <select className="select" value={pecaId} onChange={(e) => setPecaId(e.target.value)}>
              <option value="">Selecione…</option>
              {pecas.map((p) => <option key={p.id} value={p.id} disabled={p.quantidade === 0}>{p.nome} (estoque: {p.quantidade})</option>)}
            </select>
          </div>
          <div style={{ width: 90 }}>
            <label className="label">Qtd.</label>
            <input className="input" type="number" min={1} value={qtd} onChange={(e) => setQtd(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={usar}>Registrar uso</button>
        </div>
      )}
      {order.partsUsed.length === 0 ? <div className="dim" style={{ fontSize: 13 }}>Nenhuma peça registrada nesta OS.</div> : (
        <table><thead><tr><th>Peça</th><th>Qtd.</th><th>Data</th><th>Técnico</th></tr></thead>
          <tbody>{order.partsUsed.map((p) => (
            <tr key={p.id}><td>{p.nome}</td><td>{p.quantidade}</td><td className="dim">{fmtDateTime(p.data)}</td><td className="dim">{p.usuario}</td></tr>
          ))}</tbody>
        </table>
      )}
    </div>
  );
}

function AbaHistorico({ order }) {
  return (
    <div className="card" style={{ maxWidth: 560 }}>
      {order.statusHistory.map((h, i) => (
        <div key={i} className="row gap12" style={{ padding: '10px 0', borderBottom: i < order.statusHistory.length - 1 ? '1px solid var(--border)' : 'none' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', marginTop: 5 }} />
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}><StatusBadge status={h.statusNovo} /></div>
            <div className="dim" style={{ fontSize: 12, marginTop: 3 }}>{fmtDateTime(h.data)} · {h.usuario}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function AbaGarantia({ order }) {
  if (!order.garantia) return <div className="card" style={{ maxWidth: 480 }}><div className="dim" style={{ fontSize: 13 }}>A garantia é gerada automaticamente quando a OS é entregue.</div></div>;
  const vigente = new Date(order.garantia.dataFinal) >= new Date();
  return (
    <div className="card" style={{ maxWidth: 480 }}>
      <div className="col gap8" style={{ fontSize: 13.5 }}>
        <div><span className="dim">Período: </span>{order.garantia.periodoDias} dias</div>
        <div><span className="dim">Início: </span>{fmtDate(order.garantia.dataInicio)}</div>
        <div><span className="dim">Válida até: </span>{fmtDate(order.garantia.dataFinal)}</div>
        <div><span className="dim">Status: </span><span className={vigente ? '' : 'dim'} style={{ color: vigente ? 'var(--success)' : undefined, fontWeight: 700 }}>{vigente ? 'Vigente' : 'Vencida'}</span></div>
        <div><span className="dim">Condições: </span>{order.garantia.condicoes}</div>
      </div>
    </div>
  );
}
