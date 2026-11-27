package com.asoexport.cvb.repository;
import com.asoexport.cvb.domain.ExportCost;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface ExportCostRepository extends JpaRepository<ExportCost, Long> {
    Optional<ExportCost> findByProductionCostId(Long productionCostId);
}
