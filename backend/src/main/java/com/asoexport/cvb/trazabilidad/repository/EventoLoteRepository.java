package com.asoexport.cvb.trazabilidad.repository;

import com.asoexport.cvb.trazabilidad.domain.EventoLote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EventoLoteRepository extends JpaRepository<EventoLote, Long> {
    List<EventoLote> findByLoteIdOrderByFechaAsc(Long loteId);
}
