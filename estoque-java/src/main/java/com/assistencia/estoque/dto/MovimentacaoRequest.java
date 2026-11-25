package com.assistencia.estoque.dto;

import jakarta.validation.constraints.Size;

/** Corpo de POST /parts/{id}/movimentar: {"tipo": "entrada"|"saida", "quantidade": n, "motivo": "..."}. */
public record MovimentacaoRequest(
        String tipo,
        Integer quantidade,
        @Size(max = 255, message = "Motivo muito longo (máx. 255 caracteres).") String motivo) {
}
