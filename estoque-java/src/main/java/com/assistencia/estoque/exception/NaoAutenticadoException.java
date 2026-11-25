package com.assistencia.estoque.exception;

/** Token ausente, inválido ou expirado (vira HTTP 401). */
public class NaoAutenticadoException extends RuntimeException {

    public NaoAutenticadoException(String mensagem) {
        super(mensagem);
    }
}
