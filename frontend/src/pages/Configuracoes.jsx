import { useEffect, useState } from 'react';
import api, { apiErrorMessage } from '../api/client';
import { PageHead, Field, ConfigListEditor, Toast } from '../components/common';

// Este arquivo junta duas telas administrativas pequenas — Configurações
// (dados da assistência) e Perfil (dados do usuário logado) — porque as
// duas têm o mesmo "tamanho" e o mesmo propósito (telas de ajuste, não o
// núcleo do sistema). Continuam sendo rotas separadas (/configuracoes e
// /perfil); só o arquivo do código é o mesmo.

export function Configuracoes() {
  const [f, setF] = useState(null);
  const [novaCategoria, setNovaCategoria] = useState('');
  const [novaMarca, setNovaMarca] = useState('');
  const [novoServico, setNovoServico] = useState('');
  const [toast, setToast] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => { api.get('/settings').then((r) => setF(r.data)); }, []);

  function notify(msg, kind = 'success') { setToast({ msg, kind }); setTimeout(() => setToast(null), 3000); }

  async function salvar(e) {
    e.preventDefault();
    setErr('');
    try {
      const r = await api.put('/settings', f);
      setF(r.data);
      notify('Configurações salvas.');
    } catch (e2) { setErr(apiErrorMessage(e2)); }
  }

  if (!f) return null;

  return (
    <div>
      <Toast toast={toast} />
      <PageHead title="Configurações" subtitle="Dados da assistência, categorias e serviços padrão" />
      <form onSubmit={salvar}>
        <div className="row wrap gap16" style={{ alignItems: 'flex-start' }}>
          <div className="card" style={{ flex: 1, minWidth: 300 }}>
            <span className="disp" style={{ fontWeight: 700, fontSize: 14 }}>Dados da assistência</span>
            <div style={{ marginTop: 12 }}>
              <Field label="Nome" required><input className="input" value={f.nomeAssistencia} onChange={(e) => setF({ ...f, nomeAssistencia: e.target.value })} /></Field>
              <Field label="Telefone"><input className="input" value={f.telefone || ''} onChange={(e) => setF({ ...f, telefone: e.target.value })} /></Field>
              <Field label="WhatsApp"><input className="input" value={f.whatsapp || ''} onChange={(e) => setF({ ...f, whatsapp: e.target.value })} /></Field>
              <Field label="E-mail"><input className="input" value={f.email || ''} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
              <Field label="Endereço"><input className="input" value={f.endereco || ''} onChange={(e) => setF({ ...f, endereco: e.target.value })} /></Field>
              <Field label="Garantia padrão (dias)"><input className="input" type="number" min={0} style={{ maxWidth: 140 }} value={f.garantiaPadraoDias} onChange={(e) => setF({ ...f, garantiaPadraoDias: Number(e.target.value) })} /></Field>
            </div>
          </div>

          <div className="col gap16" style={{ flex: 1, minWidth: 300 }}>
            <div className="card">
              <span className="disp" style={{ fontWeight: 700, fontSize: 14 }}>Categorias de peças</span>
              <ConfigListEditor items={f.categorias} novo={novaCategoria} setNovo={setNovaCategoria}
                onAdd={() => { if (novaCategoria.trim()) { setF({ ...f, categorias: [...f.categorias, novaCategoria.trim()] }); setNovaCategoria(''); } }}
                onRemove={(i) => setF({ ...f, categorias: f.categorias.filter((_, x) => x !== i) })} />
            </div>
            <div className="card">
              <span className="disp" style={{ fontWeight: 700, fontSize: 14 }}>Marcas atendidas</span>
              <ConfigListEditor items={f.marcas} novo={novaMarca} setNovo={setNovaMarca}
                onAdd={() => { if (novaMarca.trim()) { setF({ ...f, marcas: [...f.marcas, novaMarca.trim()] }); setNovaMarca(''); } }}
                onRemove={(i) => setF({ ...f, marcas: f.marcas.filter((_, x) => x !== i) })} />
            </div>
            <div className="card">
              <span className="disp" style={{ fontWeight: 700, fontSize: 14 }}>Serviços oferecidos</span>
              <ConfigListEditor items={f.servicos} novo={novoServico} setNovo={setNovoServico}
                onAdd={() => { if (novoServico.trim()) { setF({ ...f, servicos: [...f.servicos, novoServico.trim()] }); setNovoServico(''); } }}
                onRemove={(i) => setF({ ...f, servicos: f.servicos.filter((_, x) => x !== i) })} />
            </div>
          </div>
        </div>
        {err && <div className="err" style={{ margin: '14px 0' }}>{err}</div>}
        <button className="btn btn-primary" style={{ marginTop: 16 }}>Salvar configurações</button>
      </form>
    </div>
  );
}

