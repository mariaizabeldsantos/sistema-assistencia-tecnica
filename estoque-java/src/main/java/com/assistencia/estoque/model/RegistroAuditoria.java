package com.assistencia.estoque.model;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Linha de auditoria (tabela "audit_log"), a mesma usada pelos relatórios do sistema. */
@Entity
@Table(name = "audit_log")
public class RegistroAuditoria {

    @Id
    private UUID id;

    @Column(nullable = false)
    private String acao;

    private String detalhe;
    private String usuario;
    private LocalDateTime data;

    protected RegistroAuditoria() {
    }

    public RegistroAuditoria(String acao, String detalhe, String usuario) {
        this.id = UUID.randomUUID();
        this.acao = acao;
        this.detalhe = detalhe;
        this.usuario = usuario;
        this.data = LocalDateTime.now(ZoneOffset.UTC);
    }

    public UUID getId() { return id; }
    public String getAcao() { return acao; }
    public String getDetalhe() { return detalhe; }
    public String getUsuario() { return usuario; }
    public LocalDateTime getData() { return data; }
}
