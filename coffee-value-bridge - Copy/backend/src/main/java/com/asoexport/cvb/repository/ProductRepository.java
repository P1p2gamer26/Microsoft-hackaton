package com.asoexport.cvb.repository;
import com.asoexport.cvb.domain.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByCompanyId(Long companyId);
}
