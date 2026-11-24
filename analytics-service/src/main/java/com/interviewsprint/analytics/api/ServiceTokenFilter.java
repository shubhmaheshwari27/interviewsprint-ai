package com.interviewsprint.analytics.api;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

/**
 * Optional shared-secret check for the /api endpoints. When SERVICE_TOKEN is set,
 * callers must send it in the X-Service-Token header; health checks stay open.
 */
@Component
public class ServiceTokenFilter extends OncePerRequestFilter {

    private final String token;

    public ServiceTokenFilter(@Value("${service.token:}") String token) {
        this.token = token;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return token.isBlank() || !request.getRequestURI().startsWith("/api/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String provided = request.getHeader("X-Service-Token");
        boolean ok = provided != null && MessageDigest.isEqual(
                provided.getBytes(StandardCharsets.UTF_8), token.getBytes(StandardCharsets.UTF_8));
        if (!ok) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Missing or invalid X-Service-Token");
            return;
        }
        chain.doFilter(request, response);
    }
}
