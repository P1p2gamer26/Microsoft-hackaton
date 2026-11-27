package com.asoexport.cvb.repository;
import com.asoexport.cvb.domain.Warehouse;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface WarehouseRepository extends JpaRepository<Warehouse, Long> {
    List<Warehouse> findByCompanyId(Long companyId);
}
