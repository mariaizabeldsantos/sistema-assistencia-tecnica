package com.assistencia.estoque.model;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/** Converte o enum para o texto gravado em stock_movements.tipo. */
@Converter(autoApply = true)
public class TipoMovimentacaoConverter implements AttributeConverter<TipoMovimentacao, String> {

    @Override
    public String convertToDatabaseColumn(TipoMovimentacao tipo) {
        return tipo == null ? null : tipo.getValor();
    }

    @Override
    public TipoMovimentacao convertToEntityAttribute(String valor) {
        return TipoMovimentacao.deValor(valor);
    }
}
