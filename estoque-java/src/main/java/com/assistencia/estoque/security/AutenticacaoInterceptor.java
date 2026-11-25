package com.assistencia.estoque.security;

import java.util.UUID;

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import com.assistencia.estoque.exception.AcessoNegadoException;
import com.assistencia.estoque.exception.NaoAutenticadoException;
import com.assistencia.estoque.model.Usuario;
import com.assistencia.estoque.repository.UsuarioRepository;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Equivalente Java do get_current_user + require_admin do FastAPI: valida o Bearer token e
 * confere no banco que o usuário existe e tem role "admin". Roda dentro do MVC (e não como
 * filtro de servlet) para que os erros 401/403 saiam com cabeçalhos CORS e no formato
 * {"detail": ...}, permitindo que o interceptor do axios trate o 401.
 */
@Component
public class AutenticacaoInterceptor implements HandlerInterceptor {

    private static final String ATRIBUTO_USUARIO = "estoque.usuario.nome";

    private final JwtService jwt;
    private final UsuarioRepository usuarios;

    public AutenticacaoInterceptor(JwtService jwt, UsuarioRepository usuarios) {
        this.jwt = jwt;
        this.usuarios = usuarios;
    }

    @Override
    public boolean preHandle(HttpServletRequest req, HttpServletResponse res, Object handler) {
        if ("OPTIONS".equalsIgnoreCase(req.getMethod())) {
            return true; // preflight de CORS não leva token
        }
        String cabecalho = req.getHeader("Authorization");
        if (cabecalho == null || !cabecalho.regionMatches(true, 0, "Bearer ", 0, 7)) {
            throw new NaoAutenticadoException("Not authenticated");
        }
        String sub = jwt.extrairSubject(cabecalho.substring(7).trim())
                .orElseThrow(() -> new NaoAutenticadoException("Não foi possível validar as credenciais."));

        UUID idUsuario;
        try {
            idUsuario = UUID.fromString(sub);
        } catch (IllegalArgumentException e) {
            throw new NaoAutenticadoException("Não foi possível validar as credenciais.");
        }
        Usuario usuario = usuarios.findById(idUsuario)
                .orElseThrow(() -> new NaoAutenticadoException("Não foi possível validar as credenciais."));
        if (!"admin".equals(usuario.getRole())) {
            throw new AcessoNegadoException("Acesso restrito à equipe da assistência.");
        }
        req.setAttribute(ATRIBUTO_USUARIO, usuario.getName());
        return true;
    }

    /** Nome do usuário autenticado na requisição atual (usado nas movimentações e auditoria). */
    public static String usuarioDe(HttpServletRequest req) {
        return (String) req.getAttribute(ATRIBUTO_USUARIO);
    }
}
