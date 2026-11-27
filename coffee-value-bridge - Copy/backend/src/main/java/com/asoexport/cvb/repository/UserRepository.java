package com.asoexport.cvb.repository;
import com.asoexport.cvb.domain.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface UserRepository extends JpaRepository<AppUser, Long> {
    Optional<AppUser> findByEmail(String email);
    List<AppUser> findByPrimaryCompanyId(Long companyId);
}
