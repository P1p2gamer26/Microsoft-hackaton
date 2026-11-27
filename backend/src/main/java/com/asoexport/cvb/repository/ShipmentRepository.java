package com.asoexport.cvb.repository;
import com.asoexport.cvb.domain.Shipment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface ShipmentRepository extends JpaRepository<Shipment, Long> {
    List<Shipment> findByCompanyId(Long companyId);
    Optional<Shipment> findByOrderId(Long orderId);
}
