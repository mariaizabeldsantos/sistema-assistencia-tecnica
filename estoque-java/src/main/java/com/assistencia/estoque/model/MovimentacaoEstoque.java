package com.assistencia.estoque.model;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/** Registro imutável de uma entrada ou saída (tabela "stock_movements"). */
@Entity
@Table(name = "stock_movements")
public class MovimentacaoEstoque {

    @Id
    private UUID id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "peca_id")
    private Peca peca;

    @Column(nullable = false, length = 20)
    private TipoMovimentacao tipo;

    @Column(nullable = false)
    private int quantidade;

    private LocalDateTime data;
    private String usuario;
    private String motivo;

    /** Preenchido apenas quando a saída vem de uma ordem de serviço (escrito pelo Python). */
    @Column(name = "ordem_id")
    private UUID ordemId;

    protected MovimentacaoEstoque() {
    }

    public MovimentacaoEstoque(Peca peca, TipoMovimentacao tipo, int quantidade, String usuario, String motivo) {
        this.id = UUID.randomUUID();
        this.peca = peca;
        this.tipo = tipo;
        this.quantidade = quantidade;
        this.usuario = usuario;
        this.motivo = motivo;
        this.data = LocalDateTime.now(ZoneOffset.UTC);
    }

    public UUID getId() { return id; }
    public Peca getPeca() { return peca; }
    public TipoMovimentacao getTipo() { return tipo; }
    public int getQuantidade() { return quantidade; }
    public LocalDateTime getData() { return data; }
    public String getUsuario() { return usuario; }
    public String getMotivo() { return motivo; }
    public UUID getOrdemId() { return ordemId; }
}
