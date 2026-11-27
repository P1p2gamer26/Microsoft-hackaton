package com.asoexport.cvb.repository;
import com.asoexport.cvb.domain.Quotation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface QuotationRepository extends JpaRepository<Quotation, Long> {
    List<Quotation> findByCompanyIdOrderByCreatedAtDesc(Long companyId);
}
