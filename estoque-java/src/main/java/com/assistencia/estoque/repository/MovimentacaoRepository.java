package com.assistencia.estoque.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.assistencia.estoque.model.MovimentacaoEstoque;

public interface MovimentacaoRepository extends JpaRepository<MovimentacaoEstoque, UUID> {

    @Query("select m from MovimentacaoEstoque m where m.peca.id = :pecaId order by m.data desc")
    List<MovimentacaoEstoque> ultimasDaPeca(@Param("pecaId") UUID pecaId, Pageable limite);

    @Query("select m from MovimentacaoEstoque m join fetch m.peca order by m.data desc")
    List<MovimentacaoEstoque> historicoGeral(Pageable limite);
}
