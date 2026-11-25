package com.assistencia.estoque.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.assistencia.estoque.model.Peca;

public interface PecaRepository extends JpaRepository<Peca, UUID> {

    List<Peca> findAllByOrderByNomeAsc();

    @Query("select p from Peca p where p.quantidade <= p.estoqueMinimo order by p.nome")
    List<Peca> findEstoqueBaixo();

    /**
     * SELECT ... FOR UPDATE na linha da peça. É exatamente a mesma trava que o backend Python
     * pega em orders.py (usar_peca) com with_for_update(): quem chegar depois espera o outro
     * terminar a transação, então Java e Python nunca gravam a quantidade ao mesmo tempo.
     * Só funciona dentro de uma transação (@Transactional no serviço).
     */
    @Query(value = "SELECT * FROM parts WHERE id = :id FOR UPDATE", nativeQuery = true)
    Optional<Peca> buscarComTrava(@Param("id") UUID id);
}
