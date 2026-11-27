package com.asoexport.cvb.repository;
import com.asoexport.cvb.domain.CoffeeLot;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface CoffeeLotRepository extends JpaRepository<CoffeeLot, Long> {
    List<CoffeeLot> findByCompanyId(Long companyId);
    List<CoffeeLot> findByProductId(Long productId);
}
