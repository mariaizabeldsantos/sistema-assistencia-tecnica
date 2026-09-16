import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { STATUS_LABEL, STATUS_COLOR } from '../utils';

export function Field({ label, required, error, hint, children }) {
  return (
    <div className="field">
      <label className="label">{label}{required && <span className="req"> *</span>}</label>
      {children}
      {error && <div className="err">{error}</div>}
      {!error && hint && <div className="hint">{hint}</div>}
    </div>
  );
}

export function Counter({ value, max }) {
  return <div className="counter">{(value || '').length}/{max}</div>;
}

// Campo de valor monetário no padrão brasileiro (vírgula como decimal).
// Digita livremente como texto; converte para número (com ponto) só ao sair do campo ou salvar.
// Campo de valor em Real (R$) no padrão "Nubank": os dígitos entram da direita para a
// esquerda (5 -> R$0,05; 50 -> R$0,50; 500 -> R$5,00). Controlado por centavos inteiros,
// evitando qualquer ambiguidade de vírgula/ponto ou problema de cursor em campo mascarado.
export function CurrencyInput({ value, onChange, disabled, style, placeholder }) {
  const toCents = (v) => {
    const n = typeof v === 'number' ? v : Number(v);
    if (Number.isNaN(n)) return 0;
    return Math.round(n * 100);
  };
  const [cents, setCents] = useState(toCents(value));
  const focusedRef = useRef(false);

  useEffect(() => {
    // Só resincroniza a partir de fora enquanto o campo não está em foco/digitação —
    // evita conflitar com o próprio onChange dessa digitação.
    if (!focusedRef.current) {
      setCents(toCents(value));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function format(c) {
    const negative = c < 0;
    const abs = Math.abs(c);
    const reais = Math.floor(abs / 100);
    const centavos = String(abs % 100).padStart(2, '0');
    return (negative ? '-' : '') + reais.toLocaleString('pt-BR') + ',' + centavos;
  }

  function commit(newCents) {
    const MAX = 9999999999; // teto de segurança (~R$ 99.999.999,99)
    if (newCents > MAX) newCents = MAX;
    if (newCents < 0) newCents = 0;
    setCents(newCents);
    onChange(newCents / 100);
  }

  function handleKeyDown(e) {
    if (disabled) return;
    if (/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      commit(cents * 10 + Number(e.key));
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      commit(Math.floor(cents / 10));
    }
    // demais teclas (Tab, setas, atalhos…) seguem o comportamento normal do navegador
  }

  function handlePaste(e) {
    if (disabled) return;
    e.preventDefault();
    const pasted = (e.clipboardData || window.clipboardData).getData('text');
    const digits = pasted.replace(/[^0-9]/g, '');
    if (!digits) return;
    commit(Number(digits.slice(-11)));
  }

  return (
    <div className="input" style={{ display: 'flex', alignItems: 'center', gap: 4, ...style }}>
      <span className="dim" style={{ fontSize: 13 }}>R$</span>
      <input
        type="text"
        inputMode="numeric"
        placeholder={placeholder || '0,00'}
        disabled={disabled}
        value={format(cents)}
        onChange={() => {}}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onFocus={() => { focusedRef.current = true; }}
        onBlur={() => { focusedRef.current = false; }}
        style={{ border: 'none', outline: 'none', width: '100%', background: 'transparent', color: 'var(--text)' }}
      />
    </div>
  );
}

export function Modal({ title, onClose, children, width }) {
  return (
    <div className="modal-bg" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={width ? { maxWidth: width } : {}}>
        <div className="modal-head">
          <span className="disp" style={{ fontSize: 16, fontWeight: 700 }}>{title}</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon, text, action }) {
  return (
    <div className="empty">
      {Icon && <Icon size={30} style={{ marginBottom: 10, opacity: 0.5 }} />}
      <div>{text}</div>
      {action}
    </div>
  );
}

export function PageHead({ title, subtitle, action }) {
  return (
    <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
      <div>
        <div className="disp" style={{ fontSize: 22, fontWeight: 700 }}>{title}</div>
        {subtitle && <div className="dim" style={{ fontSize: 13, marginTop: 3 }}>{subtitle}</div>}
      </div>
      {action}
    </div>
  );
}

export function BackLink({ onClick, label }) {
  return (
    <div className="dim" style={{ fontSize: 12.5, cursor: 'pointer', marginBottom: 14, display: 'inline-block' }} onClick={onClick}>
      ← {label}
    </div>
  );
}

export function StatusBadge({ status }) {
  const c = STATUS_COLOR[status] || '#8C96A6';
  return <span className="badge" style={{ background: c + '22', color: c, border: `1px solid ${c}55` }}>{STATUS_LABEL[status] || status}</span>;
}

export function Toast({ toast }) {
  if (!toast) return null;
  const bg = toast.kind === 'error' ? 'var(--danger-dim)' : toast.kind === 'warn' ? 'var(--amber-dim)' : 'var(--success-dim)';
  const fg = toast.kind === 'error' ? 'var(--danger)' : toast.kind === 'warn' ? 'var(--amber)' : 'var(--success)';
  return (
    <div style={{
      position: 'fixed', top: 16, right: 16, zIndex: 100, background: bg, color: fg,
      border: `1px solid ${fg}55`, padding: '11px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, maxWidth: 340,
    }}>
      {toast.msg}
    </div>
  );
}

export function ConfigListEditor({ items, novo, setNovo, onAdd, onRemove }) {
  return (
    <div style={{ marginTop: 10 }}>
      <div className="row gap8" style={{ marginBottom: 10 }}>
        <input className="input" value={novo} onChange={(e) => setNovo(e.target.value)} placeholder="Adicionar…"
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onAdd(); } }} />
        <button className="btn btn-sm" onClick={onAdd}>+</button>
      </div>
      <div className="row wrap gap8">
        {(items || []).map((it, i) => (
          <span key={i} className="tag row gap4">{it}<X size={11} style={{ cursor: 'pointer' }} onClick={() => onRemove(i)} /></span>
        ))}
      </div>
    </div>
  );
}

