package com.assistencia.estoque.exception;

/** Usuário autenticado sem permissão (vira HTTP 403). */
public class AcessoNegadoException extends RuntimeException {

    public AcessoNegadoException(String mensagem) {
        super(mensagem);
    }
}
