package com.asoexport.cvb.common;

import java.util.Set;

public final class TenantContext {
    private static final ThreadLocal<CurrentUser> HOLDER = new ThreadLocal<>();

    public record CurrentUser(
            Long userId,
            String email,
            String fullName,
            String roleCode,
            Long companyId,
            String companyName,
            Set<String> permissions
    ) {
        public boolean isGeneralAdmin() {
            return "GENERAL_ADMIN".equals(roleCode);
        }

        public boolean hasPermission(String permission) {
            return isGeneralAdmin() || (permissions != null && permissions.contains(permission));
        }
    }

    private TenantContext() {}

    public static void set(CurrentUser user) {
        HOLDER.set(user);
    }

    public static CurrentUser get() {
        return HOLDER.get();
    }

    public static CurrentUser require() {
        CurrentUser user = HOLDER.get();
        if (user == null) {
            throw new ApiException(401, "Autenticación requerida");
        }
        return user;
    }

    public static Long resolveCompanyId(Long requestedCompanyId) {
        CurrentUser user = require();
        if (user.isGeneralAdmin()) {
            return requestedCompanyId != null ? requestedCompanyId : user.companyId();
        }
        if (requestedCompanyId != null && !requestedCompanyId.equals(user.companyId())) {
            throw new ApiException(403, "Acceso denegado: aislamiento de datos entre empresas activo");
        }
        return user.companyId();
    }

    public static void assertCompanyAccess(Long entityCompanyId) {
        CurrentUser user = require();
        if (entityCompanyId == null || user.isGeneralAdmin()) {
            return;
        }
        if (!entityCompanyId.equals(user.companyId())) {
            throw new ApiException(403, "Acceso denegado: no puede acceder a registros de otra empresa");
        }
    }

    public static void clear() {
        HOLDER.remove();
    }
}
