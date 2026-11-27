package com.asoexport.cvb.repository;
import com.asoexport.cvb.domain.Buyer;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface BuyerRepository extends JpaRepository<Buyer, Long> {
    List<Buyer> findByCompanyIdIsNullOrCompanyId(Long companyId);
}
