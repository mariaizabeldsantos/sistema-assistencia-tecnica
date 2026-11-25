package com.assistencia.estoque.service;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.assistencia.estoque.dto.MovimentacaoRequest;
import com.assistencia.estoque.dto.PecaRequest;
import com.assistencia.estoque.exception.RecursoNaoEncontradoException;
import com.assistencia.estoque.exception.RegraDeNegocioException;
import com.assistencia.estoque.model.MovimentacaoEstoque;
import com.assistencia.estoque.model.Peca;
import com.assistencia.estoque.model.RegistroAuditoria;
import com.assistencia.estoque.model.TipoMovimentacao;
import com.assistencia.estoque.repository.MovimentacaoRepository;
import com.assistencia.estoque.repository.PecaRepository;
import com.assistencia.estoque.repository.RegistroAuditoriaRepository;

/**
 * Regras de negócio do Estoque. Toda operação que altera uma peça roda numa transação que
 * começa com SELECT ... FOR UPDATE na linha (ver PecaRepository.buscarComTrava), a mesma
 * trava usada pelo Python ao dar baixa por ordem de serviço.
 */
@Service
public class EstoqueService {

    private static final int LIMITE_PADRAO_PECA = 20;

    private final PecaRepository pecas;
    private final MovimentacaoRepository movimentacoes;
    private final RegistroAuditoriaRepository auditoria;

    public EstoqueService(PecaRepository pecas, MovimentacaoRepository movimentacoes,
                          RegistroAuditoriaRepository auditoria) {
        this.pecas = pecas;
        this.movimentacoes = movimentacoes;
        this.auditoria = auditoria;
    }

    @Transactional(readOnly = true)
    public List<Peca> listar() {
        return pecas.findAllByOrderByNomeAsc();
    }

    @Transactional(readOnly = true)
    public List<Peca> listarEstoqueBaixo() {
        return pecas.findEstoqueBaixo();
    }

    @Transactional
    public Peca cadastrar(PecaRequest r, String usuario) {
        Peca peca = new Peca(r.nome(), r.categoria(), r.fabricante(), r.modelo(), r.codigo(),
                valor(r.quantidade()), valor(r.estoqueMinimo()), r.custoAquisicao(),
                r.precoOrcamento(), r.fornecedor(), r.localizacao());
        Peca salva = pecas.save(peca);
        registrarAuditoria("Peça cadastrada", salva.getNome(), usuario);
        return salva;
    }

    @Transactional
    public Peca editar(UUID id, PecaRequest r) {
        Peca peca = buscarComTrava(id);
        peca.atualizarDados(r.nome(), r.categoria(), r.fabricante(), r.modelo(), r.codigo(),
                valor(r.estoqueMinimo()), r.custoAquisicao(), r.precoOrcamento(),
                r.fornecedor(), r.localizacao());
        return peca;
    }

    @Transactional
    public Peca movimentar(UUID id, MovimentacaoRequest r, String usuario) {
        Peca peca = buscarComTrava(id);

        if (r.quantidade() == null || r.quantidade() < 1) {
            throw new RegraDeNegocioException("Informe uma quantidade válida.");
        }
        TipoMovimentacao tipo = TipoMovimentacao.deValor(r.tipo());
        if (tipo == null) {
            throw new RegraDeNegocioException("Tipo de movimentação inválido.");
        }

        int quantidade = r.quantidade();
        if (tipo == TipoMovimentacao.ENTRADA) {
            peca.registrarEntrada(quantidade);
        } else {
            peca.registrarSaida(quantidade); // lança EstoqueInsuficienteException se faltar saldo
        }

        String motivo = (r.motivo() == null || r.motivo().isBlank())
                ? (tipo == TipoMovimentacao.ENTRADA ? "Entrada manual" : "Ajuste manual")
                : r.motivo();
        movimentacoes.save(new MovimentacaoEstoque(peca, tipo, quantidade, usuario, motivo));
        registrarAuditoria("Movimentação de estoque",
                peca.getNome() + " — " + tipo.getValor() + " de " + quantidade, usuario);
        return peca;
    }

    @Transactional(readOnly = true)
    public List<MovimentacaoEstoque> historicoDaPeca(UUID pecaId) {
        return movimentacoes.ultimasDaPeca(pecaId, PageRequest.of(0, LIMITE_PADRAO_PECA));
    }

    @Transactional(readOnly = true)
    public List<MovimentacaoEstoque> historicoGeral(int limite) {
        return movimentacoes.historicoGeral(PageRequest.of(0, Math.max(1, Math.min(limite, 500))));
    }

    private Peca buscarComTrava(UUID id) {
        return pecas.buscarComTrava(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Peça não encontrada."));
    }

    private void registrarAuditoria(String acao, String detalhe, String usuario) {
        auditoria.save(new RegistroAuditoria(acao, detalhe, usuario));
    }

    private static int valor(Integer numero) {
        return numero == null ? 0 : numero;
    }
}
