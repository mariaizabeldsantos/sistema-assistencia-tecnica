package com.assistencia.estoque.model;

/** Tipo de movimentação. No banco é gravado em minúsculas ('entrada' / 'saida'), como no Python. */
public enum TipoMovimentacao {
    ENTRADA("entrada"),
    SAIDA("saida");

    private final String valor;

    TipoMovimentacao(String valor) {
        this.valor = valor;
    }

    public String getValor() {
        return valor;
    }

    /** Retorna null quando o texto não corresponde a nenhum tipo. */
    public static TipoMovimentacao deValor(String texto) {
        if (texto == null) {
            return null;
        }
        for (TipoMovimentacao tipo : values()) {
            if (tipo.valor.equals(texto)) {
                return tipo;
            }
        }
        return null;
    }
}
