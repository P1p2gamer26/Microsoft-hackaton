package com.asoexport.cvb.web;

import com.asoexport.cvb.domain.AppUser;
import com.asoexport.cvb.domain.Company;
import com.asoexport.cvb.domain.Country;
import com.asoexport.cvb.domain.Notification;
import com.asoexport.cvb.repository.CountryRepository;
import com.asoexport.cvb.service.AdminService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class AuthAndAdminController {

    private final AdminService adminService;
    private final CountryRepository countryRepo;

    public AuthAndAdminController(AdminService adminService, CountryRepository countryRepo) {
        this.adminService = adminService;
        this.countryRepo = countryRepo;
    }

    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of("status", "UP", "service", "CoffeBite API", "timestamp", Instant.now().toString());
    }

    @PostMapping("/auth/login")
    public Map<String, Object> login(@RequestBody Map<String, String> body) {
        return adminService.login(body.getOrDefault("email", ""), body.getOrDefault("password", ""));
    }

    @GetMapping("/auth/demo-accounts")
    public List<Map<String, Object>> demoAccounts() {
        return adminService.getDemoAccounts();
    }

    @GetMapping("/countries")
    public List<Country> countries() {
        return countryRepo.findAll();
    }

    @GetMapping("/notifications")
    public List<Notification> notifications() {
        return adminService.getNotifications();
    }

    @PatchMapping("/notifications/{id}/read")
    public Map<String, String> markRead(@PathVariable Long id) {
        adminService.markNotificationRead(id);
        return Map.of("status", "OK");
    }

    @GetMapping("/search")
    public Map<String, Object> search(@RequestParam(defaultValue = "") String q) {
        return adminService.globalSearch(q);
    }

    @GetMapping("/admin/overview")
    @PreAuthorize("hasRole('GENERAL_ADMIN') or hasAuthority('ADMIN_MANAGE') or hasRole('EXPORTER_ADMIN')")
    public Map<String, Object> adminOverview() {
        return adminService.getAdminOverview();
    }

    @PostMapping("/admin/users")
    @PreAuthorize("hasRole('GENERAL_ADMIN') or hasAuthority('ADMIN_MANAGE')")
    public AppUser createUser(@RequestBody Map<String, Object> body) {
        return adminService.createUser(body);
    }

    @PostMapping("/admin/companies")
    @PreAuthorize("hasRole('GENERAL_ADMIN') or hasAuthority('ADMIN_MANAGE')")
    public Company createCompany(@RequestBody Map<String, Object> body) {
        return adminService.createCompany(body);
    }
}
