package com.assistencia.estoque.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.assistencia.estoque.model.RegistroAuditoria;

public interface RegistroAuditoriaRepository extends JpaRepository<RegistroAuditoria, UUID> {
}
