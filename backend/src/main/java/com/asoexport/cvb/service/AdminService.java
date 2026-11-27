package com.asoexport.cvb.service;

import com.asoexport.cvb.common.ApiException;
import com.asoexport.cvb.common.DataProvenance;
import com.asoexport.cvb.common.TenantContext;
import com.asoexport.cvb.config.JwtService;
import com.asoexport.cvb.domain.*;
import com.asoexport.cvb.repository.*;
import com.asoexport.cvb.service.connectors.ConnectorRegistry;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
public class AdminService {

    private final UserRepository userRepo;
    private final RoleRepository roleRepo;
    private final CompanyRepository companyRepo;
    private final AuditLogRepository auditRepo;
    private final NotificationRepository notifRepo;
    private final DataSourceConfigRepository dsRepo;
    private final ProductRepository productRepo;
    private final BuyerRepository buyerRepo;
    private final OrderRepository orderRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final ConnectorRegistry connectorRegistry;
    private final AuditService audit;

    public AdminService(UserRepository userRepo, RoleRepository roleRepo, CompanyRepository companyRepo,
                        AuditLogRepository auditRepo, NotificationRepository notifRepo,
                        DataSourceConfigRepository dsRepo, ProductRepository productRepo,
                        BuyerRepository buyerRepo, OrderRepository orderRepo,
                        PasswordEncoder passwordEncoder, JwtService jwtService,
                        ConnectorRegistry connectorRegistry, AuditService audit) {
        this.userRepo = userRepo; this.roleRepo = roleRepo; this.companyRepo = companyRepo;
        this.auditRepo = auditRepo; this.notifRepo = notifRepo; this.dsRepo = dsRepo;
        this.productRepo = productRepo; this.buyerRepo = buyerRepo; this.orderRepo = orderRepo;
        this.passwordEncoder = passwordEncoder; this.jwtService = jwtService;
        this.connectorRegistry = connectorRegistry; this.audit = audit;
    }

    public Map<String, Object> login(String email, String password) {
        AppUser user = userRepo.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new ApiException(401, "Credenciales inválidas"));
        if (!user.isActive() || !passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new ApiException(401, "Credenciales inválidas o usuario inactivo");
        }
        user.setLastLoginAt(Instant.now());
        userRepo.save(user);

        List<String> perms = user.getRole().getPermissions().stream().map(Permission::getCode).sorted().toList();
        Long cid = user.getPrimaryCompany() != null ? user.getPrimaryCompany().getId() : null;
        String cname = user.getPrimaryCompany() != null ? user.getPrimaryCompany().getName() : "ASOEXPORT";

