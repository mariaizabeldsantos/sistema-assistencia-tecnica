package com.assistencia.estoque.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.assistencia.estoque.model.Usuario;

public interface UsuarioRepository extends JpaRepository<Usuario, UUID> {
}
