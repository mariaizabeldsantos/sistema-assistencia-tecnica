package com.assistencia.estoque.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.ObjectMapper;

/** Os tokens abaixo foram gerados em Python (HMAC-SHA256 da stdlib), no formato do python-jose. */
class JwtServiceTest {

    private static final String SEGREDO = "segredo-de-teste-com-mais-de-32-bytes!!";
    private static final String VALIDO =
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMTExMTExMS0xMTExLTExMTEtMTExMS0xMTExMTExMTExMTEiLCJleHAiOjQxMDI0NDQ4MDB9.ldEgzLWnNYEooSztoILomIkM6t_BpepU25-0O8702b4";
    private static final String EXPIRADO =
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMTExMTExMS0xMTExLTExMTEtMTExMS0xMTExMTExMTExMTEiLCJleHAiOjF9.gL1yrmVPBrQjkmj9LxAHGvZS6kfhlCEFhJNN0QhrxVw";
    private static final String OUTRA_CHAVE =
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ4IiwiZXhwIjo0MTAyNDQ0ODAwfQ.WuC6NkALLrrREFFMu-uFiOINAZe9d2G6unz2woxHnjU";

    private final JwtService jwt = new JwtService(SEGREDO, new ObjectMapper());

    @Test
    void aceitaTokenValidoGeradoPeloPython() {
        assertEquals("11111111-1111-1111-1111-111111111111", jwt.extrairSubject(VALIDO).orElseThrow());
    }

    @Test
    void rejeitaTokenExpirado() {
        assertTrue(jwt.extrairSubject(EXPIRADO).isEmpty());
    }

    @Test
    void rejeitaAssinaturaDeOutraChave() {
        assertTrue(jwt.extrairSubject(OUTRA_CHAVE).isEmpty());
    }

    @Test
    void rejeitaLixo() {
        assertTrue(jwt.extrairSubject("abc").isEmpty());
        assertTrue(jwt.extrairSubject(null).isEmpty());
        assertTrue(jwt.extrairSubject("a.b.c").isEmpty());
    }
}
