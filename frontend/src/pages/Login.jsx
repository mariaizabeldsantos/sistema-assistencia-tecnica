import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Field } from '../components/common';
import { apiErrorMessage } from '../api/client';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      const data = await login(email.trim(), senha);
      navigate(data.role === 'admin' ? '/' : '/area');
    } catch (e2) {
      setErr(apiErrorMessage(e2, 'E-mail ou senha inválidos.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="card" style={{ maxWidth: 400, width: '100%' }}>
        <div className="row gap8" style={{ marginBottom: 18 }}>
          <Wrench size={20} color="var(--accent)" />
          <span className="disp" style={{ fontSize: 19, fontWeight: 700 }}>Assistência Técnica</span>
        </div>
        <form onSubmit={submit}>
          <Field label="E-mail"><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus /></Field>
          <Field label="Senha"><input className="input" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} /></Field>
          {err && <div className="err" style={{ marginBottom: 10 }}>{err}</div>}
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</button>
        </form>
        <p className="dim" style={{ fontSize: 12, textAlign: 'center', marginTop: 16 }}>
          Esqueceu sua senha? Peça para o administrador redefinir na tela "Meu perfil".
        </p>
      </div>
    </div>
  );
}
