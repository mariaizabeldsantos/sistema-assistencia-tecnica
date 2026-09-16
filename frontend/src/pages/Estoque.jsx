import { useEffect, useState } from 'react';
import { Package, Plus, ArrowUpCircle, ArrowDownCircle, Edit3 } from 'lucide-react';
import api, { apiErrorMessage } from '../api/client';
import { PageHead, EmptyState, Modal, Field, Toast, CurrencyInput } from '../components/common';
import { fmtBRL, fmtDateTime } from '../utils';

export default function Estoque() {
  const [pecas, setPecas] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [editPeca, setEditPeca] = useState(null);
  const [movPeca, setMovPeca] = useState(null);
  const [toast, setToast] = useState(null);

  async function load() { const r = await api.get('/parts'); setPecas(r.data); }
  useEffect(() => { load(); }, []);

  function notify(msg, kind = 'success') { setToast({ msg, kind }); setTimeout(() => setToast(null), 3000); }

  return (
    <div>
      <Toast toast={toast} />
      <PageHead title="Estoque de peças" subtitle={`${pecas.length} peças cadastradas`}
        action={<button className="btn btn-primary" onClick={() => setShowNew(true)}><Plus size={15} />Nova peça</button>} />
      <div className="card" style={{ padding: 0 }}>
        {pecas.length === 0 ? <EmptyState icon={Package} text="Nenhuma peça cadastrada." /> : (
          <table><thead><tr><th>Peça</th><th>Categoria</th><th>Qtd.</th><th>Mín.</th><th>Preço orçamento</th><th></th></tr></thead>
            <tbody>
              {pecas.map((p) => {
                const baixo = p.quantidade <= p.estoqueMinimo;
                return (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.nome}</td>
                    <td className="dim">{p.categoria || '—'}</td>
                    <td className={baixo ? 'lowstock' : ''} style={{ fontWeight: baixo ? 700 : 400 }}>{p.quantidade}</td>
                    <td className="dim">{p.estoqueMinimo}</td>
                    <td className="dim">{fmtBRL(p.precoOrcamento)}</td>
                    <td>
                      <div className="row gap8">
                        <button className="btn btn-ghost btn-sm" title="Editar" onClick={() => setEditPeca(p)}><Edit3 size={14} /></button>
                        <button className="btn btn-ghost btn-sm" title="Movimentar" onClick={() => setMovPeca(p)}><ArrowUpCircle size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      {showNew && <PecaForm onClose={() => { setShowNew(false); load(); }} />}
      {editPeca && <PecaForm initial={editPeca} onClose={() => { setEditPeca(null); load(); }} />}
      {movPeca && <MovimentacaoModal peca={movPeca} onClose={() => setMovPeca(null)} onSaved={(msg) => { setMovPeca(null); load(); notify(msg); }} onError={(e) => notify(apiErrorMessage(e), 'error')} />}
    </div>
  );
}

function PecaForm({ initial, onClose }) {
  const isEdit = !!initial;
  const [f, setF] = useState(initial || {
    nome: '', categoria: '', fabricante: '', modelo: '', codigo: '',
    quantidade: 0, estoqueMinimo: 0, custoAquisicao: 0, precoOrcamento: 0, fornecedor: '', localizacao: '',
  });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!f.nome.trim()) { setErr('Informe o nome da peça.'); return; }
    setBusy(true);
    try {
      const payload = { ...f, quantidade: Number(f.quantidade), estoqueMinimo: Number(f.estoqueMinimo), custoAquisicao: Number(f.custoAquisicao), precoOrcamento: Number(f.precoOrcamento) };
      if (isEdit) await api.put(`/parts/${f.id}`, payload); else await api.post('/parts', payload);
      onClose();
    } catch (e2) { setErr(apiErrorMessage(e2)); } finally { setBusy(false); }
  }

  return (
    <Modal title={isEdit ? 'Editar peça' : 'Nova peça'} onClose={onClose} width={560}>
      <form onSubmit={submit}>
        <Field label="Nome" required><input className="input" value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></Field>
        <div className="row gap12" style={{ alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}><Field label="Categoria"><input className="input" value={f.categoria || ''} onChange={(e) => setF({ ...f, categoria: e.target.value })} /></Field></div>
          <div style={{ flex: 1 }}><Field label="Fabricante"><input className="input" value={f.fabricante || ''} onChange={(e) => setF({ ...f, fabricante: e.target.value })} /></Field></div>
        </div>
        <div className="row gap12" style={{ alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}><Field label="Modelo/código compatível"><input className="input" value={f.modelo || ''} onChange={(e) => setF({ ...f, modelo: e.target.value })} /></Field></div>
          <div style={{ flex: 1 }}><Field label="Código interno"><input className="input" value={f.codigo || ''} onChange={(e) => setF({ ...f, codigo: e.target.value })} /></Field></div>
        </div>
        {!isEdit && <div className="row gap12" style={{ alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}><Field label="Quantidade inicial"><input className="input" type="number" min={0} value={f.quantidade} onChange={(e) => setF({ ...f, quantidade: e.target.value })} /></Field></div>
          <div style={{ flex: 1 }}><Field label="Estoque mínimo"><input className="input" type="number" min={0} value={f.estoqueMinimo} onChange={(e) => setF({ ...f, estoqueMinimo: e.target.value })} /></Field></div>
        </div>}
        {isEdit && <div style={{ maxWidth: 200 }}><Field label="Estoque mínimo"><input className="input" type="number" min={0} value={f.estoqueMinimo} onChange={(e) => setF({ ...f, estoqueMinimo: e.target.value })} /></Field></div>}
        <div className="row gap12" style={{ alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}><Field label="Custo de aquisição (R$)"><CurrencyInput value={f.custoAquisicao} onChange={(v) => setF({ ...f, custoAquisicao: v })} /></Field></div>
          <div style={{ flex: 1 }}><Field label="Preço de orçamento (R$)"><CurrencyInput value={f.precoOrcamento} onChange={(v) => setF({ ...f, precoOrcamento: v })} /></Field></div>
        </div>
        <div className="row gap12" style={{ alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}><Field label="Fornecedor"><input className="input" value={f.fornecedor || ''} onChange={(e) => setF({ ...f, fornecedor: e.target.value })} /></Field></div>
          <div style={{ flex: 1 }}><Field label="Localização no estoque"><input className="input" value={f.localizacao || ''} onChange={(e) => setF({ ...f, localizacao: e.target.value })} /></Field></div>
        </div>
        {err && <div className="err" style={{ marginBottom: 10 }}>{err}</div>}
        <div className="row gap8" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" disabled={busy}>{isEdit ? 'Salvar' : 'Cadastrar peça'}</button>
        </div>
      </form>
    </Modal>
  );
}

function MovimentacaoModal({ peca, onClose, onSaved, onError }) {
  const [tipo, setTipo] = useState('entrada');
  const [quantidade, setQuantidade] = useState(1);
  const [motivo, setMotivo] = useState('');
  const [movs, setMovs] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => { api.get(`/parts/${peca.id}/movimentacoes`).then((r) => setMovs(r.data)); }, [peca]);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post(`/parts/${peca.id}/movimentar`, { tipo, quantidade: Number(quantidade), motivo });
      onSaved(`Estoque atualizado (${tipo === 'entrada' ? '+' : '-'}${quantidade}).`);
    } catch (e2) { onError(e2); } finally { setBusy(false); }
  }

  return (
    <Modal title={`Movimentar estoque — ${peca.nome}`} onClose={onClose} width={560}>
      <div className="dim" style={{ fontSize: 12.5, marginBottom: 12 }}>Estoque atual: <b style={{ color: 'var(--text)' }}>{peca.quantidade}</b></div>
      <form onSubmit={submit}>
        <div className="row gap12">
          <div style={{ flex: 1 }}>
            <Field label="Tipo">
              <select className="select" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                <option value="entrada">Entrada</option><option value="saida">Saída</option>
              </select>
            </Field>
          </div>
          <div style={{ width: 100 }}><Field label="Quantidade"><input className="input" type="number" min={1} value={quantidade} onChange={(e) => setQuantidade(e.target.value)} /></Field></div>
        </div>
        <Field label="Motivo"><input className="input" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex.: compra de reposição, ajuste de inventário…" /></Field>
        <div className="row gap8" style={{ justifyContent: 'flex-end', marginBottom: 18 }}>
          <button type="button" className="btn" onClick={onClose}>Fechar</button>
          <button className="btn btn-primary" disabled={busy}><ArrowDownCircle size={14} />Registrar movimentação</button>
        </div>
      </form>
      <div className="divider" />
      <span className="disp" style={{ fontWeight: 700, fontSize: 13 }}>Últimas movimentações</span>
      <div style={{ marginTop: 8 }}>
        {movs.length === 0 && <div className="dim" style={{ fontSize: 12.5 }}>Nenhuma movimentação registrada.</div>}
        {movs.map((m) => (
          <div key={m.id} className="row" style={{ justifyContent: 'space-between', padding: '6px 0', fontSize: 12.5, borderBottom: '1px solid var(--border)' }}>
            <span>{m.tipo === 'entrada' ? '+' : '-'}{m.quantidade} — {m.motivo}</span>
            <span className="dim">{fmtDateTime(m.data)}</span>
          </div>
        ))}
      </div>
    </Modal>
  );
}
