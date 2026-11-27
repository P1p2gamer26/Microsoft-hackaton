package com.asoexport.cvb.service;

import com.asoexport.cvb.common.ApiException;
import com.asoexport.cvb.common.DataProvenance;
import com.asoexport.cvb.common.TenantContext;
import com.asoexport.cvb.domain.Country;
import com.asoexport.cvb.domain.ExportDocument;
import com.asoexport.cvb.domain.RegulatoryRequirement;
import com.asoexport.cvb.repository.CountryRepository;
import com.asoexport.cvb.repository.ExportDocumentRepository;
import com.asoexport.cvb.repository.RegulatoryRequirementRepository;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class ExportCopilotService {

    private final RegulatoryRequirementRepository regRepo;
    private final ExportDocumentRepository docRepo;
    private final CountryRepository countryRepo;
    private final AuditService audit;

    public ExportCopilotService(RegulatoryRequirementRepository regRepo, ExportDocumentRepository docRepo,
                                CountryRepository countryRepo, AuditService audit) {
        this.regRepo = regRepo;
        this.docRepo = docRepo;
        this.countryRepo = countryRepo;
        this.audit = audit;
    }

    public Map<String, Object> analyzeExportQuery(Map<String, Object> body) {
        Long companyId = TenantContext.resolveCompanyId(null);
        String prompt = String.valueOf(body.getOrDefault("prompt", ""));
        String lower = prompt.toLowerCase(Locale.ROOT);

        String destIso2 = String.valueOf(body.getOrDefault("destinationIso2", "")).toUpperCase();
        if (destIso2.isBlank()) {
            if (lower.contains("estados unidos") || lower.contains("ee.uu") || lower.contains("usa") || lower.contains("miami")) destIso2 = "US";
            else if (lower.contains("alemania") || lower.contains("europa") || lower.contains("hamburgo")) destIso2 = "DE";
            else if (lower.contains("japón") || lower.contains("japon") || lower.contains("tokio")) destIso2 = "JP";
            else if (lower.contains("españa") || lower.contains("espana")) destIso2 = "ES";
            else if (lower.contains("canadá") || lower.contains("canada")) destIso2 = "CA";
            else if (lower.contains("corea")) destIso2 = "KR";
            else destIso2 = "US";
        }

        boolean isDecaf = lower.contains("descafein") || lower.contains("decaf");
        boolean isGround = lower.contains("molido") || lower.contains("ground");
        String hsCode = isDecaf ? "090122" : "090121";

        double quantityKg = 500.0;
        Matcher m = Pattern.compile("(\\d+(?:[.,]\\d+)?)\\s*(kg|kilos|kilogramos|ton)").matcher(lower);
        if (m.find()) {
            double val = Double.parseDouble(m.group(1).replace(",", "."));
            quantityKg = m.group(2).startsWith("ton") ? val * 1000 : val;
        } else if (body.get("quantityKg") != null) {
            quantityKg = Double.parseDouble(String.valueOf(body.get("quantityKg")));
        }

        String finalDestIso2 = destIso2;
        Country country = countryRepo.findByIso2(destIso2).orElseGet(() -> countryRepo.findByIso2("US").orElseThrow());
        List<RegulatoryRequirement> reqs = regRepo.findByCountryIso2(country.getIso2());
        if (reqs.isEmpty()) {
            reqs = regRepo.findByCountryIso2("US");
        }

        List<String> requiredDocs = new ArrayList<>(List.of(
                "Factura comercial (Commercial Invoice)",
                "Lista de empaque (Packing List) con pesos netos/brutos y lotes",
                "Ficha técnica y vida útil validada por el fabricante",
                "Documento de transporte internacional (BL marítimo o AWB aéreo)",
                "Declaración de exportación aduanera (DEX - DIAN Colombia)",
                "Registro exportador de café ante la Federación Nacional de Cafeteros (cuando aplique)"
        ));
        if ("US".equals(country.getIso2())) {
            requiredDocs.add("Confirmación FDA Prior Notice (obligatorio antes del arribo)");
            requiredDocs.add("Número de Registro de Instalación FDA (Food Facility Registration) y datos del importador FSVP");
            requiredDocs.add("Certificado de Origen TLC Colombia–EE.UU. (recomendado/aplicable según preferencia)");
        } else if (List.of("DE", "BE", "NL", "ES").contains(country.getIso2())) {
            requiredDocs.add("Declaración de Diligencia Debida EUDR con geolocalización de origen");
            requiredDocs.add("Certificado EUR.1 / Declaración en factura Acuerdo Comercial Colombia–UE");
        } else if ("JP".equals(country.getIso2())) {
            requiredDocs.add("Notificación de Importación de Alimentos ante MHLW y análisis de ocratoxina A");
        }

        List<ExportDocument> existingDocs = companyId != null
                ? docRepo.findByCompanyIdOrderByUploadedAtDesc(companyId) : List.of();
        Set<String> uploadedTypes = new HashSet<>();
        existingDocs.stream().filter(d -> !"MISSING".equals(d.getStatus())).forEach(d -> uploadedTypes.add(d.getDocumentType()));

        List<String> missingAlerts = new ArrayList<>();
        for (String reqType : List.of("COMMERCIAL_INVOICE", "PACKING_LIST", "TECH_SHEET", "ORIGIN_CERT", "SANITARY_CERT")) {
            if (!uploadedTypes.contains(reqType)) {
                missingAlerts.add("Documento no cargado o pendiente en biblioteca: " + reqType);
            }
        }

        List<Map<String, Object>> timeline = List.of(
                Map.of("step", 1, "phase", "Verificación regulatoria y registro planta", "estimatedDays", "3-7 días", "type", "OBLIGATORIO"),
                Map.of("step", 2, "phase", "Tostión, molienda, empaque con válvula y etiquetado del país destino", "estimatedDays", "2-5 días", "type", "OBLIGATORIO"),
                Map.of("step", 3, "phase", "Emisión de factura comercial, packing list, ficha técnica y certificado de origen", "estimatedDays", "1-3 días", "type", "OBLIGATORIO"),
                Map.of("step", 4, "phase", "Trámite aduanero DIAN (DEX) y notificación sanitaria previa (ej. FDA Prior Notice)", "estimatedDays", "1-2 días", "type", "OBLIGATORIO"),
                Map.of("step", 5, "phase", "Despacho a puerto/aeropuerto, tránsito internacional y nacionalización con importador", "estimatedDays", "2-18 días según modo", "type", "OPERATIVO")
        );

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("queryAnalyzed", prompt);
        response.put("consultationDate", LocalDate.now().toString());
        response.put("operationSummary", Map.of(
                "originCountry", "Colombia",
                "destinationCountry", country.getNameEs() + " (" + country.getIso2() + ")",
                "productPresentation", (isGround ? "Café tostado y molido" : "Café tostado en grano") + (isDecaf ? " descafeinado" : " sin descafeinar"),
                "quantityKg", quantityKg,
                "suggestedHsCode", hsCode,
                "hsVerificationNote", "090121 = café tostado sin descafeinar; 090122 = café tostado descafeinado. Verificar subpartida nacional de 10 dígitos con agente de aduana."
        ));
        response.put("regulatoryRequirements", reqs);
        response.put("applicableDocuments", requiredDocs);
        response.put("exporterResponsibilities", List.of(
                "Garantizar inocuidad, trazabilidad de lote y vida útil validada del café tostado.",
                "Cumplir etiquetado en idioma y formato del país destino.",
                "Mantener registro vigente ante autoridad sanitaria (ej. FDA Food Facility para EE.UU.) y trámites DIAN/FNC en Colombia.",
                "Emitir factura comercial, lista de empaque, ficha técnica y certificados aplicables."
        ));
        response.put("importerResponsibilities", List.of(
                "Actuar como importador registrado en aduana de destino (Importer of Record).",
                "En EE.UU.: cumplir con FSVP (Foreign Supplier Verification Program) y coordinar FDA Prior Notice.",
                "Liquidar aranceles, impuestos internos (ej. Kaffeesteuer en Alemania) y liberación aduanera."
        ));
        response.put("timeline", timeline);
        response.put("missingDocumentAlerts", missingAlerts);
        response.put("pendingValidationItems", List.of(
                "Confirmar subpartida arancelaria exacta en el arancel vigente de " + country.getNameEs() + ".",
                "Validar si el comprador solicita certificaciones privadas (Orgánico, Rainforest, Kosher, Fair Trade).",
                "Confirmar Incoterm pactado para delimitar seguro, flete y despacho aduanero."
        ));
        response.put("dataProvenance", DataProvenance.OFFICIAL.name());
        response.put("legalDisclaimer", "Export Copilot cita fuentes oficiales con fecha de consulta, pero NO garantiza cumplimiento automático ni sustituye asesoría aduanera, sanitaria o legal profesional.");
        return response;
    }

    public List<ExportDocument> listDocuments(Long requestedCompanyId) {
        Long companyId = TenantContext.resolveCompanyId(requestedCompanyId);
        return companyId != null ? docRepo.findByCompanyIdOrderByUploadedAtDesc(companyId) : docRepo.findAll();
    }

    @Transactional
    public ExportDocument uploadAndInspectPdf(MultipartFile file, String documentType, Long orderId) {
        Long companyId = TenantContext.resolveCompanyId(null);
        if (file == null || file.isEmpty()) {
            throw new ApiException(400, "Debe seleccionar un archivo PDF o texto para cargar");
        }
        String extractedText = "";
        try {
            String original = file.getOriginalFilename() != null ? file.getOriginalFilename() : "documento.pdf";
            if (original.toLowerCase().endsWith(".pdf")) {
                try (PDDocument pdf = Loader.loadPDF(file.getBytes())) {
                    extractedText = new PDFTextStripper().getText(pdf);
                }
            } else {
                extractedText = new String(file.getBytes());
            }
        } catch (Exception ex) {
            extractedText = "No se pudo extraer texto automáticamente: " + ex.getMessage();
        }

        Map<String, Object> extracted = new LinkedHashMap<>();
        extracted.put("characterCount", extractedText.length());
        extracted.put("detectedHs090121", extractedText.contains("090121") || extractedText.contains("0901.21"));
        extracted.put("detectedHs090122", extractedText.contains("090122") || extractedText.contains("0901.22"));
        extracted.put("detectedFdaMention", extractedText.toUpperCase().contains("FDA"));
        extracted.put("detectedColombiaOrigin", extractedText.toLowerCase().contains("colombia"));
        extracted.put("preview", extractedText.length() > 280 ? extractedText.substring(0, 280) + "..." : extractedText);

        ExportDocument doc = new ExportDocument();
        doc.setCompanyId(companyId);
        doc.setOrderId(orderId);
        doc.setDocumentType(documentType != null && !documentType.isBlank() ? documentType : "COMMERCIAL_INVOICE");
        doc.setFileName(file.getOriginalFilename() != null ? file.getOriginalFilename() : "documento.pdf");
        doc.setStatus("UPLOADED");
        doc.setExtractedMetadataJson(extracted.toString());
        doc.setValidationNotes("Texto inspeccionado automáticamente; pendiente aprobación final de analista de cumplimiento.");
        doc.setCreatedBy(TenantContext.require().email());
        doc = docRepo.save(doc);

        audit.log(companyId, "UPLOAD", "ExportDocument", String.valueOf(doc.getId()), doc.getFileName());
        return doc;
    }

    @Transactional
    public ExportDocument updateDocumentStatus(Long docId, String status, String notes) {
        ExportDocument doc = docRepo.findById(docId).orElseThrow(() -> new ApiException(404, "Documento no encontrado"));
        TenantContext.assertCompanyAccess(doc.getCompanyId());
        doc.setStatus(status);
        if (notes != null) doc.setValidationNotes(notes);
        return docRepo.save(doc);
    }
}
