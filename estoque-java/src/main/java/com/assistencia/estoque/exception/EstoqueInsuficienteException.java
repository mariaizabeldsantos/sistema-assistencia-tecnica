package com.assistencia.estoque.exception;

/** Saída maior que a quantidade disponível. Mensagem idêntica à do backend Python. */
public class EstoqueInsuficienteException extends RegraDeNegocioException {

    public EstoqueInsuficienteException() {
        super("Estoque insuficiente para realizar esta operação.");
    }
}
