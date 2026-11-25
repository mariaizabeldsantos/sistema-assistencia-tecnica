package com.assistencia.estoque.exception;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.web.ErrorResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Converte exceções em respostas {"detail": "mensagem"}, o mesmo formato do FastAPI,
 * que é o que o frontend (apiErrorMessage) já sabe ler.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    private ResponseEntity<Map<String, String>> resposta(HttpStatus status, String detalhe) {
        return ResponseEntity.status(status).body(Map.of("detail", detalhe));
    }

    @ExceptionHandler(RegraDeNegocioException.class)
    public ResponseEntity<Map<String, String>> regraDeNegocio(RegraDeNegocioException e) {
        return resposta(HttpStatus.BAD_REQUEST, e.getMessage());
    }

    @ExceptionHandler(RecursoNaoEncontradoException.class)
    public ResponseEntity<Map<String, String>> naoEncontrado(RecursoNaoEncontradoException e) {
        return resposta(HttpStatus.NOT_FOUND, e.getMessage());
    }

    @ExceptionHandler(NaoAutenticadoException.class)
    public ResponseEntity<Map<String, String>> naoAutenticado(NaoAutenticadoException e) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .header("WWW-Authenticate", "Bearer")
                .body(Map.of("detail", e.getMessage()));
    }

    @ExceptionHandler(AcessoNegadoException.class)
    public ResponseEntity<Map<String, String>> acessoNegado(AcessoNegadoException e) {
        return resposta(HttpStatus.FORBIDDEN, e.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> validacao(MethodArgumentNotValidException e) {
        String mensagem = e.getBindingResult().getFieldErrors().stream()
                .map(erro -> erro.getDefaultMessage())
                .sorted()
                .findFirst()
                .orElse("Dados inválidos.");
        return resposta(HttpStatus.BAD_REQUEST, mensagem);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, String>> corpoInvalido(HttpMessageNotReadableException e) {
        return resposta(HttpStatus.BAD_REQUEST, "Corpo da requisição inválido.");
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> integridade(DataIntegrityViolationException e) {
        log.warn("Violação de integridade no banco", e);
        return resposta(HttpStatus.BAD_REQUEST, "A operação viola as regras de integridade do estoque.");
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> inesperado(Exception e) {
        // Erros do próprio Spring (rota inexistente, método não permitido...) mantêm seu status.
        if (e instanceof ErrorResponse erro) {
            return resposta(HttpStatus.valueOf(erro.getStatusCode().value()), erro.getBody().getTitle() == null
                    ? "Requisição inválida." : erro.getBody().getTitle());
        }
        log.error("Erro inesperado", e);
        return resposta(HttpStatus.INTERNAL_SERVER_ERROR, "Erro interno do servidor.");
    }
}
