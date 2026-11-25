package com.assistencia.estoque.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.assistencia.estoque.dto.MovimentacaoRequest;
import com.assistencia.estoque.dto.MovimentacaoResponse;
import com.assistencia.estoque.dto.PecaRequest;
import com.assistencia.estoque.dto.PecaResponse;
import com.assistencia.estoque.exception.RecursoNaoEncontradoException;
import com.assistencia.estoque.security.AutenticacaoInterceptor;
import com.assistencia.estoque.service.EstoqueService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

/**
 * Mesmas rotas do router /parts do FastAPI (o frontend não muda de contrato), mais
 * /parts/estoque-baixo e /parts/movimentacoes. O acesso só é liberado a admins
 * (ver AutenticacaoInterceptor).
 */
@RestController
@RequestMapping("/parts")
public class PecaController {

    private final EstoqueService servico;

    public PecaController(EstoqueService servico) {
        this.servico = servico;
    }

    @GetMapping
    public List<PecaResponse> listar() {
        return servico.listar().stream().map(PecaResponse::de).toList();
    }

    @GetMapping("/estoque-baixo")
    public List<PecaResponse> estoqueBaixo() {
        return servico.listarEstoqueBaixo().stream().map(PecaResponse::de).toList();
    }

    @GetMapping("/movimentacoes")
    public List<MovimentacaoResponse> historicoGeral(@RequestParam(defaultValue = "100") int limit) {
        return servico.historicoGeral(limit).stream().map(MovimentacaoResponse::de).toList();
    }

    @PostMapping
    public PecaResponse cadastrar(@Valid @RequestBody PecaRequest corpo, HttpServletRequest req) {
        return PecaResponse.de(servico.cadastrar(corpo, AutenticacaoInterceptor.usuarioDe(req)));
    }

    @PutMapping("/{id}")
    public PecaResponse editar(@PathVariable String id, @Valid @RequestBody PecaRequest corpo) {
        return PecaResponse.de(servico.editar(parseId(id), corpo));
    }

    @PostMapping("/{id}/movimentar")
    public PecaResponse movimentar(@PathVariable String id, @Valid @RequestBody MovimentacaoRequest corpo,
                                   HttpServletRequest req) {
        return PecaResponse.de(servico.movimentar(parseId(id), corpo, AutenticacaoInterceptor.usuarioDe(req)));
    }

    @GetMapping("/{id}/movimentacoes")
    public List<MovimentacaoResponse> historicoDaPeca(@PathVariable String id) {
        return servico.historicoDaPeca(parseId(id)).stream().map(MovimentacaoResponse::de).toList();
    }

    private static UUID parseId(String id) {
        try {
            return UUID.fromString(id);
        } catch (IllegalArgumentException e) {
            throw new RecursoNaoEncontradoException("Peça não encontrada.");
        }
    }
}
