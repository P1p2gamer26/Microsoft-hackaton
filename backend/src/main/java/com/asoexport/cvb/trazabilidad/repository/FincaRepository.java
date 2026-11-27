package com.asoexport.cvb.trazabilidad.repository;

import com.asoexport.cvb.trazabilidad.domain.Finca;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FincaRepository extends JpaRepository<Finca, Long> {
    List<Finca> findByCompanyIdOrderByCodigoAsc(Long companyId);

    Optional<Finca> findByCompanyIdAndCodigo(Long companyId, String codigo);
}
