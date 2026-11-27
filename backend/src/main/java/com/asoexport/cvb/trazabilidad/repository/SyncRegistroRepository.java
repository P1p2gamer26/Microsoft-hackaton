package com.asoexport.cvb.trazabilidad.repository;

import com.asoexport.cvb.trazabilidad.domain.SyncRegistro;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SyncRegistroRepository extends JpaRepository<SyncRegistro, String> {
    boolean existsByRegistroId(String registroId);
}
