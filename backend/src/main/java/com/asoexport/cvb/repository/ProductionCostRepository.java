package com.asoexport.cvb.repository;
import com.asoexport.cvb.domain.ProductionCost;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface ProductionCostRepository extends JpaRepository<ProductionCost, Long> {
    List<ProductionCost> findByCompanyIdOrderByCreatedAtDesc(Long companyId);
}
