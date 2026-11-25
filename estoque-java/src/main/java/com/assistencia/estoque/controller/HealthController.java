package com.assistencia.estoque.controller;

import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** Rotas públicas de diagnóstico, no mesmo formato do backend Python (/health, /health/db). */
@RestController
public class HealthController {

    private final JdbcTemplate jdbc;

    public HealthController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "ok");
    }

    @GetMapping("/health/db")
    public Map<String, String> healthDb() {
        try {
            jdbc.queryForObject("SELECT 1", Integer.class);
            return Map.of("api", "ok", "database", "ok");
        } catch (Exception e) {
            return Map.of("api", "ok", "database", "erro");
        }
    }
}
