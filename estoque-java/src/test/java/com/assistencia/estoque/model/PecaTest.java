package com.assistencia.estoque.model;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;

import org.junit.jupiter.api.Test;

import com.assistencia.estoque.exception.EstoqueInsuficienteException;
import com.assistencia.estoque.exception.RegraDeNegocioException;

class PecaTest {

    private Peca peca(int quantidade, int minimo) {
        return new Peca("SSD 240GB", "Armazenamento", "Kingston", null, "SSD-240",
                quantidade, minimo, new BigDecimal("100.00"), new BigDecimal("180.00"), null, null);
    }

    @Test
    void entradaSomaNaQuantidade() {
        Peca p = peca(5, 2);
        p.registrarEntrada(3);
        assertEquals(8, p.getQuantidade());
    }

    @Test
    void saidaSubtraiDaQuantidade() {
        Peca p = peca(5, 2);
        p.registrarSaida(5);
        assertEquals(0, p.getQuantidade());
    }

    @Test
    void saidaMaiorQueDisponivelEhBloqueadaESaldoNaoMuda() {
        Peca p = peca(2, 0);
        EstoqueInsuficienteException e = assertThrows(EstoqueInsuficienteException.class, () -> p.registrarSaida(3));
        assertEquals("Estoque insuficiente para realizar esta operação.", e.getMessage());
        assertEquals(2, p.getQuantidade());
    }

    @Test
    void quantidadeDeMovimentacaoPrecisaSerPositiva() {
        Peca p = peca(2, 0);
        assertThrows(RegraDeNegocioException.class, () -> p.registrarEntrada(0));
        assertThrows(RegraDeNegocioException.class, () -> p.registrarSaida(-1));
    }

    @Test
    void estoqueBaixoQuandoQuantidadeMenorOuIgualAoMinimo() {
        assertTrue(peca(2, 2).isEstoqueBaixo());
        assertTrue(peca(1, 2).isEstoqueBaixo());
        assertFalse(peca(3, 2).isEstoqueBaixo());
    }

    @Test
    void editarDadosNaoAlteraQuantidade() {
        Peca p = peca(7, 2);
        p.atualizarDados("SSD 480GB", null, null, null, null, 4, BigDecimal.ONE, BigDecimal.TEN, null, null);
        assertEquals("SSD 480GB", p.getNome());
        assertEquals(4, p.getEstoqueMinimo());
        assertEquals(7, p.getQuantidade());
    }

    @Test
    void rejeitaNomeVazioEValoresNegativos() {
        assertThrows(RegraDeNegocioException.class, () -> new Peca(" ", null, null, null, null, 0, 0, null, null, null, null));
        assertThrows(RegraDeNegocioException.class, () -> new Peca("X", null, null, null, null, -1, 0, null, null, null, null));
        assertThrows(RegraDeNegocioException.class, () -> new Peca("X", null, null, null, null, 0, -1, null, null, null, null));
    }
}