        String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getFullName(),
                user.getRole().getCode(), cid, cname, perms);

        auditRepo.save(new AuditLog(cid, user.getEmail(), "LOGIN", "User", String.valueOf(user.getId()), "Inicio de sesión exitoso"));

        return Map.of(
                "token", token,
                "user", Map.of(
                        "id", user.getId(),
                        "email", user.getEmail(),
                        "fullName", user.getFullName(),
                        "roleCode", user.getRole().getCode(),
                        "roleName", user.getRole().getName(),
                        "companyId", cid != null ? cid : 0,
                        "companyName", cname,
                        "language", user.getLanguage(),
                        "permissions", perms
                )
        );
    }

    public List<Map<String, Object>> getDemoAccounts() {
        return List.of(
                Map.of("email", "admin@cvb-demo.co", "password", "Demo2026!", "role", "Administrador General (ASOEXPORT)", "company", "ASOEXPORT Colombia (Acceso multi-empresa)"),
                Map.of("email", "exportador@cordillera-demo.co", "password", "Demo2026!", "role", "Admin Empresa Exportadora", "company", "Tostadora Cordillera Alta S.A.S. (DEMO)"),
                Map.of("email", "exportador@sierraverde-demo.co", "password", "Demo2026!", "role", "Admin Empresa Exportadora (Aislada)", "company", "Café Origen Sierra Verde Ltda. (DEMO)"),
                Map.of("email", "comercial@cordillera-demo.co", "password", "Demo2026!", "role", "Analista Comercial", "company", "Tostadora Cordillera Alta S.A.S. (DEMO)"),
                Map.of("email", "logistica@cordillera-demo.co", "password", "Demo2026!", "role", "Analista Logístico", "company", "Tostadora Cordillera Alta S.A.S. (DEMO)"),
                Map.of("email", "cumplimiento@cordillera-demo.co", "password", "Demo2026!", "role", "Analista de Cumplimiento", "company", "Tostadora Cordillera Alta S.A.S. (DEMO)"),
                Map.of("email", "visualizador@cordillera-demo.co", "password", "Demo2026!", "role", "Visualizador (Solo lectura)", "company", "Tostadora Cordillera Alta S.A.S. (DEMO)")
        );
    }

    public Map<String, Object> getAdminOverview() {
        TenantContext.CurrentUser u = TenantContext.require();
        boolean admin = u.isGeneralAdmin();
        return Map.of(
                "users", admin ? userRepo.findAll() : userRepo.findByPrimaryCompanyId(u.companyId()),
                "roles", roleRepo.findAll(),
                "companies", admin ? companyRepo.findAll() : companyRepo.findById(u.companyId()).map(List::of).orElse(List.of()),
                "auditLogs", admin ? auditRepo.findTop100ByOrderByCreatedAtDesc() : auditRepo.findTop100ByCompanyIdOrderByCreatedAtDesc(u.companyId()),
                "dataSources", dsRepo.findAll(),
                "connectors", connectorRegistry.listStatuses()
        );
    }

    @Transactional
    public AppUser createUser(Map<String, Object> body) {
        if (!TenantContext.require().isGeneralAdmin()) {
            throw new ApiException(403, "Solo el Administrador General puede crear usuarios");
        }
        String email = String.valueOf(body.get("email")).trim().toLowerCase();
        if (userRepo.findByEmail(email).isPresent()) {
            throw new ApiException(409, "Ya existe un usuario con ese correo");
        }
        Role role = roleRepo.findByCode(String.valueOf(body.get("roleCode")))
                .orElseThrow(() -> new ApiException(404, "Rol no encontrado"));
        Company company = companyRepo.findById(Long.valueOf(String.valueOf(body.get("companyId"))))
                .orElseThrow(() -> new ApiException(404, "Empresa no encontrada"));

        AppUser u = new AppUser();
        u.setEmail(email);
        u.setFullName(String.valueOf(body.get("fullName")));
        u.setPasswordHash(passwordEncoder.encode(String.valueOf(body.getOrDefault("password", "Demo2026!"))));
        u.setRole(role);
        u.setPrimaryCompany(company);
        u.setCreatedBy(TenantContext.require().email());
        u = userRepo.save(u);
        audit.log(company.getId(), "CREATE", "AppUser", String.valueOf(u.getId()), u.getEmail());
        return u;
    }

    @Transactional
    public Company createCompany(Map<String, Object> body) {
        if (!TenantContext.require().isGeneralAdmin()) {
            throw new ApiException(403, "Solo el Administrador General puede registrar empresas");
        }
        Company c = new Company();
        c.setTaxId(String.valueOf(body.get("taxId")));
        c.setName(String.valueOf(body.get("name")));
        c.setLegalName(String.valueOf(body.getOrDefault("legalName", body.get("name"))));
        c.setCompanyType(String.valueOf(body.getOrDefault("companyType", "EXPORTER")));
        c.setCity(String.valueOf(body.getOrDefault("city", "")));
        c.setEmail(String.valueOf(body.getOrDefault("email", "")));
        c.setDataProvenance(DataProvenance.USER_INPUT);
        c.setCreatedBy(TenantContext.require().email());
        c = companyRepo.save(c);
        audit.log(c.getId(), "CREATE", "Company", String.valueOf(c.getId()), c.getName());
        return c;
    }

    public List<Notification> getNotifications() {
        TenantContext.CurrentUser u = TenantContext.require();
        return u.isGeneralAdmin() ? notifRepo.findAllByOrderByCreatedAtDesc()
                : notifRepo.findByCompanyIdOrderByCreatedAtDesc(u.companyId());
    }

    @Transactional
    public void markNotificationRead(Long id) {
        notifRepo.findById(id).ifPresent(n -> {
            TenantContext.assertCompanyAccess(n.getCompanyId());
            n.setRead(true);
            notifRepo.save(n);
        });
    }

    public Map<String, Object> globalSearch(String q) {
        String term = q != null ? q.trim().toLowerCase() : "";
        Long cid = TenantContext.resolveCompanyId(null);
        boolean admin = TenantContext.require().isGeneralAdmin();
        if (term.isEmpty()) return Map.of("products", List.of(), "buyers", List.of(), "orders", List.of());

        List<Map<String, Object>> prods = (admin ? productRepo.findAll() : productRepo.findByCompanyId(cid)).stream()
                .filter(p -> p.getCommercialName().toLowerCase().contains(term) || p.getSku().toLowerCase().contains(term))
                .limit(5).map(p -> Map.<String, Object>of("id", p.getId(), "label", p.getCommercialName(), "sub", p.getSku())).toList();
        List<Map<String, Object>> buys = (admin ? buyerRepo.findAll() : buyerRepo.findByCompanyIdIsNullOrCompanyId(cid)).stream()
                .filter(b -> b.getCompanyName().toLowerCase().contains(term) || (b.getCityName() != null && b.getCityName().toLowerCase().contains(term)))
                .limit(5).map(b -> Map.<String, Object>of("id", b.getId(), "label", b.getCompanyName(), "sub", b.getCountry().getNameEs())).toList();
        List<Map<String, Object>> ords = (admin ? orderRepo.findAll() : orderRepo.findByCompanyIdOrderByCreatedAtDesc(cid)).stream()
                .filter(o -> o.getOrderNumber().toLowerCase().contains(term) || o.getStatus().toLowerCase().contains(term))
                .limit(5).map(o -> Map.<String, Object>of("id", o.getId(), "label", o.getOrderNumber(), "sub", o.getStatus())).toList();

        return Map.of("products", prods, "buyers", buys, "orders", ords);
    }
}
