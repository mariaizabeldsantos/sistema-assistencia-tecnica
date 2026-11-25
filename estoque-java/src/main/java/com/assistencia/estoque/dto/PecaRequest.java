package com.assistencia.estoque.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

/** Corpo de POST /parts e PUT /parts/{id}. Mesmos nomes de campo que o frontend já envia. */
public record PecaRequest(
        @NotBlank(message = PecaRequest.MSG_NOME)
        @Size(max = 150, message = PecaRequest.MSG_NOME)
        String nome,
        @Size(max = 100, message = PecaRequest.MSG_TAMANHO) String categoria,
        @Size(max = 100, message = PecaRequest.MSG_TAMANHO) String fabricante,
        @Size(max = 100, message = PecaRequest.MSG_TAMANHO) String modelo,
        @Size(max = 100, message = PecaRequest.MSG_TAMANHO) String codigo,
        @PositiveOrZero(message = PecaRequest.MSG_NEGATIVO) Integer quantidade,
        @PositiveOrZero(message = PecaRequest.MSG_NEGATIVO) Integer estoqueMinimo,
        @PositiveOrZero(message = PecaRequest.MSG_VALOR) BigDecimal custoAquisicao,
        @PositiveOrZero(message = PecaRequest.MSG_VALOR) BigDecimal precoOrcamento,
        @Size(max = 150, message = PecaRequest.MSG_TAMANHO) String fornecedor,
        @Size(max = 150, message = PecaRequest.MSG_TAMANHO) String localizacao) {

    static final String MSG_NOME = "Nome obrigatório (máx. 150 caracteres).";
    static final String MSG_NEGATIVO = "Quantidade e estoque mínimo não podem ser negativos.";
    static final String MSG_VALOR = "Valores monetários não podem ser negativos.";
    static final String MSG_TAMANHO = "Um dos campos excede o tamanho máximo permitido.";
}
