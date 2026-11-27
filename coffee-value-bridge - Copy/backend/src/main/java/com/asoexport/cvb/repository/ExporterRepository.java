package com.asoexport.cvb.repository;
import com.asoexport.cvb.domain.Exporter;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface ExporterRepository extends JpaRepository<Exporter, Long> {
    Optional<Exporter> findByCompanyId(Long companyId);
}
