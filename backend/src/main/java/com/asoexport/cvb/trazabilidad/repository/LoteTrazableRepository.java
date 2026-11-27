package com.asoexport.cvb.trazabilidad.repository;

import com.asoexport.cvb.trazabilidad.domain.LoteTrazable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LoteTrazableRepository extends JpaRepository<LoteTrazable, Long> {
    List<LoteTrazable> findByCompanyIdOrderByCodigoAsc(Long companyId);

    Optional<LoteTrazable> findByCompanyIdAndCodigo(Long companyId, String codigo);

    boolean existsByCompanyIdAndCodigo(Long companyId, String codigo);
}
