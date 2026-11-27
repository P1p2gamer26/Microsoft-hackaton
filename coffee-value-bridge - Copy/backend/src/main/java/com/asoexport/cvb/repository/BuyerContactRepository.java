package com.asoexport.cvb.repository;
import com.asoexport.cvb.domain.BuyerContact;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface BuyerContactRepository extends JpaRepository<BuyerContact, Long> {
    List<BuyerContact> findByBuyerId(Long buyerId);
}