export function Perfil() {
  const [f, setF] = useState({ nome: '', email: '' });
  const [senhas, setSenhas] = useState({ senhaAtual: '', novaSenha: '', confirmar: '' });
  const [toast, setToast] = useState(null);
  const [errPerfil, setErrPerfil] = useState('');
  const [errSenha, setErrSenha] = useState('');

  useEffect(() => { api.get('/auth/me').then((r) => setF({ nome: r.data.name, email: r.data.email })); }, []);

  function notify(msg, kind = 'success') { setToast({ msg, kind }); setTimeout(() => setToast(null), 3000); }

  async function salvarPerfil(e) {
    e.preventDefault();
    setErrPerfil('');
    try { await api.put('/profile', { nome: f.nome, email: f.email }); notify('Perfil atualizado.'); }
    catch (e2) { setErrPerfil(apiErrorMessage(e2)); }
  }

  async function salvarSenha(e) {
    e.preventDefault();
    setErrSenha('');
    if (senhas.novaSenha !== senhas.confirmar) { setErrSenha('As senhas não coincidem.'); return; }
    try {
      await api.put('/profile/senha', { senhaAtual: senhas.senhaAtual, novaSenha: senhas.novaSenha });
      setSenhas({ senhaAtual: '', novaSenha: '', confirmar: '' });
      notify('Senha alterada com sucesso.');
    } catch (e2) { setErrSenha(apiErrorMessage(e2)); }
  }

  return (
    <div>
      <Toast toast={toast} />
      <PageHead title="Meu perfil" />
      <div className="row wrap gap16" style={{ alignItems: 'flex-start' }}>
        <form className="card" style={{ flex: 1, minWidth: 300 }} onSubmit={salvarPerfil}>
          <span className="disp" style={{ fontWeight: 700, fontSize: 14 }}>Dados pessoais</span>
          <div style={{ marginTop: 12 }}>
            <Field label="Nome" required><input className="input" value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></Field>
            <Field label="E-mail" required><input className="input" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
          </div>
          {errPerfil && <div className="err" style={{ marginBottom: 10 }}>{errPerfil}</div>}
          <button className="btn btn-primary">Salvar alterações</button>
        </form>

        <form className="card" style={{ flex: 1, minWidth: 300 }} onSubmit={salvarSenha}>
          <span className="disp" style={{ fontWeight: 700, fontSize: 14 }}>Alterar senha</span>
          <div style={{ marginTop: 12 }}>
            <Field label="Senha atual" required><input className="input" type="password" value={senhas.senhaAtual} onChange={(e) => setSenhas({ ...senhas, senhaAtual: e.target.value })} /></Field>
            <Field label="Nova senha (8–64 caracteres)" required><input className="input" type="password" maxLength={64} value={senhas.novaSenha} onChange={(e) => setSenhas({ ...senhas, novaSenha: e.target.value })} /></Field>
            <Field label="Confirmar nova senha" required><input className="input" type="password" maxLength={64} value={senhas.confirmar} onChange={(e) => setSenhas({ ...senhas, confirmar: e.target.value })} /></Field>
          </div>
          {errSenha && <div className="err" style={{ marginBottom: 10 }}>{errSenha}</div>}
          <button className="btn btn-primary">Alterar senha</button>
        </form>
      </div>
    </div>
  );
}
