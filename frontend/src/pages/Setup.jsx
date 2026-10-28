import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Field } from '../components/common';
import { validEmail } from '../utils';
import { apiErrorMessage } from '../api/client';

export default function Setup() {
  const { setup, setupTokenRequired } = useAuth();
  const navigate = useNavigate();
  const [f, setF] = useState({ nomeAssistencia: '', nome: '', email: '', senha: '', senha2: '', codigo: '' });
  const [err, setErr] = useState({});
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    const errs = {};
    if (!f.nomeAssistencia.trim()) errs.nomeAssistencia = 'Informe o nome da assistência.';
    if (!f.nome.trim() || f.nome.trim().length < 3) errs.nome = 'Nome deve ter ao menos 3 caracteres.';
    if (!validEmail(f.email) || !f.email) errs.email = 'Informe um e-mail válido.';
    if (f.senha.length < 8 || f.senha.length > 64) errs.senha = 'A senha deve ter entre 8 e 64 caracteres.';
    if (f.senha !== f.senha2) errs.senha2 = 'As senhas não coincidem.';
    if (setupTokenRequired && !f.codigo.trim()) errs.codigo = 'Informe o código de configuração.';
    setErr(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      await setup({ nomeAssistencia: f.nomeAssistencia.trim(), nome: f.nome.trim(), email: f.email.trim(), senha: f.senha, codigoConfiguracao: f.codigo.trim() || undefined });
      navigate('/');
    } catch (e2) {
      setErr({ geral: apiErrorMessage(e2) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="card" style={{ maxWidth: 420, width: '100%' }}>
        <div className="row gap8" style={{ marginBottom: 18 }}>
          <Wrench size={20} color="var(--accent)" />
          <span className="disp" style={{ fontSize: 19, fontWeight: 700 }}>Primeiro acesso</span>
        </div>
        <form onSubmit={submit}>
          <Field label="Nome da assistência técnica" required error={err.nomeAssistencia}>
            <input className="input" value={f.nomeAssistencia} onChange={(e) => setF({ ...f, nomeAssistencia: e.target.value })} autoFocus />
          </Field>
          <Field label="Seu nome" required error={err.nome}>
            <input className="input" value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} />
          </Field>
          <Field label="E-mail" required error={err.email}>
            <input className="input" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          </Field>
          <Field label="Senha (8–64 caracteres)" required error={err.senha}>
            <input className="input" type="password" maxLength={64} value={f.senha} onChange={(e) => setF({ ...f, senha: e.target.value })} />
          </Field>
          <Field label="Confirmar senha" required error={err.senha2}>
            <input className="input" type="password" maxLength={64} value={f.senha2} onChange={(e) => setF({ ...f, senha2: e.target.value })} />
          </Field>
          {setupTokenRequired && (
            <Field label="Código de configuração" required error={err.codigo}>
              <input className="input" type="password" value={f.codigo} onChange={(e) => setF({ ...f, codigo: e.target.value })} />
            </Field>
          )}
          {err.geral && <div className="err" style={{ marginBottom: 10 }}>{err.geral}</div>}
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 6 }} disabled={busy}>
            {busy ? 'Criando…' : 'Criar conta e iniciar sistema'}
          </button>
        </form>
      </div>
    </div>
  );
}
