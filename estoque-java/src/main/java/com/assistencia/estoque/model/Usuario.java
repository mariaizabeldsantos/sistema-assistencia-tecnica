package com.assistencia.estoque.model;

import java.util.UUID;

import org.hibernate.annotations.Immutable;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Visão somente leitura da tabela "users" (gerida pelo backend Python) para checar o papel. */
@Entity
@Table(name = "users")
@Immutable
public class Usuario {

    @Id
    private UUID id;

    private String name;
    private String role;

    protected Usuario() {
    }

    public UUID getId() { return id; }
    public String getName() { return name; }
    public String getRole() { return role; }
}
