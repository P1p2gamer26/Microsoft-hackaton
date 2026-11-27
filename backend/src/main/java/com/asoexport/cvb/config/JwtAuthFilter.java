package com.asoexport.cvb.config;

import com.asoexport.cvb.common.TenantContext;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {
    private final JwtService jwtService;

    public JwtAuthFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        try {
            String header = request.getHeader("Authorization");
            if (header != null && header.startsWith("Bearer ")) {
                String token = header.substring(7);
                Claims claims = jwtService.parseToken(token);
                String email = claims.getSubject();
                Long uid = ((Number) claims.get("uid")).longValue();
                String name = String.valueOf(claims.get("name"));
                String role = String.valueOf(claims.get("role"));
                Long cidRaw = ((Number) claims.get("cid")).longValue();
                Long cid = cidRaw == 0L ? null : cidRaw;
                String cname = String.valueOf(claims.get("cname"));

                Set<String> perms = new HashSet<>();
                List<SimpleGrantedAuthority> authorities = new ArrayList<>();
                authorities.add(new SimpleGrantedAuthority("ROLE_" + role));
                Object permsObj = claims.get("perms");
                if (permsObj instanceof List<?> list) {
                    for (Object p : list) {
                        String code = String.valueOf(p);
                        perms.add(code);
                        authorities.add(new SimpleGrantedAuthority(code));
                    }
                }

                TenantContext.set(new TenantContext.CurrentUser(uid, email, name, role, cid, cname, perms));
                var auth = new UsernamePasswordAuthenticationToken(email, null, authorities);
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
            chain.doFilter(request, response);
        } catch (Exception ignored) {
            SecurityContextHolder.clearContext();
            TenantContext.clear();
            chain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }
}
