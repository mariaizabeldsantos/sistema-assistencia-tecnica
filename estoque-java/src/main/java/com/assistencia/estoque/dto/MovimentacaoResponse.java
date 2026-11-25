package com.assistencia.estoque.dto;

import java.time.LocalDateTime;

import com.assistencia.estoque.model.MovimentacaoEstoque;

/** Mesmo JSON de GET /parts/{id}/movimentacoes do Python, com pecaId/pecaNome extras (histórico geral). */
public record MovimentacaoResponse(
        String id, String tipo, int quantidade, LocalDateTime data, String usuario,
        String motivo, String ordemId, String pecaId, String pecaNome) {

    public static MovimentacaoResponse de(MovimentacaoEstoque m) {
        return new MovimentacaoResponse(
                m.getId().toString(), m.getTipo().getValor(), m.getQuantidade(), m.getData(),
                m.getUsuario(), m.getMotivo(),
                m.getOrdemId() == null ? null : m.getOrdemId().toString(),
                m.getPeca().getId().toString(), m.getPeca().getNome());
    }
}
