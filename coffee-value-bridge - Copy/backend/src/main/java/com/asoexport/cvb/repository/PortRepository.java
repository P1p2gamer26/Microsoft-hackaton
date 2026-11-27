package com.asoexport.cvb.repository;
import com.asoexport.cvb.domain.Port;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface PortRepository extends JpaRepository<Port, Long> {
    Optional<Port> findByCode(String code);
    List<Port> findByOriginColombia(boolean originColombia);
}
