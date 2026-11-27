package com.asoexport.cvb.repository;
import com.asoexport.cvb.domain.InventoryBalance;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface InventoryBalanceRepository extends JpaRepository<InventoryBalance, Long> {
    Optional<InventoryBalance> findByProductId(Long productId);
    List<InventoryBalance> findByCompanyId(Long companyId);
}