export function OSTimeline({ status }) {
  const STATUS_FLOW = ['ENTRADA', 'ORCAMENTO', 'AGUARDANDO_APROVACAO', 'EM_MANUTENCAO', 'PRONTO', 'ENTREGUE'];
  const idx = status === 'CANCELADO' ? -1 : STATUS_FLOW.indexOf(status);
  const n = STATUS_FLOW.length;
  const colPct = 100 / n;
  const centerFirst = colPct / 2; // % da largura total até o centro do 1º círculo (== até o centro do último, por simetria)
  const progressPct = idx <= 0 ? 0 : ((idx + 0.5) / n) * 100 - centerFirst;

  return (
    <div style={{ marginTop: 14, padding: '4px 6px', overflowX: 'auto' }}>
      <div style={{ position: 'relative', display: 'flex', minWidth: n * 84 }}>
        {/* Trilho de fundo: uma única linha do centro do 1º ao centro do último círculo */}
        <div style={{ position: 'absolute', top: 7, left: `${centerFirst}%`, right: `${centerFirst}%`, height: 2, background: 'var(--border)', zIndex: 0 }} />
        {/* Trilho preenchido, até o centro da etapa atual */}
        {progressPct > 0 && (
          <div style={{ position: 'absolute', top: 7, left: `${centerFirst}%`, width: `${progressPct}%`, height: 2, background: 'var(--accent)', zIndex: 0 }} />
        )}
        {STATUS_FLOW.map((s, i) => {
          const done = i < idx, current = i === idx;
          return (
            <div className="timeline-node" key={s} style={{ zIndex: 1 }}>
              <div className={'timeline-dot' + (done ? ' done' : '') + (current ? ' current' : '')}></div>
              <div className={'timeline-lbl' + (done ? ' done' : '') + (current ? ' current' : '')}>{STATUS_LABEL[s]}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
