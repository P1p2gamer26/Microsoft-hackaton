package com.asoexport.cvb.repository;
import com.asoexport.cvb.domain.DataSourceConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface DataSourceConfigRepository extends JpaRepository<DataSourceConfig, Long> {
    Optional<DataSourceConfig> findByCode(String code);
}
