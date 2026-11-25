package com.assistencia.estoque.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.assistencia.estoque.model.Peca;

/** Mesmo JSON do PartOut do FastAPI (camelCase), mais o campo extra "estoqueBaixo". */
public record PecaResponse(
        String id, String nome, String categoria, String fabricante, String modelo, String codigo,
        int quantidade, int estoqueMinimo, BigDecimal custoAquisicao, BigDecimal precoOrcamento,
        String fornecedor, String localizacao, String status,
        LocalDateTime createdAt, LocalDateTime updatedAt, boolean estoqueBaixo) {

    public static PecaResponse de(Peca p) {
        return new PecaResponse(
                p.getId().toString(), p.getNome(), p.getCategoria(), p.getFabricante(), p.getModelo(),
                p.getCodigo(), p.getQuantidade(), p.getEstoqueMinimo(), p.getCustoAquisicao(),
                p.getPrecoOrcamento(), p.getFornecedor(), p.getLocalizacao(), p.getStatus(),
                p.getCreatedAt(), p.getUpdatedAt(), p.isEstoqueBaixo());
    }
}
