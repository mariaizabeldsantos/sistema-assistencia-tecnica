package com.assistencia.estoque.exception;

/** Violação de uma regra de negócio ou dado inválido (vira HTTP 400). */
public class RegraDeNegocioException extends RuntimeException {

    public RegraDeNegocioException(String mensagem) {
        super(mensagem);
    }
}
