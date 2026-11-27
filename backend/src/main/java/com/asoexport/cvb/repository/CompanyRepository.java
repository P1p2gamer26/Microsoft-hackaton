package com.asoexport.cvb.repository;
import com.asoexport.cvb.domain.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface CompanyRepository extends JpaRepository<Company, Long> {
    Optional<Company> findByTaxId(String taxId);
}
