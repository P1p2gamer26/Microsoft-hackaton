package com.asoexport.cvb.repository;
import com.asoexport.cvb.domain.InventoryMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface InventoryMovementRepository extends JpaRepository<InventoryMovement, Long> {
    List<InventoryMovement> findByCompanyIdOrderByMovementDateDesc(Long companyId);
    List<InventoryMovement> findByLotIdOrderByMovementDateDesc(Long lotId);
}
