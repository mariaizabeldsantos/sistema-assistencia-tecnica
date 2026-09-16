export const fmtDateTime = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};
export const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString('pt-BR') : '—');
export const fmtBRL = (n) => (Number(n) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const onlyDigits = (s) => (s || '').replace(/\D/g, '');

export function maskCPF(v) {
  v = onlyDigits(v).slice(0, 11);
  return v.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}
export function maskPhone(v) {
  v = onlyDigits(v).slice(0, 11);
  if (v.length <= 10) return v.replace(/(\d{2})(\d{4})(\d{0,4})/, (m, a, b, c) => (c ? `(${a}) ${b}-${c}` : b ? `(${a}) ${b}` : `(${a}`));
  return v.replace(/(\d{2})(\d{5})(\d{0,4})/, (m, a, b, c) => (c ? `(${a}) ${b}-${c}` : b ? `(${a}) ${b}` : `(${a}`));
}
export function validPhone(v) {
  const d = onlyDigits(v);
  return d.length === 10 || d.length === 11;
}
export function validEmail(v) {
  if (!v) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) && v.trim().length <= 254;
}

export const STATUS_FLOW = ['ENTRADA', 'ORCAMENTO', 'AGUARDANDO_APROVACAO', 'EM_MANUTENCAO', 'PRONTO', 'ENTREGUE'];
export const STATUS_LABEL = {
  ENTRADA: 'Entrada', ORCAMENTO: 'Orçamento',
  AGUARDANDO_APROVACAO: 'Aguardando aprovação',
  EM_MANUTENCAO: 'Em manutenção', PRONTO: 'Pronto', ENTREGUE: 'Entregue', CANCELADO: 'Cancelado',
};
export const STATUS_COLOR = {
  ENTRADA: '#5B9CF0', ORCAMENTO: '#F0AC3F', AGUARDANDO_APROVACAO: '#F0AC3F',
  EM_MANUTENCAO: '#2FE0C4', PRONTO: '#4CD787', ENTREGUE: '#8C96A6', CANCELADO: '#F0555B',
};
