package com.assistencia.estoque.security;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Valida o JWT HS256 emitido pelo backend Python (python-jose), usando o mesmo SECRET_KEY.
 * Só VERIFICA tokens; o login continua sendo feito exclusivamente pelo FastAPI.
 * Rejeita: assinatura inválida, algoritmo diferente de HS256, token sem "exp" ou expirado.
 */
@Service
public class JwtService {

    private final byte[] segredo;
    private final ObjectMapper mapper;

    public JwtService(@Value("${app.secret-key}") String segredo, ObjectMapper mapper) {
        if (segredo == null || segredo.isBlank()) {
            throw new IllegalStateException("SECRET_KEY não configurada.");
        }
        this.segredo = segredo.getBytes(StandardCharsets.UTF_8);
        this.mapper = mapper;
    }

    /** Retorna o "sub" (id do usuário) se o token for válido; vazio caso contrário. */
    public Optional<String> extrairSubject(String token) {
        if (token == null) {
            return Optional.empty();
        }
        String[] partes = token.split("\\.");
        if (partes.length != 3) {
            return Optional.empty();
        }
        try {
            Base64.Decoder decoder = Base64.getUrlDecoder();
            JsonNode cabecalho = mapper.readTree(decoder.decode(partes[0]));
            if (!"HS256".equals(cabecalho.path("alg").asText())) {
                return Optional.empty();
            }

            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(segredo, "HmacSHA256"));
            byte[] esperada = mac.doFinal((partes[0] + "." + partes[1]).getBytes(StandardCharsets.US_ASCII));
            byte[] recebida = decoder.decode(partes[2]);
            if (!MessageDigest.isEqual(esperada, recebida)) {
                return Optional.empty();
            }

            JsonNode corpo = mapper.readTree(decoder.decode(partes[1]));
            if (!corpo.hasNonNull("exp") || corpo.get("exp").asLong() <= Instant.now().getEpochSecond()) {
                return Optional.empty();
            }
            String sub = corpo.path("sub").asText(null);
            return (sub == null || sub.isBlank()) ? Optional.empty() : Optional.of(sub);
        } catch (IllegalArgumentException | java.io.IOException | GeneralSecurityException e) {
            return Optional.empty();
        }
    }
}
