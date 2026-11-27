package com.asoexport.cvb.repository;
import com.asoexport.cvb.domain.ExportDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface ExportDocumentRepository extends JpaRepository<ExportDocument, Long> {
    List<ExportDocument> findByCompanyIdOrderByUploadedAtDesc(Long companyId);
    List<ExportDocument> findByOrderId(Long orderId);
}
