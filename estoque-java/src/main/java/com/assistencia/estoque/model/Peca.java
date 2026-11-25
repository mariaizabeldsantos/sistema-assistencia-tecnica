package com.assistencia.estoque.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

import org.hibernate.annotations.DynamicUpdate;

import com.assistencia.estoque.exception.EstoqueInsuficienteException;
import com.assistencia.estoque.exception.RegraDeNegocioException;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Peça em estoque (tabela "parts", compartilhada com o backend Python).
 *
 * Os atributos são privados e a quantidade só muda pelos métodos de negócio
 * {@link #registrarEntrada(int)} e {@link #registrarSaida(int)}, que protegem a
 * regra "o estoque nunca fica negativo".
 *
 * {@code @DynamicUpdate}: o UPDATE só inclui as colunas alteradas, então editar os
 * dados cadastrais nunca sobrescreve a quantidade com um valor antigo.
 */
@Entity
@Table(name = "parts")
@DynamicUpdate
public class Peca {

    @Id
    private UUID id;

    @Column(nullable = false, length = 150)
    private String nome;

    private String categoria;
    private String fabricante;
    private String modelo;
    private String codigo;

    private Integer quantidade;

    @Column(name = "estoque_minimo")
    private Integer estoqueMinimo;

    @Column(name = "custo_aquisicao")
    private BigDecimal custoAquisicao;

    @Column(name = "preco_orcamento")
    private BigDecimal precoOrcamento;

    private String fornecedor;
    private String localizacao;
    private String status;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /** Exigido pelo JPA. */
    protected Peca() {
    }

    public Peca(String nome, String categoria, String fabricante, String modelo, String codigo,
                int quantidadeInicial, int estoqueMinimo, BigDecimal custoAquisicao,
                BigDecimal precoOrcamento, String fornecedor, String localizacao) {
        if (quantidadeInicial < 0) {
            throw new RegraDeNegocioException("Quantidade e estoque mínimo não podem ser negativos.");
        }
        this.id = UUID.randomUUID();
        this.quantidade = quantidadeInicial;
        this.status = "ativo";
        this.createdAt = agora();
        atualizarDados(nome, categoria, fabricante, modelo, codigo, estoqueMinimo,
                custoAquisicao, precoOrcamento, fornecedor, localizacao);
    }

    /** Atualiza os dados cadastrais. A quantidade NÃO é alterada aqui (só por movimentação). */
    public void atualizarDados(String nome, String categoria, String fabricante, String modelo,
                               String codigo, int estoqueMinimo, BigDecimal custoAquisicao,
                               BigDecimal precoOrcamento, String fornecedor, String localizacao) {
        if (nome == null || nome.isBlank() || nome.trim().length() > 150) {
            throw new RegraDeNegocioException("Nome obrigatório (máx. 150 caracteres).");
        }
        if (estoqueMinimo < 0) {
            throw new RegraDeNegocioException("Quantidade e estoque mínimo não podem ser negativos.");
        }
        if (naoNegativo(custoAquisicao) || naoNegativo(precoOrcamento)) {
            throw new RegraDeNegocioException("Valores monetários não podem ser negativos.");
        }
        this.nome = nome.trim();
        this.categoria = categoria;
        this.fabricante = fabricante;
        this.modelo = modelo;
        this.codigo = codigo;
        this.estoqueMinimo = estoqueMinimo;
        this.custoAquisicao = custoAquisicao == null ? BigDecimal.ZERO : custoAquisicao;
        this.precoOrcamento = precoOrcamento == null ? BigDecimal.ZERO : precoOrcamento;
        this.fornecedor = fornecedor;
        this.localizacao = localizacao;
        this.updatedAt = agora();
    }

    public void registrarEntrada(int quantidadeEntrada) {
        validarQuantidadePositiva(quantidadeEntrada);
        this.quantidade = getQuantidade() + quantidadeEntrada;
        this.updatedAt = agora();
    }

    /** @throws EstoqueInsuficienteException se a saída for maior que o saldo disponível. */
    public void registrarSaida(int quantidadeSaida) {
        validarQuantidadePositiva(quantidadeSaida);
        if (getQuantidade() < quantidadeSaida) {
            throw new EstoqueInsuficienteException();
        }
        this.quantidade = getQuantidade() - quantidadeSaida;
        this.updatedAt = agora();
    }

    /** Estoque baixo: quantidade menor ou igual ao mínimo (mesmo critério do Python/relatórios). */
    public boolean isEstoqueBaixo() {
        return getQuantidade() <= getEstoqueMinimo();
    }

    private static void validarQuantidadePositiva(int q) {
        if (q < 1) {
            throw new RegraDeNegocioException("Informe uma quantidade válida.");
        }
    }

    private static boolean naoNegativo(BigDecimal valor) {
        return valor != null && valor.signum() < 0;
    }

    private static LocalDateTime agora() {
        return LocalDateTime.now(ZoneOffset.UTC);
    }

    public UUID getId() { return id; }
    public String getNome() { return nome; }
    public String getCategoria() { return categoria; }
    public String getFabricante() { return fabricante; }
    public String getModelo() { return modelo; }
    public String getCodigo() { return codigo; }
    public int getQuantidade() { return quantidade == null ? 0 : quantidade; }
    public int getEstoqueMinimo() { return estoqueMinimo == null ? 0 : estoqueMinimo; }
    public BigDecimal getCustoAquisicao() { return custoAquisicao == null ? BigDecimal.ZERO : custoAquisicao; }
    public BigDecimal getPrecoOrcamento() { return precoOrcamento == null ? BigDecimal.ZERO : precoOrcamento; }
    public String getFornecedor() { return fornecedor; }
    public String getLocalizacao() { return localizacao; }
    public String getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
